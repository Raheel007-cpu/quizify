const { after, before, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { apiRequest, getStore, resetDb, startTestServer } = require('./testHelpers');

describe('Analytics, Leaderboard, Edge Cases & API Error Handling', () => {
  let server;
  let adminCookie;
  let student1Cookie;
  let student2Cookie;
  let subjectId;
  let quizId;

  before(async () => {
    server = await startTestServer();
  });

  after(async () => {
    await server.close();
  });

  beforeEach(async () => {
    resetDb();

    const aReg = await apiRequest(server.baseUrl, '/auth/register', {
      method: 'POST',
      body: {
        name: 'Admin',
        email: 'admin@quizify.test',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
    });
    getStore().users.find((u) => u.id === aReg.json.data.user.id).role = 'ADMIN';
    adminCookie = (
      await apiRequest(server.baseUrl, '/auth/login', {
        method: 'POST',
        body: { email: 'admin@quizify.test', password: 'Password123' },
      })
    ).cookie;

    student1Cookie = (
      await apiRequest(server.baseUrl, '/auth/register', {
        method: 'POST',
        body: {
          name: 'Alex',
          email: 'alex@quizify.test',
          password: 'Password123',
          confirmPassword: 'Password123',
        },
      })
    ).cookie;

    student2Cookie = (
      await apiRequest(server.baseUrl, '/auth/register', {
        method: 'POST',
        body: {
          name: 'Sarah',
          email: 'sarah@quizify.test',
          password: 'Password123',
          confirmPassword: 'Password123',
        },
      })
    ).cookie;

    const subj = await apiRequest(server.baseUrl, '/subjects', {
      method: 'POST',
      cookie: adminCookie,
      body: { name: 'Science' },
    });
    subjectId = subj.json.data.subject.id;

    const cat = await apiRequest(server.baseUrl, '/categories', {
      method: 'POST',
      cookie: adminCookie,
      body: { subjectId, name: 'Physics' },
    });
    const categoryId = cat.json.data.category.id;

    const q1 = await apiRequest(server.baseUrl, '/questions', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        categoryId,
        questionText: 'SI unit of force?',
        optionA: 'Joule',
        optionB: 'Newton',
        optionC: 'Watt',
        optionD: 'Pascal',
        correctAnswer: 'B',
        difficulty: 'HARD',
      },
    });
    const q2 = await apiRequest(server.baseUrl, '/questions', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        categoryId,
        questionText: 'V = I * R is?',
        optionA: 'Ohm Law',
        optionB: 'Boyle Law',
        optionC: 'Hooke Law',
        optionD: 'Snell Law',
        correctAnswer: 'A',
        difficulty: 'HARD',
      },
    });

    const quizRes = await apiRequest(server.baseUrl, '/quizzes', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        categoryId,
        title: 'Physics Challenge',
        difficulty: 'HARD',
        timeLimit: 5,
        passingScore: 50,
        questionCount: 2,
        status: 'PUBLISHED',
        questionIds: [q1.json.data.question.id, q2.json.data.question.id],
      },
    });
    quizId = quizRes.json.data.quiz.id;
  });

  it('computes analytics overview, performance, subject breakdown, and leaderboard rankings accurately', async () => {
    // Student 1 gets 2/2 (100% PASS) -> HARD multiplier 1.5 => 2*10*1.5 + 20 pass bonus = 50 pts
    const s1Start = await apiRequest(server.baseUrl, '/attempts/start', {
      method: 'POST',
      cookie: student1Cookie,
      body: { quizId },
    });
    const s1Qs = s1Start.json.data.questions;
    const s1Answers = s1Qs.map((q) => ({
      questionId: q.id,
      selectedAnswer: q.questionText.includes('force') ? 'B' : 'A',
    }));
    await apiRequest(
      server.baseUrl,
      `/attempts/${s1Start.json.data.attempt.id}/submit`,
      { method: 'POST', cookie: student1Cookie, body: { answers: s1Answers } }
    );

    // Student 2 gets 1/2 (50% PASS) -> 1*10*1.5 + 20 = 35 pts
    const s2Start = await apiRequest(server.baseUrl, '/attempts/start', {
      method: 'POST',
      cookie: student2Cookie,
      body: { quizId },
    });
    const s2Qs = s2Start.json.data.questions;
    const s2Answers = s2Qs.map((q) => ({
      questionId: q.id,
      selectedAnswer: q.questionText.includes('force') ? 'B' : 'D',
    }));
    await apiRequest(
      server.baseUrl,
      `/attempts/${s2Start.json.data.attempt.id}/submit`,
      { method: 'POST', cookie: student2Cookie, body: { answers: s2Answers } }
    );

    const ovRes = await apiRequest(server.baseUrl, '/analytics/overview', {
      cookie: student1Cookie,
    });
    assert.equal(ovRes.status, 200);
    assert.equal(ovRes.json.data.totalAttempts, 1);
    assert.equal(ovRes.json.data.passedCount, 1);
    assert.equal(ovRes.json.data.averageScore, 100);

    const subjRes = await apiRequest(server.baseUrl, '/analytics/subjects', {
      cookie: student1Cookie,
    });
    assert.equal(subjRes.status, 200);
    assert.equal(subjRes.json.data.subjects[0].subject, 'Science');
    assert.equal(subjRes.json.data.subjects[0].averageScore, 100);

    const perfRes = await apiRequest(server.baseUrl, '/analytics/performance', {
      cookie: student2Cookie,
    });
    assert.equal(perfRes.status, 200);
    assert.equal(perfRes.json.data.scoreOverTime[0].score, 50);

    const lbRes = await apiRequest(
      server.baseUrl,
      `/leaderboard?subjectId=${subjectId}`,
      { cookie: student1Cookie }
    );
    assert.equal(lbRes.status, 200);
    const { rankings } = lbRes.json.data;
    assert.equal(rankings.length, 2);
    assert.equal(rankings[0].name, 'Alex');
    assert.equal(rankings[0].score, 50);
    assert.equal(rankings[0].isCurrentUser, true);
    assert.equal(rankings[1].name, 'Sarah');
    assert.equal(rankings[1].score, 35);

    const adminAnalytics = await apiRequest(server.baseUrl, '/admin/analytics', {
      cookie: adminCookie,
    });
    assert.equal(adminAnalytics.status, 200);
    assert.equal(adminAnalytics.json.data.popularQuizzes[0].attempts, 2);
  });

  it('handles malformed JSON, invalid IDs, and unknown routes cleanly', async () => {
    const badJson = await apiRequest(server.baseUrl, '/auth/login', {
      method: 'POST',
      body: '{invalid-json',
    });
    assert.equal(badJson.status, 400);
    assert.equal(badJson.json.message, 'Invalid JSON payload');

    const badId = await apiRequest(server.baseUrl, '/subjects/not-a-number');
    assert.equal(badId.status, 400);
    assert.equal(badId.json.message, 'Invalid subject ID');

    const notFound = await apiRequest(server.baseUrl, '/does-not-exist');
    assert.equal(notFound.status, 404);
    assert.equal(notFound.json.success, false);
  });
});
