const prisma = require('../utils/prisma');

const getAdminOverview = async () => {
  const [
    totalUsers,
    totalSubjects,
    totalCategories,
    totalQuizzes,
    publishedQuizzes,
    totalQuestions,
    totalAttempts,
    questionsByDifficulty,
    quizzesByDifficulty,
    recentQuizzes,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subject.count(),
    prisma.category.count(),
    prisma.quiz.count(),
    prisma.quiz.count({ where: { status: 'PUBLISHED' } }),
    prisma.question.count(),
    prisma.quizAttempt.count(),
    prisma.question.groupBy({
      by: ['difficulty'],
      _count: { id: true },
    }),
    prisma.quiz.groupBy({
      by: ['difficulty'],
      _count: { id: true },
    }),
    prisma.quiz.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            name: true,
            subject: { select: { name: true } },
          },
        },
        _count: { select: { quizQuestions: true, attempts: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    stats: {
      totalUsers,
      totalSubjects,
      totalCategories,
      totalQuizzes,
      publishedQuizzes,
      totalQuestions,
      totalAttempts,
    },
    questionsByDifficulty: questionsByDifficulty.map((row) => ({
      difficulty: row.difficulty,
      count: row._count.id,
    })),
    quizzesByDifficulty: quizzesByDifficulty.map((row) => ({
      difficulty: row.difficulty,
      count: row._count.id,
    })),
    recentQuizzes,
    recentUsers,
  };
};

const listAllAttempts = async ({ page = 1, limit = 15 } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 15));
  const skip = (pageNum - 1) * limitNum;

  const [attempts, total] = await Promise.all([
    prisma.quizAttempt.findMany({
      skip,
      take: limitNum,
      orderBy: { startedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            category: {
              select: {
                name: true,
                subject: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.quizAttempt.count(),
  ]);

  return {
    attempts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

module.exports = {
  getAdminOverview,
  listAllAttempts,
};
