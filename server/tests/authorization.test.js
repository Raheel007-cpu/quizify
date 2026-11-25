const { after, before, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { apiRequest, getStore, resetDb, startTestServer } = require('./testHelpers');

describe('Authorization & Role-Based Access Control', () => {
  let server;
  let studentCookie;
  let adminCookie;
  let studentId;
  let adminId;

  before(async () => {
    server = await startTestServer();
  });

  after(async () => {
    await server.close();
  });

  beforeEach(async () => {
    resetDb();

    const sReg = await apiRequest(server.baseUrl, '/auth/register', {
      method: 'POST',
      body: {
        name: 'Student User',
        email: 'student@quizify.test',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
    });
    studentId = sReg.json.data.user.id;
    studentCookie = sReg.cookie;

    const aReg = await apiRequest(server.baseUrl, '/auth/register', {
      method: 'POST',
      body: {
        name: 'Admin User',
        email: 'admin@quizify.test',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
    });
    adminId = aReg.json.data.user.id;
    // Promote second user to ADMIN in store and log in for fresh ADMIN JWT
    getStore().users.find((u) => u.id === adminId).role = 'ADMIN';
    const aLogin = await apiRequest(server.baseUrl, '/auth/login', {
      method: 'POST',
      body: { email: 'admin@quizify.test', password: 'Password123' },
    });
    adminCookie = aLogin.cookie;
  });

  it('blocks unauthenticated users from protected and admin routes with 401', async () => {
    const endpoints = [
      ['/users/profile', 'GET'],
      ['/users', 'GET'],
      ['/questions', 'GET'],
      ['/admin/overview', 'GET'],
      ['/admin/analytics', 'GET'],
      ['/attempts', 'GET'],
      ['/analytics/overview', 'GET'],
    ];

    for (const [path, method] of endpoints) {
      const res = await apiRequest(server.baseUrl, path, { method });
      assert.equal(res.status, 401, `Expected 401 for ${method} ${path}`);
    }
  });

  it('blocks STUDENT users from admin-only endpoints with 403', async () => {
    const adminEndpoints = [
      ['/users', 'GET'],
      ['/questions', 'GET'],
      ['/admin/overview', 'GET'],
      ['/admin/attempts', 'GET'],
      ['/admin/analytics', 'GET'],
      ['/subjects', 'POST', { name: 'Physics', description: 'Science' }],
      ['/categories', 'POST', { subjectId: 1, name: 'Optics' }],
      [
        '/quizzes',
        'POST',
        {
          categoryId: 1,
          title: 'Hack Quiz',
          difficulty: 'EASY',
          timeLimit: 5,
          passingScore: 60,
          questionCount: 1,
        },
      ],
    ];

    for (const [path, method, body] of adminEndpoints) {
      const res = await apiRequest(server.baseUrl, path, {
        method,
        body,
        cookie: studentCookie,
      });
      assert.equal(res.status, 403, `Expected 403 for STUDENT ${method} ${path}`);
    }
  });

  it('allows ADMIN access to admin endpoints and prevents self-demotion', async () => {
    const overviewRes = await apiRequest(server.baseUrl, '/admin/overview', {
      cookie: adminCookie,
    });
    assert.equal(overviewRes.status, 200);
    assert.equal(overviewRes.json.data.stats.totalUsers, 2);

    const selfDemote = await apiRequest(
      server.baseUrl,
      `/users/${adminId}/role`,
      {
        method: 'PATCH',
        cookie: adminCookie,
        body: { role: 'STUDENT' },
      }
    );
    assert.equal(selfDemote.status, 400);

    const promoteStudent = await apiRequest(
      server.baseUrl,
      `/users/${studentId}/role`,
      {
        method: 'PATCH',
        cookie: adminCookie,
        body: { role: 'ADMIN' },
      }
    );
    assert.equal(promoteStudent.status, 200);
    assert.equal(promoteStudent.json.data.user.role, 'ADMIN');
  });
});
