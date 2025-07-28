// backend/__tests__/auth.test.js
const request = require('supertest');
const app = require('../app');

describe('Auth API Endpoints', () => {
  const testUser = { email: 'test@example.com', password: 'ValidPassword123!' };

  it('POST /api/auth/register -> should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.statusCode).toBe(201);
  });

  it('POST /api/auth/login -> should log in and set httpOnly cookie', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/login').send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('GET /api/user/me -> should succeed for an authenticated user', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const loginRes = await request(app).post('/api/auth/login').send(testUser);
    const cookie = loginRes.headers['set-cookie'].join(';');
    const res = await request(app).get('/api/user/me').set('Cookie', cookie);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testUser.email);
  });
});