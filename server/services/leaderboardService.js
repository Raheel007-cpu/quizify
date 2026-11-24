const prisma = require('../utils/prisma');

const DIFFICULTY_MULTIPLIER = {
  EASY: 1.0,
  MEDIUM: 1.25,
  HARD: 1.5,
};

const POINTS_PER_CORRECT = 10;
const PASS_BONUS_POINTS = 20;

const calculateAttemptPoints = ({
  correctAnswers,
  difficulty,
  percentage,
  passingScore,
}) => {
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] || 1.0;
  const basePoints = Math.round(correctAnswers * POINTS_PER_CORRECT * multiplier);
  const bonus = percentage >= passingScore ? PASS_BONUS_POINTS : 0;
  return basePoints + bonus;
};

const getLeaderboard = async (
  { subjectId, quizId, limit = 25 } = {},
  currentUserId = null
) => {
  const where = {
    status: { in: ['COMPLETED', 'EXPIRED'] },
    ...(quizId ? { quizId: Number(quizId) } : {}),
    ...(subjectId
      ? { quiz: { category: { subjectId: Number(subjectId) } } }
      : {}),
  };

  const attempts = await prisma.quizAttempt.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      quiz: {
        select: {
          id: true,
          difficulty: true,
          passingScore: true,
        },
      },
    },
  });

  // Track best points per (userId, quizId) so repeating a quiz rewards mastery, not spam
  const userMap = new Map();

  for (const a of attempts) {
    const points = calculateAttemptPoints({
      correctAnswers: a.correctAnswers,
      difficulty: a.quiz.difficulty,
      percentage: a.percentage,
      passingScore: a.quiz.passingScore,
    });
    const passed = a.percentage >= a.quiz.passingScore;

    if (!userMap.has(a.userId)) {
      userMap.set(a.userId, {
        userId: a.userId,
        name: a.user.name,
        bestByQuiz: new Map(),
        totalAttempts: 0,
      });
    }

    const userEntry = userMap.get(a.userId);
    userEntry.totalAttempts += 1;

    const prevBest = userEntry.bestByQuiz.get(a.quizId);
    if (
      !prevBest ||
      points > prevBest.points ||
      (points === prevBest.points && a.percentage > prevBest.percentage) ||
      (points === prevBest.points &&
        a.percentage === prevBest.percentage &&
        a.timeTaken < prevBest.timeTaken)
    ) {
      userEntry.bestByQuiz.set(a.quizId, {
        points,
        percentage: a.percentage,
        passed,
        timeTaken: a.timeTaken,
      });
    }
  }

  const rankings = Array.from(userMap.values())
    .map((u) => {
      const bestEntries = Array.from(u.bestByQuiz.values());
      const score = bestEntries.reduce((sum, item) => sum + item.points, 0);
      const quizzesCompleted = bestEntries.length;
      const quizzesPassed = bestEntries.filter((item) => item.passed).length;
      const averagePercentage =
        quizzesCompleted > 0
          ? Number(
              (
                bestEntries.reduce((sum, item) => sum + item.percentage, 0) /
                quizzesCompleted
              ).toFixed(1)
            )
          : 0;

      return {
        userId: u.userId,
        name: u.name,
        score,
        quizzesCompleted,
        quizzesPassed,
        averagePercentage,
        totalAttempts: u.totalAttempts,
        isCurrentUser: currentUserId === u.userId,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.averagePercentage !== a.averagePercentage) {
        return b.averagePercentage - a.averagePercentage;
      }
      return b.quizzesPassed - a.quizzesPassed;
    })
    .slice(0, Math.min(100, Math.max(1, Number(limit) || 25)))
    .map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
    }));

  return {
    scoringRules: {
      pointsPerCorrect: POINTS_PER_CORRECT,
      difficultyMultipliers: DIFFICULTY_MULTIPLIER,
      passBonusPoints: PASS_BONUS_POINTS,
      aggregation: 'Sum of each user’s best attempt score per quiz',
    },
    rankings,
  };
};

module.exports = {
  getLeaderboard,
};
