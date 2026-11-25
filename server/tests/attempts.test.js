const { after, before, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { apiRequest, getStore, resetDb, startTestServer } = require('./testHelpers');

describe('Quiz Attempts, Randomization, Timer Validation & Evaluation', () => {
  let server;
  let adminCookie;
  let studentCookie;
  let otherStudentCookie;
  let quizId;
  let questionIds = [];

  before(async () => {
    server = await startTestServer();
  });

  after(async () => {
    await server.close();
  });

  beforeEach(async () => {
    resetDb();
    questionIds = [];

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

    studentCookie = (
      await apiRequest(server.baseUrl, '/auth/register', {
        method: 'POST',
        body: {
          name: 'Student One',
          email: 's1@quizify.test',
          password: 'Password123',
          confirmPassword: 'Password123',
        },
      })
    ).cookie;

    otherStudentCookie = (
      await apiRequest(server.baseUrl, '/auth/register', {
        method: 'POST',
        body: {
          name: 'Student Two',
          email: 's2@quizify.test',
          password: 'Password123',
          confirmPassword: 'Password123',
        },
      })
    ).cookie;

    const subj = await apiRequest(server.baseUrl, '/subjects', {
      method: 'POST',
      cookie: adminCookie,
      body: { name: 'Math' },
    });
    const cat = await apiRequest(server.baseUrl, '/categories', {
      method: 'POST',
      cookie: adminCookie,
      body: { subjectId: subj.json.data.subject.id, name: 'Algebra' },
    });
    const categoryId = cat.json.data.category.id;

    // Seed 6 questions into bank, configure quiz for 3 random questions
    for (let i = 1; i <= 6; i += 1) {
      const q = await apiRequest(server.baseUrl, '/questions', {
        method: 'POST',
        cookie: adminCookie,
        body: {
          categoryId,
          questionText: `Question ${i}: what is ${i} + 1?`,
          optionA: `${i}`,
          optionB: `${i + 1}`,
          optionC: `${i + 2}`,
          optionD: `${i + 3}`,
          correctAnswer: 'B',
          explanation: `${i} + 1 equals ${i + 1}.`,
          difficulty: 'MEDIUM',
        },
      });
      questionIds.push(q.json.data.question.id);
    }

    const quizRes = await apiRequest(server.baseUrl, '/quizzes', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        categoryId,
        title: 'Algebra Quick Quiz',
        difficulty: 'MEDIUM',
        timeLimit: 5,
        passingScore: 60,
        questionCount: 3,
        status: 'PUBLISHED',
        questionIds,
      },
    });
    quizId = quizRes.json.data.quiz.id;
  });

  it('selects random subset without exposing answers before submit, resumes active attempt, and evaluates on backend', async () => {
    const startRes = await apiRequest(server.baseUrl, '/attempts/start', {
      method: 'POST',
      cookie: studentCookie,
      body: { quizId },
    });

    assert.equal(startRes.status, 201);
    assert.equal(startRes.json.data.resumed, false);
    const { attempt, questions } = startRes.json.data;
    assert.equal(questions.length, 3);
    assert.ok(attempt.expiresAt);
    assert.ok(attempt.remainingSeconds > 0);

    // Ensure unique question IDs and NO correctAnswer/explanation leaked
    const uniqueIds = new Set(questions.map((q) => q.id));
    assert.equal(uniqueIds.size, 3);
    for (const q of questions) {
      assert.equal(q.correctAnswer, undefined);
      assert.equal(q.explanation, undefined);
    }

    // Other student cannot read or submit this attempt
    const otherRead = await apiRequest(
      server.baseUrl,
      `/attempts/${attempt.id}`,
      { cookie: otherStudentCookie }
    );
    assert.equal(otherRead.status, 403);

    // Save one answer mid-attempt and verify resume returns same attempt & saved choice
    const saveRes = await apiRequest(
      server.baseUrl,
      `/attempts/${attempt.id}/answer`,
      {
        method: 'PUT',
        cookie: studentCookie,
        body: { questionId: questions[0].id, selectedAnswer: 'B' },
      }
    );
    assert.equal(saveRes.status, 200);

    const resumeRes = await apiRequest(server.baseUrl, '/attempts/start', {
      method: 'POST',
      cookie: studentCookie,
      body: { quizId },
    });
    assert.equal(resumeRes.status, 200);
    assert.equal(resumeRes.json.data.resumed, true);
    assert.equal(resumeRes.json.data.attempt.id, attempt.id);
    assert.equal(resumeRes.json.data.questions[0].selectedAnswer, 'B');

    // Submit: Q1=B (correct), Q2=A (wrong), Q3=null (unanswered) -> 1/3 = 33.33% FAIL
    const submitRes = await apiRequest(
      server.baseUrl,
      `/attempts/${attempt.id}/submit`,
      {
        method: 'POST',
        cookie: studentCookie,
        body: {
          answers: [
            { questionId: questions[0].id, selectedAnswer: 'B' },
            { questionId: questions[1].id, selectedAnswer: 'A' },
            { questionId: questions[2].id, selectedAnswer: null },
          ],
        },
      }
    );
    assert.equal(submitRes.status, 200);
    const evaluated = submitRes.json.data.attempt;
    assert.equal(evaluated.status, 'COMPLETED');
    assert.equal(evaluated.score, 1);
    assert.equal(evaluated.correctAnswers, 1);
    assert.equal(evaluated.incorrectAnswers, 1);
    assert.equal(evaluated.unanswered, 1);
    assert.equal(evaluated.passed, false);

    // Double submission is rejected with 409
    const doubleSubmit = await apiRequest(
      server.baseUrl,
      `/attempts/${attempt.id}/submit`,
      {
        method: 'POST',
        cookie: studentCookie,
        body: { answers: [] },
      }
    );
    assert.equal(doubleSubmit.status, 409);

    // Now GET /attempts/:id includes review answers + explanations
    const reviewRes = await apiRequest(
      server.baseUrl,
      `/attempts/${attempt.id}`,
      { cookie: studentCookie }
    );
    assert.equal(reviewRes.status, 200);
    assert.equal(reviewRes.json.data.review.length, 3);
    assert.equal(reviewRes.json.data.review[0].correctAnswer, 'B');
    assert.ok(reviewRes.json.data.review[0].explanation);
  });

  it('auto-expires attempts when backend timer has elapsed past timeLimit', async () => {
    const startRes = await apiRequest(server.baseUrl, '/attempts/start', {
      method: 'POST',
      cookie: studentCookie,
      body: { quizId },
    });
    const attemptId = startRes.json.data.attempt.id;
    const firstQuestionId = startRes.json.data.questions[0].id;

    // Backdate startedAt by 10 minutes (quiz timeLimit is 5 min)
    const storedAttempt = getStore().quizAttempts.find((a) => a.id === attemptId);
    storedAttempt.startedAt = new Date(Date.now() - 10 * 60 * 1000);

    // Trying to save an answer after expiration returns 409 and finalizes as EXPIRED
    const expiredSave = await apiRequest(
      server.baseUrl,
      `/attempts/${attemptId}/answer`,
      {
        method: 'PUT',
        cookie: studentCookie,
        body: { questionId: firstQuestionId, selectedAnswer: 'B' },
      }
    );
    assert.equal(expiredSave.status, 409);

    const updatedAttempt = getStore().quizAttempts.find((a) => a.id === attemptId);
    assert.equal(updatedAttempt.status, 'EXPIRED');
    assert.equal(updatedAttempt.timeTaken, 5 * 60);

    const afterExpireRead = await apiRequest(
      server.baseUrl,
      `/attempts/${attemptId}`,
      { cookie: studentCookie }
    );
    assert.equal(afterExpireRead.status, 200);
    assert.equal(afterExpireRead.json.data.attempt.status, 'EXPIRED');
  });
});
