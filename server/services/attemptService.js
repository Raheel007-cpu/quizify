const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

// Allow a small network buffer for auto-submit right at 00:00
const SUBMIT_GRACE_SECONDS = 5;

const shuffleArray = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildTimingMeta = (startedAt, timeLimitMinutes) => {
  const totalSeconds = timeLimitMinutes * 60;
  const expiresAt = new Date(startedAt.getTime() + totalSeconds * 1000);
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - startedAt.getTime()) / 1000)
  );
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

  return {
    totalSeconds,
    elapsedSeconds,
    remainingSeconds,
    expiresAt: expiresAt.toISOString(),
    serverTime: new Date().toISOString(),
  };
};

const formatAttemptQuestionsForStudent = (attemptAnswers) => {
  return attemptAnswers.map((aa) => ({
    id: aa.question.id,
    questionOrder: aa.questionOrder,
    questionText: aa.question.questionText,
    optionA: aa.question.optionA,
    optionB: aa.question.optionB,
    optionC: aa.question.optionC,
    optionD: aa.question.optionD,
    selectedAnswer: aa.selectedAnswer,
  }));
};

const finalizeAttempt = async (attemptId, answersPayload = [], { isExpired = false } = {}) => {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          timeLimit: true,
          passingScore: true,
          difficulty: true,
          category: {
            select: {
              id: true,
              name: true,
              subject: { select: { id: true, name: true } },
            },
          },
        },
      },
      answers: {
        orderBy: { questionOrder: 'asc' },
        include: {
          question: {
            select: {
              id: true,
              correctAnswer: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new ApiError(404, 'Quiz attempt not found');
  }

  const submittedMap = new Map();
  for (const item of answersPayload) {
    submittedMap.set(item.questionId, item.selectedAnswer ?? null);
  }

  const now = new Date();
  const maxSeconds = attempt.quiz.timeLimit * 60;
  const rawElapsed = Math.max(
    0,
    Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000)
  );
  const timeTaken = Math.min(rawElapsed, maxSeconds);

  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let unanswered = 0;

  const updates = attempt.answers.map((row) => {
    const selected = submittedMap.has(row.questionId)
      ? submittedMap.get(row.questionId)
      : row.selectedAnswer;

    let isCorrect = null;
    if (!selected) {
      unanswered += 1;
      isCorrect = false;
    } else if (selected === row.question.correctAnswer) {
      correctAnswers += 1;
      isCorrect = true;
    } else {
      incorrectAnswers += 1;
      isCorrect = false;
    }

    return {
      id: row.id,
      selectedAnswer: selected,
      isCorrect,
    };
  });

  const totalQuestions = attempt.answers.length;
  const percentage =
    totalQuestions > 0
      ? Number(((correctAnswers / totalQuestions) * 100).toFixed(2))
      : 0;

  const finalStatus = isExpired ? 'EXPIRED' : 'COMPLETED';

  const updatedAttempt = await prisma.$transaction(async (tx) => {
    for (const u of updates) {
      await tx.attemptAnswer.update({
        where: { id: u.id },
        data: {
          selectedAnswer: u.selectedAnswer,
          isCorrect: u.isCorrect,
        },
      });
    }

    return tx.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score: correctAnswers,
        percentage,
        correctAnswers,
        incorrectAnswers,
        unanswered,
        timeTaken,
        status: finalStatus,
        completedAt: now,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            timeLimit: true,
            passingScore: true,
            difficulty: true,
            category: {
              select: {
                id: true,
                name: true,
                subject: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  });

  return {
    ...updatedAttempt,
    totalQuestions,
    passed: updatedAttempt.percentage >= updatedAttempt.quiz.passingScore,
  };
};

const startQuizAttempt = async (userId, quizId) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          subject: { select: { id: true, name: true } },
        },
      },
      quizQuestions: {
        select: { questionId: true },
      },
    },
  });

  if (!quiz || quiz.status !== 'PUBLISHED') {
    throw new ApiError(404, 'Quiz not found or not available');
  }

  if (quiz.quizQuestions.length === 0) {
    throw new ApiError(400, 'This quiz currently has no questions configured');
  }

  // Check for an existing IN_PROGRESS attempt by this user for this quiz
  const activeAttempt = await prisma.quizAttempt.findFirst({
    where: {
      userId,
      quizId,
      status: 'IN_PROGRESS',
    },
    orderBy: { startedAt: 'desc' },
    include: {
      answers: {
        orderBy: { questionOrder: 'asc' },
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
            },
          },
        },
      },
    },
  });

  if (activeAttempt) {
    const timing = buildTimingMeta(activeAttempt.startedAt, quiz.timeLimit);
    if (timing.remainingSeconds > 0) {
      return {
        resumed: true,
        attempt: {
          id: activeAttempt.id,
          quizId: activeAttempt.quizId,
          status: activeAttempt.status,
          startedAt: activeAttempt.startedAt,
          ...timing,
        },
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          difficulty: quiz.difficulty,
          timeLimit: quiz.timeLimit,
          passingScore: quiz.passingScore,
          questionCount: activeAttempt.answers.length,
          category: quiz.category,
        },
        questions: formatAttemptQuestionsForStudent(activeAttempt.answers),
      };
    }

    // Previous attempt timed out without submission; auto-finalize it
    await finalizeAttempt(activeAttempt.id, [], { isExpired: true });
  }

  const questionIds = quiz.quizQuestions.map((qq) => qq.questionId);
  const targetCount = Math.min(quiz.questionCount, questionIds.length);
  const selectedIds = shuffleArray(questionIds).slice(0, targetCount);

  const created = await prisma.$transaction(async (tx) => {
    const attempt = await tx.quizAttempt.create({
      data: {
        userId,
        quizId,
        status: 'IN_PROGRESS',
      },
    });

    await tx.attemptAnswer.createMany({
      data: selectedIds.map((questionId, index) => ({
        attemptId: attempt.id,
        questionId,
        questionOrder: index + 1,
      })),
    });

    return tx.quizAttempt.findUnique({
      where: { id: attempt.id },
      include: {
        answers: {
          orderBy: { questionOrder: 'asc' },
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
              },
            },
          },
        },
      },
    });
  });

  const timing = buildTimingMeta(created.startedAt, quiz.timeLimit);

  return {
    resumed: false,
    attempt: {
      id: created.id,
      quizId: created.quizId,
      status: created.status,
      startedAt: created.startedAt,
      ...timing,
    },
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      questionCount: created.answers.length,
      category: quiz.category,
    },
    questions: formatAttemptQuestionsForStudent(created.answers),
  };
};

const getAttemptById = async (attemptId, user) => {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          timeLimit: true,
          passingScore: true,
          category: {
            select: {
              id: true,
              name: true,
              subject: { select: { id: true, name: true } },
            },
          },
        },
      },
      answers: {
        orderBy: { questionOrder: 'asc' },
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
              correctAnswer: true,
              explanation: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new ApiError(404, 'Quiz attempt not found');
  }

  if (attempt.userId !== user.id && user.role !== 'ADMIN') {
    throw new ApiError(403, 'You do not have access to this quiz attempt');
  }

  if (attempt.status === 'IN_PROGRESS') {
    const timing = buildTimingMeta(attempt.startedAt, attempt.quiz.timeLimit);
    if (timing.remainingSeconds <= 0) {
      const finalized = await finalizeAttempt(attempt.id, [], { isExpired: true });
      return getAttemptById(finalized.id, user);
    }

    // Never expose correctAnswer or explanation while IN_PROGRESS
    return {
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        status: attempt.status,
        startedAt: attempt.startedAt,
        ...timing,
      },
      quiz: {
        ...attempt.quiz,
        questionCount: attempt.answers.length,
      },
      questions: formatAttemptQuestionsForStudent(attempt.answers),
    };
  }

  // Completed / Expired attempt includes evaluation and review details
  const totalQuestions = attempt.answers.length;
  return {
    attempt: {
      id: attempt.id,
      quizId: attempt.quizId,
      score: attempt.score,
      percentage: attempt.percentage,
      correctAnswers: attempt.correctAnswers,
      incorrectAnswers: attempt.incorrectAnswers,
      unanswered: attempt.unanswered,
      totalQuestions,
      timeTaken: attempt.timeTaken,
      status: attempt.status,
      passed: attempt.percentage >= attempt.quiz.passingScore,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
    },
    quiz: {
      ...attempt.quiz,
      questionCount: totalQuestions,
    },
    review: attempt.answers.map((aa) => ({
      questionId: aa.question.id,
      questionOrder: aa.questionOrder,
      questionText: aa.question.questionText,
      optionA: aa.question.optionA,
      optionB: aa.question.optionB,
      optionC: aa.question.optionC,
      optionD: aa.question.optionD,
      selectedAnswer: aa.selectedAnswer,
      correctAnswer: aa.question.correctAnswer,
      isCorrect: aa.isCorrect,
      explanation: aa.question.explanation,
    })),
  };
};

const saveAttemptAnswer = async (
  attemptId,
  userId,
  { questionId, selectedAnswer }
) => {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { select: { timeLimit: true } },
    },
  });

  if (!attempt) {
    throw new ApiError(404, 'Quiz attempt not found');
  }

  if (attempt.userId !== userId) {
    throw new ApiError(403, 'You do not have access to this quiz attempt');
  }

  if (attempt.status !== 'IN_PROGRESS') {
    throw new ApiError(409, 'This quiz attempt has already been submitted');
  }

  const timing = buildTimingMeta(attempt.startedAt, attempt.quiz.timeLimit);
  if (timing.elapsedSeconds > timing.totalSeconds + SUBMIT_GRACE_SECONDS) {
    await finalizeAttempt(attemptId, [], { isExpired: true });
    throw new ApiError(409, 'Quiz time limit has expired');
  }

  const answerRow = await prisma.attemptAnswer.findUnique({
    where: {
      attemptId_questionId: {
        attemptId,
        questionId,
      },
    },
    select: { id: true },
  });

  if (!answerRow) {
    throw new ApiError(404, 'Question does not belong to this attempt');
  }

  return prisma.attemptAnswer.update({
    where: { id: answerRow.id },
    data: { selectedAnswer },
    select: {
      questionId: true,
      selectedAnswer: true,
    },
  });
};

const submitQuizAttempt = async (attemptId, userId, { answers = [] } = {}) => {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { select: { timeLimit: true } },
    },
  });

  if (!attempt) {
    throw new ApiError(404, 'Quiz attempt not found');
  }

  if (attempt.userId !== userId) {
    throw new ApiError(403, 'You do not have access to this quiz attempt');
  }

  if (attempt.status !== 'IN_PROGRESS') {
    throw new ApiError(409, 'This quiz attempt has already been submitted');
  }

  const timing = buildTimingMeta(attempt.startedAt, attempt.quiz.timeLimit);
  const isExpired = timing.elapsedSeconds > timing.totalSeconds + SUBMIT_GRACE_SECONDS;

  return finalizeAttempt(attemptId, answers, { isExpired });
};

const listUserAttempts = async (
  userId,
  { page = 1, limit = 15, search, subjectId, result } = {}
) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 15));

  const baseWhere = {
    userId,
    status: { in: ['COMPLETED', 'EXPIRED'] },
  };

  const filteredWhere = {
    ...baseWhere,
    ...(subjectId || search
      ? {
          quiz: {
            ...(subjectId
              ? { category: { subjectId: Number(subjectId) } }
              : {}),
            ...(search
              ? { title: { contains: search, mode: 'insensitive' } }
              : {}),
          },
        }
      : {}),
  };

  // Compute overall performance summary across all completed attempts
  const allCompleted = await prisma.quizAttempt.findMany({
    where: baseWhere,
    select: {
      percentage: true,
      correctAnswers: true,
      incorrectAnswers: true,
      unanswered: true,
      timeTaken: true,
      quiz: {
        select: { passingScore: true },
      },
    },
  });

  const totalAttempts = allCompleted.length;
  let passedCount = 0;
  let sumPercentage = 0;
  let bestPercentage = 0;
  let totalCorrectAnswers = 0;
  let totalQuestionsAnswered = 0;
  let totalTimeTaken = 0;

  for (const item of allCompleted) {
    if (item.percentage >= item.quiz.passingScore) {
      passedCount += 1;
    }
    sumPercentage += item.percentage;
    if (item.percentage > bestPercentage) {
      bestPercentage = item.percentage;
    }
    totalCorrectAnswers += item.correctAnswers;
    totalQuestionsAnswered += item.correctAnswers + item.incorrectAnswers;
    totalTimeTaken += item.timeTaken;
  }

  const summary = {
    totalAttempts,
    passedCount,
    failedCount: totalAttempts - passedCount,
    averagePercentage:
      totalAttempts > 0 ? Number((sumPercentage / totalAttempts).toFixed(1)) : 0,
    bestPercentage: Number(bestPercentage.toFixed(1)),
    totalCorrectAnswers,
    totalQuestionsAnswered,
    accuracyPercentage:
      totalQuestionsAnswered > 0
        ? Number(((totalCorrectAnswers / totalQuestionsAnswered) * 100).toFixed(1))
        : 0,
    totalTimeTaken,
  };

  const matchingAttempts = await prisma.quizAttempt.findMany({
    where: filteredWhere,
    orderBy: { completedAt: 'desc' },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          difficulty: true,
          passingScore: true,
          category: {
            select: {
              id: true,
              name: true,
              subject: { select: { id: true, name: true } },
            },
          },
        },
      },
      _count: {
        select: { answers: true },
      },
    },
  });

  const enriched = matchingAttempts
    .map((a) => ({
      ...a,
      totalQuestions: a._count.answers,
      passed: a.percentage >= a.quiz.passingScore,
    }))
    .filter((a) => {
      if (result === 'PASSED') return a.passed;
      if (result === 'FAILED') return !a.passed;
      return true;
    });

  const total = enriched.length;
  const start = (pageNum - 1) * limitNum;
  const paginatedAttempts = enriched.slice(start, start + limitNum);

  return {
    summary,
    attempts: paginatedAttempts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

module.exports = {
  startQuizAttempt,
  getAttemptById,
  saveAttemptAnswer,
  submitQuizAttempt,
  listUserAttempts,
};
