const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

const QUIZ_BASE_INCLUDE = {
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
    select: { quizQuestions: true, attempts: true },
  },
};

const listQuizzes = async (
  {
    search,
    subjectId,
    categoryId,
    difficulty,
    status,
    maxDuration,
    page = 1,
    limit = 12,
  } = {},
  { isAdmin = false } = {}
) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 12));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    ...(isAdmin ? (status ? { status } : {}) : { status: 'PUBLISHED' }),
    ...(categoryId ? { categoryId: Number(categoryId) } : {}),
    ...(subjectId ? { category: { subjectId: Number(subjectId) } } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(maxDuration ? { timeLimit: { lte: Number(maxDuration) } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: QUIZ_BASE_INCLUDE,
    }),
    prisma.quiz.count({ where }),
  ]);

  return {
    quizzes,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

const getQuizById = async (id, { isAdmin = false } = {}) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      ...QUIZ_BASE_INCLUDE,
      ...(isAdmin
        ? {
            quizQuestions: {
              include: {
                question: {
                  select: {
                    id: true,
                    questionText: true,
                    difficulty: true,
                    categoryId: true,
                    category: { select: { id: true, name: true } },
                  },
                },
              },
            },
          }
        : {}),
    },
  });

  if (!quiz || (!isAdmin && quiz.status !== 'PUBLISHED')) {
    throw new ApiError(404, 'Quiz not found');
  }

  return quiz;
};

const validateQuestionIds = async (questionIds) => {
  const uniqueIds = [...new Set(questionIds)];
  if (uniqueIds.length === 0) return [];

  const found = await prisma.question.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });

  if (found.length !== uniqueIds.length) {
    throw new ApiError(400, 'One or more selected questions do not exist');
  }

  return uniqueIds;
};

const createQuiz = async (payload) => {
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new ApiError(404, 'Selected category not found');
  }

  const uniqueQuestionIds = await validateQuestionIds(payload.questionIds || []);

  if (
    payload.status === 'PUBLISHED' &&
    uniqueQuestionIds.length < payload.questionCount
  ) {
    throw new ApiError(
      400,
      `Cannot publish quiz: select at least ${payload.questionCount} questions from the question bank (currently ${uniqueQuestionIds.length} selected).`
    );
  }

  return prisma.$transaction(async (tx) => {
    const quiz = await tx.quiz.create({
      data: {
        categoryId: payload.categoryId,
        title: payload.title,
        description: payload.description || null,
        difficulty: payload.difficulty,
        timeLimit: payload.timeLimit,
        passingScore: payload.passingScore,
        questionCount: payload.questionCount,
        status: payload.status || 'DRAFT',
      },
    });

    if (uniqueQuestionIds.length > 0) {
      await tx.quizQuestion.createMany({
        data: uniqueQuestionIds.map((questionId) => ({
          quizId: quiz.id,
          questionId,
        })),
      });
    }

    return tx.quiz.findUnique({
      where: { id: quiz.id },
      include: QUIZ_BASE_INCLUDE,
    });
  });
};

const updateQuiz = async (id, payload) => {
  const existing = await prisma.quiz.findUnique({
    where: { id },
    include: {
      _count: { select: { quizQuestions: true } },
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Quiz not found');
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

  const nextStatus = payload.status ?? existing.status;
  const nextQuestionCount = payload.questionCount ?? existing.questionCount;
  let uniqueQuestionIds = null;

  if (payload.questionIds !== undefined) {
    uniqueQuestionIds = await validateQuestionIds(payload.questionIds);
  }

  const effectivePoolSize =
    uniqueQuestionIds !== null
      ? uniqueQuestionIds.length
      : existing._count.quizQuestions;

  if (nextStatus === 'PUBLISHED' && effectivePoolSize < nextQuestionCount) {
    throw new ApiError(
      400,
      `Cannot publish quiz: at least ${nextQuestionCount} bank questions must be linked (currently ${effectivePoolSize}).`
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.quiz.update({
      where: { id },
      data: {
        ...(payload.categoryId !== undefined ? { categoryId: payload.categoryId } : {}),
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.description !== undefined
          ? { description: payload.description || null }
          : {}),
        ...(payload.difficulty !== undefined ? { difficulty: payload.difficulty } : {}),
        ...(payload.timeLimit !== undefined ? { timeLimit: payload.timeLimit } : {}),
        ...(payload.passingScore !== undefined
          ? { passingScore: payload.passingScore }
          : {}),
        ...(payload.questionCount !== undefined
          ? { questionCount: payload.questionCount }
          : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      },
    });

    if (uniqueQuestionIds !== null) {
      await tx.quizQuestion.deleteMany({ where: { quizId: id } });
      if (uniqueQuestionIds.length > 0) {
        await tx.quizQuestion.createMany({
          data: uniqueQuestionIds.map((questionId) => ({
            quizId: id,
            questionId,
          })),
        });
      }
    }

    return tx.quiz.findUnique({
      where: { id },
      include: {
        ...QUIZ_BASE_INCLUDE,
        quizQuestions: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                difficulty: true,
                categoryId: true,
              },
            },
          },
        },
      },
    });
  });
};

const deleteQuiz = async (id) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  await prisma.quiz.delete({ where: { id } });
};

module.exports = {
  listQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
};
