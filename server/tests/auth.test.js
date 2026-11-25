const { after, before, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { apiRequest, getStore, resetDb, startTestServer } = require('./testHelpers');

describe('Authentication API', () => {
  let server;

  before(async () => {
    server = await startTestServer();
  });

  after(async () => {
    await server.close();
  });

  beforeEach(() => {
    resetDb();
  });

  it('registers a student, hashes password, forces STUDENT role, and sets HttpOnly cookie', async () => {
    const res = await apiRequest(server.baseUrl, '/auth/register', {
      method: 'POST',
      body: {
        name: 'Jane Doe',
        email: 'Jane@Example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'ADMIN', // Attempted privilege escalation should be ignored
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.json.success, true);
    assert.equal(res.json.data.user.email, 'jane@example.com');
    assert.equal(res.json.data.user.role, 'STUDENT');
    assert.equal(res.json.data.user.passwordHash, undefined);
    assert.ok(res.rawSetCookie.includes('HttpOnly'));

    const storedUser = getStore().users[0];
    assert.notEqual(storedUser.passwordHash, 'Password123');
    assert.ok(storedUser.passwordHash.startsWith('$2'));
  });

  it('rejects invalid registration input and duplicate email', async () => {
    const badRes = await apiRequest(server.baseUrl, '/auth/register', {
      method: 'POST',
      body: {
        name: 'A',
        email: 'invalid-email',
        password: 'short',
        confirmPassword: 'different',
      },
    });

    assert.equal(badRes.status, 400);
    assert.equal(badRes.json.success, false);
    assert.ok(badRes.json.errors.name);
    assert.ok(badRes.json.errors.email);

    await apiRequest(server.baseUrl, '/auth/register', {
      method: 'POST',
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
    });

    const dupRes = await apiRequest(server.baseUrl, '/auth/register', {
      method: 'POST',
      body: {
        name: 'Jane Again',
        email: 'jane@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
    });

    assert.equal(dupRes.status, 409);
    assert.equal(dupRes.json.success, false);
  });

  it('logs in, persists session via /auth/me, rejects bad password, and logs out', async () => {
    await apiRequest(server.baseUrl, '/auth/register', {
      method: 'POST',
      body: {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
    });

    const wrongPwd = await apiRequest(server.baseUrl, '/auth/login', {
      method: 'POST',
      body: { email: 'alex@example.com', password: 'WrongPassword1' },
    });
    assert.equal(wrongPwd.status, 401);

    const loginRes = await apiRequest(server.baseUrl, '/auth/login', {
      method: 'POST',
      body: { email: 'alex@example.com', password: 'Password123' },
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.cookie);

    const meRes = await apiRequest(server.baseUrl, '/auth/me', {
      cookie: loginRes.cookie,
    });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.json.data.user.email, 'alex@example.com');

    const unauthMe = await apiRequest(server.baseUrl, '/auth/me');
    assert.equal(unauthMe.status, 401);

    const logoutRes = await apiRequest(server.baseUrl, '/auth/logout', {
      method: 'POST',
      cookie: loginRes.cookie,
    });
    assert.equal(logoutRes.status, 200);
    assert.ok(logoutRes.rawSetCookie.includes('quizify_token=;'));
  });
});
