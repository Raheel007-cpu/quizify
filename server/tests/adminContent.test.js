const { after, before, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { apiRequest, getStore, resetDb, startTestServer } = require('./testHelpers');

describe('Admin Quiz Creation & Question Bank Management', () => {
  let server;
  let adminCookie;
  let studentCookie;

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
    const aLogin = await apiRequest(server.baseUrl, '/auth/login', {
      method: 'POST',
      body: { email: 'admin@quizify.test', password: 'Password123' },
    });
    adminCookie = aLogin.cookie;

    const sReg = await apiRequest(server.baseUrl, '/auth/register', {
      method: 'POST',
      body: {
        name: 'Student',
        email: 'student@quizify.test',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
    });
    studentCookie = sReg.cookie;
  });

  it('creates subjects and categories, enforces uniqueness, and blocks deleting non-empty subjects', async () => {
    const subjRes = await apiRequest(server.baseUrl, '/subjects', {
      method: 'POST',
      cookie: adminCookie,
      body: { name: 'Programming', description: 'CS fundamentals' },
    });
    assert.equal(subjRes.status, 201);
    const subjectId = subjRes.json.data.subject.id;

    const dupSubj = await apiRequest(server.baseUrl, '/subjects', {
      method: 'POST',
      cookie: adminCookie,
      body: { name: 'programming' },
    });
    assert.equal(dupSubj.status, 409);

    const catRes = await apiRequest(server.baseUrl, '/categories', {
      method: 'POST',
      cookie: adminCookie,
      body: { subjectId, name: 'JavaScript' },
    });
    assert.equal(catRes.status, 201);

    const blockedDelete = await apiRequest(
      server.baseUrl,
      `/subjects/${subjectId}`,
      {
        method: 'DELETE',
        cookie: adminCookie,
      }
    );
    assert.equal(blockedDelete.status, 409);
  });

  it('manages reusable questions and prevents publishing quizzes without enough linked questions', async () => {
    const subj = await apiRequest(server.baseUrl, '/subjects', {
      method: 'POST',
      cookie: adminCookie,
      body: { name: 'Programming' },
    });
    const cat = await apiRequest(server.baseUrl, '/categories', {
      method: 'POST',
      cookie: adminCookie,
      body: { subjectId: subj.json.data.subject.id, name: 'JavaScript' },
    });
    const categoryId = cat.json.data.category.id;

    const q1 = await apiRequest(server.baseUrl, '/questions', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        categoryId,
        questionText: 'What does typeof null return?',
        optionA: 'null',
        optionB: 'object',
        optionC: 'undefined',
        optionD: 'boolean',
        correctAnswer: 'B',
        explanation: 'Legacy JS quirk.',
        difficulty: 'EASY',
      },
    });
    assert.equal(q1.status, 201);
    const q1Id = q1.json.data.question.id;

    const q2 = await apiRequest(server.baseUrl, '/questions', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        categoryId,
        questionText: 'Which keyword declares a block-scoped constant?',
        optionA: 'var',
        optionB: 'let',
        optionC: 'const',
        optionD: 'def',
        correctAnswer: 'C',
        difficulty: 'EASY',
      },
    });
    assert.equal(q2.status, 201);
    const q2Id = q2.json.data.question.id;

    // Update question
    const updQ = await apiRequest(server.baseUrl, `/questions/${q2Id}`, {
      method: 'PUT',
      cookie: adminCookie,
      body: { difficulty: 'MEDIUM' },
    });
    assert.equal(updQ.status, 200);
    assert.equal(updQ.json.data.question.difficulty, 'MEDIUM');

    // Attempt to publish a 2-question quiz with only 1 question -> 400
    const badPublish = await apiRequest(server.baseUrl, '/quizzes', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        categoryId,
        title: 'JS Basics',
        difficulty: 'EASY',
        timeLimit: 5,
        passingScore: 60,
        questionCount: 2,
        status: 'PUBLISHED',
        questionIds: [q1Id],
      },
    });
    assert.equal(badPublish.status, 400);

    // Create as DRAFT with 1 question -> 201
    const draftQuiz = await apiRequest(server.baseUrl, '/quizzes', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        categoryId,
        title: 'JS Basics',
        difficulty: 'EASY',
        timeLimit: 5,
        passingScore: 60,
        questionCount: 2,
        status: 'DRAFT',
        questionIds: [q1Id],
      },
    });
    assert.equal(draftQuiz.status, 201);
    const quizId = draftQuiz.json.data.quiz.id;

    // Student cannot see DRAFT quiz
    const studentList = await apiRequest(server.baseUrl, '/quizzes', {
      cookie: studentCookie,
    });
    assert.equal(studentList.status, 200);
    assert.equal(studentList.json.data.quizzes.length, 0);

    const studentDraftDetail = await apiRequest(
      server.baseUrl,
      `/quizzes/${quizId}`,
      { cookie: studentCookie }
    );
    assert.equal(studentDraftDetail.status, 404);

    // Link second question and publish
    const publishRes = await apiRequest(server.baseUrl, `/quizzes/${quizId}`, {
      method: 'PUT',
      cookie: adminCookie,
      body: {
        status: 'PUBLISHED',
        questionIds: [q1Id, q2Id],
      },
    });
    assert.equal(publishRes.status, 200);
    assert.equal(publishRes.json.data.quiz.status, 'PUBLISHED');

    const studentVisible = await apiRequest(server.baseUrl, '/quizzes', {
      cookie: studentCookie,
    });
    assert.equal(studentVisible.json.data.quizzes.length, 1);
  });

  it('supports 2-option (True/False) and 3-option questions and validates correctAnswer', async () => {
    const subj = await apiRequest(server.baseUrl, '/subjects', {
      method: 'POST',
      cookie: adminCookie,
      body: { name: 'CS Basics' },
    });
    const cat = await apiRequest(server.baseUrl, '/categories', {
      method: 'POST',
      cookie: adminCookie,
      body: { subjectId: subj.json.data.subject.id, name: 'Logic' },
    });
    const categoryId = cat.json.data.category.id;

    // 2-option True/False question
    const tfRes = await apiRequest(server.baseUrl, '/questions', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        categoryId,
        questionText: 'HTTP is a stateless protocol.',
        optionA: 'True',
        optionB: 'False',
        optionC: '',
        optionD: null,
        correctAnswer: 'A',
        difficulty: 'EASY',
      },
    });
    assert.equal(tfRes.status, 201);
    assert.equal(tfRes.json.data.question.optionC, null);
    assert.equal(tfRes.json.data.question.optionD, null);

    // 3-option question
    const threeRes = await apiRequest(server.baseUrl, '/questions', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        categoryId,
        questionText: 'Which HTTP status indicates Not Found?',
        optionA: '200',
        optionB: '401',
        optionC: '404',
        correctAnswer: 'C',
        difficulty: 'MEDIUM',
      },
    });
    assert.equal(threeRes.status, 201);
    assert.equal(threeRes.json.data.question.optionC, '404');
    assert.equal(threeRes.json.data.question.optionD, null);
    const threeId = threeRes.json.data.question.id;

    // Reject creating when correctAnswer points to empty option
    const badCreate = await apiRequest(server.baseUrl, '/questions', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        categoryId,
        questionText: 'Invalid option target test?',
        optionA: 'Yes',
        optionB: 'No',
        correctAnswer: 'C',
        difficulty: 'EASY',
      },
    });
    assert.equal(badCreate.status, 400);

    // Reject clearing optionC while correctAnswer remains C
    const badUpdate = await apiRequest(server.baseUrl, `/questions/${threeId}`, {
      method: 'PUT',
      cookie: adminCookie,
      body: { optionC: '' },
    });
    assert.equal(badUpdate.status, 400);

    // Succeed when clearing optionC alongside updating correctAnswer
    const goodUpdate = await apiRequest(server.baseUrl, `/questions/${threeId}`, {
      method: 'PUT',
      cookie: adminCookie,
      body: { optionC: null, correctAnswer: 'A' },
    });
    assert.equal(goodUpdate.status, 200);
    assert.equal(goodUpdate.json.data.question.optionC, null);
    assert.equal(goodUpdate.json.data.question.correctAnswer, 'A');
  });
});
