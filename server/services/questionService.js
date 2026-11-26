const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

const QUESTION_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
      subject: {
        select: { id: true, name: true },
      },
    },
  },
  _count: {
    select: { quizQuestions: true },
  },
};

const listQuestions = async ({
  search,
  subjectId,
  categoryId,
  difficulty,
  page = 1,
  limit = 10,
} = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    ...(categoryId ? { categoryId: Number(categoryId) } : {}),
    ...(subjectId ? { category: { subjectId: Number(subjectId) } } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(search
      ? {
          OR: [
            { questionText: { contains: search, mode: 'insensitive' } },
            { optionA: { contains: search, mode: 'insensitive' } },
            { optionB: { contains: search, mode: 'insensitive' } },
            { optionC: { contains: search, mode: 'insensitive' } },
            { optionD: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: QUESTION_INCLUDE,
    }),
    prisma.question.count({ where }),
  ]);

  return {
    questions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

const getQuestionById = async (id) => {
  const question = await prisma.question.findUnique({
    where: { id },
    include: QUESTION_INCLUDE,
  });

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  return question;
};

const assertValidCorrectAnswer = (correctAnswer, { optionC, optionD }) => {
  if (correctAnswer === 'C' && !optionC) {
    throw new ApiError(400, 'Correct answer cannot be C when Option C is empty');
  }
  if (correctAnswer === 'D' && !optionD) {
    throw new ApiError(400, 'Correct answer cannot be D when Option D is empty');
  }
};

const createQuestion = async (payload) => {
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new ApiError(404, 'Selected category not found');
  }

  const optionC = payload.optionC || null;
  const optionD = payload.optionD || null;
  assertValidCorrectAnswer(payload.correctAnswer, { optionC, optionD });

  return prisma.question.create({
    data: {
      categoryId: payload.categoryId,
      questionText: payload.questionText,
      optionA: payload.optionA,
      optionB: payload.optionB,
      optionC,
      optionD,
      correctAnswer: payload.correctAnswer,
      explanation: payload.explanation || null,
      difficulty: payload.difficulty,
    },
    include: QUESTION_INCLUDE,
  });
};

const updateQuestion = async (id, payload) => {
  const existing = await prisma.question.findUnique({
    where: { id },
    select: {
      id: true,
      optionC: true,
      optionD: true,
      correctAnswer: true,
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Question not found');
  }

  if (payload.categoryId !== undefined) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new ApiError(404, 'Selected category not found');
    }
  }

  const nextOptionC =
    payload.optionC !== undefined ? payload.optionC || null : existing.optionC;
  const nextOptionD =
    payload.optionD !== undefined ? payload.optionD || null : existing.optionD;
  const nextCorrectAnswer =
    payload.correctAnswer !== undefined
      ? payload.correctAnswer
      : existing.correctAnswer;

  assertValidCorrectAnswer(nextCorrectAnswer, {
    optionC: nextOptionC,
    optionD: nextOptionD,
  });

  return prisma.question.update({
    where: { id },
    data: {
      ...(payload.categoryId !== undefined ? { categoryId: payload.categoryId } : {}),
      ...(payload.questionText !== undefined ? { questionText: payload.questionText } : {}),
      ...(payload.optionA !== undefined ? { optionA: payload.optionA } : {}),
      ...(payload.optionB !== undefined ? { optionB: payload.optionB } : {}),
      ...(payload.optionC !== undefined ? { optionC: nextOptionC } : {}),
      ...(payload.optionD !== undefined ? { optionD: nextOptionD } : {}),
      ...(payload.correctAnswer !== undefined ? { correctAnswer: payload.correctAnswer } : {}),
      ...(payload.explanation !== undefined
        ? { explanation: payload.explanation || null }
        : {}),
      ...(payload.difficulty !== undefined ? { difficulty: payload.difficulty } : {}),
    },
    include: QUESTION_INCLUDE,
  });
};

const deleteQuestion = async (id) => {
  const question = await prisma.question.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  await prisma.question.delete({ where: { id } });
};

module.exports = {
  listQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
