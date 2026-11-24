const prisma = require('../utils/prisma');

const formatDateKey = (date) => {
  return new Date(date).toISOString().slice(0, 10);
};

const getUserOverview = async (userId) => {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      status: { in: ['COMPLETED', 'EXPIRED'] },
    },
    orderBy: { completedAt: 'asc' },
    include: {
      quiz: {
        select: {
          passingScore: true,
        },
      },
    },
  });

  const totalAttempts = attempts.length;
  let passedCount = 0;
  let failedCount = 0;
  let sumPercentage = 0;
  let highestScore = 0;
  let totalQuestionsAnswered = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalUnanswered = 0;
  let totalTimeTaken = 0;

  for (const a of attempts) {
    const passed = a.percentage >= a.quiz.passingScore;
    if (passed) passedCount += 1;
    else failedCount += 1;

    sumPercentage += a.percentage;
    if (a.percentage > highestScore) highestScore = a.percentage;

    totalCorrect += a.correctAnswers;
    totalIncorrect += a.incorrectAnswers;
    totalUnanswered += a.unanswered;
    totalQuestionsAnswered += a.correctAnswers + a.incorrectAnswers;
    totalTimeTaken += a.timeTaken;
  }

  return {
    totalAttempts,
    passedCount,
    failedCount,
    averageScore:
      totalAttempts > 0 ? Number((sumPercentage / totalAttempts).toFixed(1)) : 0,
    highestScore: Number(highestScore.toFixed(1)),
    totalQuestionsAnswered,
    totalCorrect,
    totalIncorrect,
    totalUnanswered,
    totalTimeTaken,
  };
};

const getUserPerformance = async (userId) => {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      status: { in: ['COMPLETED', 'EXPIRED'] },
    },
    orderBy: { completedAt: 'asc' },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          difficulty: true,
          passingScore: true,
        },
      },
    },
  });

  const scoreOverTime = attempts.map((a, index) => ({
    attemptId: a.id,
    label: `#${index + 1}`,
    date: a.completedAt ? formatDateKey(a.completedAt) : formatDateKey(a.startedAt),
    quizTitle: a.quiz.title,
    score: Number(a.percentage.toFixed(1)),
  }));

  const attemptsByDateMap = new Map();
  for (const a of attempts) {
    const dateKey = a.completedAt
      ? formatDateKey(a.completedAt)
      : formatDateKey(a.startedAt);
    attemptsByDateMap.set(dateKey, (attemptsByDateMap.get(dateKey) || 0) + 1);
  }
  const attemptsOverTime = Array.from(attemptsByDateMap.entries()).map(
    ([date, count]) => ({ date, attempts: count })
  );

  const diffBuckets = {
    EASY: { difficulty: 'EASY', attempts: 0, totalPercentage: 0, passed: 0 },
    MEDIUM: { difficulty: 'MEDIUM', attempts: 0, totalPercentage: 0, passed: 0 },
    HARD: { difficulty: 'HARD', attempts: 0, totalPercentage: 0, passed: 0 },
  };

  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  for (const a of attempts) {
    correct += a.correctAnswers;
    incorrect += a.incorrectAnswers;
    unanswered += a.unanswered;

    const bucket = diffBuckets[a.quiz.difficulty];
    if (bucket) {
      bucket.attempts += 1;
      bucket.totalPercentage += a.percentage;
      if (a.percentage >= a.quiz.passingScore) {
        bucket.passed += 1;
      }
    }
  }

  const performanceByDifficulty = Object.values(diffBuckets).map((b) => ({
    difficulty: b.difficulty,
    attempts: b.attempts,
    averageScore:
      b.attempts > 0 ? Number((b.totalPercentage / b.attempts).toFixed(1)) : 0,
    passRate:
      b.attempts > 0 ? Number(((b.passed / b.attempts) * 100).toFixed(1)) : 0,
  }));

  const answerDistribution = [
    { name: 'Correct', value: correct },
    { name: 'Incorrect', value: incorrect },
    { name: 'Unanswered', value: unanswered },
  ];

  return {
    scoreOverTime,
    attemptsOverTime,
    performanceByDifficulty,
    answerDistribution,
  };
};

const getUserSubjectAnalytics = async (userId) => {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      status: { in: ['COMPLETED', 'EXPIRED'] },
    },
    include: {
      quiz: {
        select: {
          passingScore: true,
          category: {
            select: {
              subject: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  const subjectMap = new Map();

  for (const a of attempts) {
    const subject = a.quiz?.category?.subject;
    if (!subject) continue;

    if (!subjectMap.has(subject.id)) {
      subjectMap.set(subject.id, {
        subjectId: subject.id,
        subject: subject.name,
        attempts: 0,
        passed: 0,
        totalPercentage: 0,
        highestScore: 0,
      });
    }

    const entry = subjectMap.get(subject.id);
    entry.attempts += 1;
    entry.totalPercentage += a.percentage;
    if (a.percentage >= a.quiz.passingScore) {
      entry.passed += 1;
    }
    if (a.percentage > entry.highestScore) {
      entry.highestScore = a.percentage;
    }
  }

  return Array.from(subjectMap.values())
    .map((s) => ({
      subjectId: s.subjectId,
      subject: s.subject,
      attempts: s.attempts,
      averageScore: Number((s.totalPercentage / s.attempts).toFixed(1)),
      highestScore: Number(s.highestScore.toFixed(1)),
      passRate: Number(((s.passed / s.attempts) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.averageScore - a.averageScore);
};

const getAdminAnalytics = async () => {
  const [users, attempts] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.quizAttempt.findMany({
      where: { status: { in: ['COMPLETED', 'EXPIRED'] } },
      orderBy: { completedAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            category: {
              select: {
                subject: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const regMap = new Map();
  for (const u of users) {
    const key = formatDateKey(u.createdAt);
    regMap.set(key, (regMap.get(key) || 0) + 1);
  }
  const userRegistrations = Array.from(regMap.entries()).map(([date, count]) => ({
    date,
    registrations: count,
  }));

  const attemptDateMap = new Map();
  const subjectScoreMap = new Map();
  const popularQuizMap = new Map();
  const activeUserMap = new Map();

  for (const a of attempts) {
    const dateKey = a.completedAt
      ? formatDateKey(a.completedAt)
      : formatDateKey(a.startedAt);
    attemptDateMap.set(dateKey, (attemptDateMap.get(dateKey) || 0) + 1);

    const subjectName = a.quiz?.category?.subject?.name || 'Other';
    if (!subjectScoreMap.has(subjectName)) {
      subjectScoreMap.set(subjectName, {
        subject: subjectName,
        totalPercentage: 0,
        attempts: 0,
      });
    }
    const subj = subjectScoreMap.get(subjectName);
    subj.totalPercentage += a.percentage;
    subj.attempts += 1;

    if (!popularQuizMap.has(a.quizId)) {
      popularQuizMap.set(a.quizId, {
        quizId: a.quizId,
        title: a.quiz.title,
        attempts: 0,
        totalPercentage: 0,
      });
    }
    const pq = popularQuizMap.get(a.quizId);
    pq.attempts += 1;
    pq.totalPercentage += a.percentage;

    if (!activeUserMap.has(a.userId)) {
      activeUserMap.set(a.userId, {
        userId: a.userId,
        name: a.user.name,
        email: a.user.email,
        attempts: 0,
        totalPercentage: 0,
      });
    }
    const au = activeUserMap.get(a.userId);
    au.attempts += 1;
    au.totalPercentage += a.percentage;
  }

  return {
    userRegistrations,
    quizAttemptsOverTime: Array.from(attemptDateMap.entries()).map(
      ([date, count]) => ({ date, attempts: count })
    ),
    averageScoresBySubject: Array.from(subjectScoreMap.values()).map((s) => ({
      subject: s.subject,
      averageScore: Number((s.totalPercentage / s.attempts).toFixed(1)),
      attempts: s.attempts,
    })),
    popularQuizzes: Array.from(popularQuizMap.values())
      .map((q) => ({
        quizId: q.quizId,
        title: q.title,
        attempts: q.attempts,
        averageScore: Number((q.totalPercentage / q.attempts).toFixed(1)),
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 6),
    mostActiveUsers: Array.from(activeUserMap.values())
      .map((u) => ({
        userId: u.userId,
        name: u.name,
        email: u.email,
        attempts: u.attempts,
        averageScore: Number((u.totalPercentage / u.attempts).toFixed(1)),
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 8),
  };
};

module.exports = {
  getUserOverview,
  getUserPerformance,
  getUserSubjectAnalytics,
  getAdminAnalytics,
};
