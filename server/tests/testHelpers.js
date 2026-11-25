process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'quizify-test-secret-key-2026';
process.env.CLIENT_URL = 'http://localhost:5173';

const prisma = require('../utils/prisma');
const app = require('../app');

const createStore = () => ({
  users: [],
  subjects: [],
  categories: [],
  quizzes: [],
  questions: [],
  quizQuestions: [],
  quizAttempts: [],
  attemptAnswers: [],
  seq: {
    users: 1,
    subjects: 1,
    categories: 1,
    quizzes: 1,
    questions: 1,
    quizQuestions: 1,
    quizAttempts: 1,
    attemptAnswers: 1,
  },
});

let store = createStore();

const applySelect = (row, select) => {
  if (!row || !select) return row ? { ...row } : null;
  const out = {};
  for (const [key, val] of Object.entries(select)) {
    if (val === true && key in row) {
      out[key] = row[key];
    }
  }
  return out;
};

const matchesStringFilter = (actual, filter) => {
  if (typeof filter === 'string') return actual === filter;
  if (filter && typeof filter === 'object') {
    const a = String(actual || '');
    if ('equals' in filter) {
      return filter.mode === 'insensitive'
        ? a.toLowerCase() === String(filter.equals).toLowerCase()
        : a === filter.equals;
    }
    if ('contains' in filter) {
      return filter.mode === 'insensitive'
        ? a.toLowerCase().includes(String(filter.contains).toLowerCase())
        : a.includes(filter.contains);
    }
  }
  return true;
};

const matchesWhere = (row, where, tableName) => {
  if (!where) return true;

  for (const [key, cond] of Object.entries(where)) {
    if (cond === undefined) continue;

    if (key === 'OR') {
      const anyMatch = cond.some((sub) => matchesWhere(row, sub, tableName));
      if (!anyMatch) return false;
      continue;
    }

    if (key === 'NOT') {
      if (matchesWhere(row, cond, tableName)) return false;
      continue;
    }

    if (key === 'subjectId_name') {
      if (row.subjectId !== cond.subjectId || row.name !== cond.name) return false;
      continue;
    }

    if (key === 'attemptId_questionId') {
      if (row.attemptId !== cond.attemptId || row.questionId !== cond.questionId) {
        return false;
      }
      continue;
    }

    if (key === 'quizId_questionId') {
      if (row.quizId !== cond.quizId || row.questionId !== cond.questionId) {
        return false;
      }
      continue;
    }

    if (key === 'category' && (tableName === 'questions' || tableName === 'quizzes')) {
      const cat = store.categories.find((c) => c.id === row.categoryId);
      if (!cat || !matchesWhere(cat, cond, 'categories')) return false;
      continue;
    }

    if (key === 'quiz' && tableName === 'quizAttempts') {
      const quiz = store.quizzes.find((q) => q.id === row.quizId);
      if (!quiz || !matchesWhere(quiz, cond, 'quizzes')) return false;
      continue;
    }

    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      if ('in' in cond) {
        if (!cond.in.includes(row[key])) return false;
        continue;
      }
      if ('lte' in cond) {
        if (!(row[key] <= cond.lte)) return false;
        continue;
      }
      if ('equals' in cond || 'contains' in cond) {
        if (!matchesStringFilter(row[key], cond)) return false;
        continue;
      }
    }

    if (row[key] !== cond) return false;
  }

  return true;
};

const hydrateRow = (tableName, row, { select, include } = {}) => {
  if (!row) return null;
  let result = select ? applySelect(row, select) : { ...row };

  if (!include) {
    // Support nested select inside select (e.g., quiz: { select: ... })
    if (select) {
      if (select.quiz && tableName === 'quizAttempts') {
        const quizRow = store.quizzes.find((q) => q.id === row.quizId);
        result.quiz = hydrateRow('quizzes', quizRow, select.quiz);
      }
      if (select.category && tableName === 'quizzes') {
        const catRow = store.categories.find((c) => c.id === row.categoryId);
        result.category = hydrateRow('categories', catRow, select.category);
      }
      if (select.subject && tableName === 'categories') {
        const subjRow = store.subjects.find((s) => s.id === row.subjectId);
        result.subject = hydrateRow('subjects', subjRow, select.subject);
      }
    }
    return result;
  }

  if (tableName === 'subjects') {
    if (include.categories) {
      const cats = store.categories
        .filter((c) => c.subjectId === row.id)
        .map((c) => hydrateRow('categories', c, include.categories));
      result.categories = cats;
    }
    if (include._count?.select?.categories) {
      result._count = {
        categories: store.categories.filter((c) => c.subjectId === row.id).length,
      };
    }
  }

  if (tableName === 'categories') {
    if (include.subject) {
      const subj = store.subjects.find((s) => s.id === row.subjectId);
      result.subject = hydrateRow('subjects', subj, include.subject);
    }
    if (include.quizzes) {
      const qWhere = include.quizzes.where || {};
      const qs = store.quizzes
        .filter((q) => q.categoryId === row.id && matchesWhere(q, qWhere, 'quizzes'))
        .map((q) => hydrateRow('quizzes', q, include.quizzes));
      result.quizzes = qs;
    }
    if (include._count) {
      result._count = {
        ...(include._count.select?.quizzes
          ? { quizzes: store.quizzes.filter((q) => q.categoryId === row.id).length }
          : {}),
        ...(include._count.select?.questions
          ? { questions: store.questions.filter((q) => q.categoryId === row.id).length }
          : {}),
      };
    }
  }

  if (tableName === 'questions') {
    if (include.category) {
      const cat = store.categories.find((c) => c.id === row.categoryId);
      result.category = hydrateRow('categories', cat, include.category);
    }
    if (include._count?.select?.quizQuestions) {
      result._count = {
        quizQuestions: store.quizQuestions.filter((qq) => qq.questionId === row.id)
          .length,
      };
    }
  }

  if (tableName === 'quizzes') {
    if (include.category) {
      const cat = store.categories.find((c) => c.id === row.categoryId);
      result.category = hydrateRow('categories', cat, include.category);
    }
    if (include.quizQuestions) {
      const qqs = store.quizQuestions
        .filter((qq) => qq.quizId === row.id)
        .map((qq) => {
          const item = { ...qq };
          if (include.quizQuestions.include?.question) {
            const q = store.questions.find((question) => question.id === qq.questionId);
            item.question = hydrateRow(
              'questions',
              q,
              include.quizQuestions.include.question
            );
          }
          return item;
        });
      result.quizQuestions = qqs;
    }
    if (include._count) {
      result._count = {
        ...(include._count.select?.quizQuestions
          ? {
              quizQuestions: store.quizQuestions.filter((qq) => qq.quizId === row.id)
                .length,
            }
          : {}),
        ...(include._count.select?.attempts
          ? {
              attempts: store.quizAttempts.filter((a) => a.quizId === row.id).length,
            }
          : {}),
      };
    }
  }

  if (tableName === 'quizAttempts') {
    if (include.user) {
      const u = store.users.find((user) => user.id === row.userId);
      result.user = hydrateRow('users', u, include.user);
    }
    if (include.quiz) {
      const quiz = store.quizzes.find((q) => q.id === row.quizId);
      result.quiz = hydrateRow('quizzes', quiz, include.quiz);
    }
    if (include.answers) {
      const ans = store.attemptAnswers
        .filter((aa) => aa.attemptId === row.id)
        .sort((a, b) => a.questionOrder - b.questionOrder)
        .map((aa) => {
          const item = { ...aa };
          if (include.answers.include?.question) {
            const q = store.questions.find((question) => question.id === aa.questionId);
            item.question = hydrateRow('questions', q, include.answers.include.question);
          }
          return item;
        });
      result.answers = ans;
    }
    if (include._count?.select?.answers) {
      result._count = {
        answers: store.attemptAnswers.filter((aa) => aa.attemptId === row.id).length,
      };
    }
  }

  return result;
};

const createModelMock = (tableName) => ({
  findUnique: async ({ where, select, include } = {}) => {
    const row = store[tableName].find((r) => matchesWhere(r, where, tableName));
    return hydrateRow(tableName, row, { select, include });
  },
  findFirst: async ({ where, select, include, orderBy } = {}) => {
    let rows = store[tableName].filter((r) => matchesWhere(r, where, tableName));
    if (orderBy && !Array.isArray(orderBy)) {
      const [[field, dir]] = Object.entries(orderBy);
      rows = [...rows].sort((a, b) =>
        dir === 'desc' ? (b[field] > a[field] ? 1 : -1) : a[field] > b[field] ? 1 : -1
      );
    }
    return hydrateRow(tableName, rows[0] || null, { select, include });
  },
  findMany: async ({ where, select, include, skip = 0, take } = {}) => {
    let rows = store[tableName].filter((r) => matchesWhere(r, where, tableName));
    if (skip) rows = rows.slice(skip);
    if (typeof take === 'number') rows = rows.slice(0, take);
    return rows.map((r) => hydrateRow(tableName, r, { select, include }));
  },
  create: async ({ data, select, include } = {}) => {
    const now = new Date();
    const record = {
      id: store.seq[tableName]++,
      createdAt: now,
      updatedAt: now,
      ...(tableName === 'quizAttempts'
        ? {
            score: 0,
            percentage: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            unanswered: 0,
            timeTaken: 0,
            startedAt: now,
            completedAt: null,
          }
        : {}),
      ...(tableName === 'attemptAnswers'
        ? { selectedAnswer: null, isCorrect: null, questionOrder: 0 }
        : {}),
      ...data,
    };
    store[tableName].push(record);
    return hydrateRow(tableName, record, { select, include });
  },
  createMany: async ({ data = [] } = {}) => {
    for (const item of data) {
      const now = new Date();
      store[tableName].push({
        id: store.seq[tableName]++,
        createdAt: now,
        updatedAt: now,
        ...(tableName === 'attemptAnswers'
          ? { selectedAnswer: null, isCorrect: null, questionOrder: 0 }
          : {}),
        ...item,
      });
    }
    return { count: data.length };
  },
  update: async ({ where, data, select, include } = {}) => {
    const idx = store[tableName].findIndex((r) => matchesWhere(r, where, tableName));
    if (idx === -1) return null;
    store[tableName][idx] = {
      ...store[tableName][idx],
      ...data,
      updatedAt: new Date(),
    };
    return hydrateRow(tableName, store[tableName][idx], { select, include });
  },
  delete: async ({ where } = {}) => {
    const idx = store[tableName].findIndex((r) => matchesWhere(r, where, tableName));
    if (idx === -1) return null;
    const [removed] = store[tableName].splice(idx, 1);
    if (tableName === 'quizzes') {
      store.quizQuestions = store.quizQuestions.filter((qq) => qq.quizId !== removed.id);
    }
    return removed;
  },
  deleteMany: async ({ where } = {}) => {
    const before = store[tableName].length;
    store[tableName] = store[tableName].filter(
      (r) => !matchesWhere(r, where, tableName)
    );
    return { count: before - store[tableName].length };
  },
  count: async ({ where } = {}) => {
    return store[tableName].filter((r) => matchesWhere(r, where, tableName)).length;
  },
  groupBy: async ({ by } = {}) => {
    const field = by[0];
    const counts = new Map();
    for (const row of store[tableName]) {
      counts.set(row[field], (counts.get(row[field]) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([val, count]) => ({
      [field]: val,
      _count: { id: count },
    }));
  },
});

const installPrismaMocks = () => {
  prisma.user = createModelMock('users');
  prisma.subject = createModelMock('subjects');
  prisma.category = createModelMock('categories');
  prisma.quiz = createModelMock('quizzes');
  prisma.question = createModelMock('questions');
  prisma.quizQuestion = createModelMock('quizQuestions');
  prisma.quizAttempt = createModelMock('quizAttempts');
  prisma.attemptAnswer = createModelMock('attemptAnswers');
  prisma.$queryRaw = async () => [{ '?column?': 1 }];
  prisma.$transaction = async (cb) => cb(prisma);
};

installPrismaMocks();

const resetDb = () => {
  store = createStore();
  return store;
};

const getStore = () => store;

const startTestServer = async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api`;
  return {
    baseUrl,
    close: async () => {
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
    },
  };
};

const apiRequest = async (baseUrl, path, { method = 'GET', body, cookie } = {}) => {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (cookie) {
    headers.Cookie = cookie;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });

  const setCookieHeader = res.headers.get('set-cookie');
  const nextCookie = setCookieHeader ? setCookieHeader.split(';')[0] : null;
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  return {
    status: res.status,
    json,
    cookie: nextCookie,
    rawSetCookie: setCookieHeader,
  };
};

module.exports = {
  resetDb,
  getStore,
  startTestServer,
  apiRequest,
};
