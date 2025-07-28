// backend/__tests__/auth.test.js
const request = require('supertest');
const app = require('../app');

describe('Auth API Endpoints', () => {
  const testUser = { email: 'test@example.com', password: 'password123' };

  it('POST /api/auth/register -> should register a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.statusCode).toBe(201);
  });

  it('POST /api/auth/login -> should log in successfully and set httpOnly cookie', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/login').send(testUser);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testUser.email);
    // [THE FIX] Check that the set-cookie header exists and includes 'token=' and 'HttpOnly'.
    // This is more robust than a strict regex.
    expect(res.headers['set-cookie'][0]).toContain('token=');
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  describe('Authenticated Routes', () => {
    let cookie;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const loginResponse = await request(app).post('/api/auth/login').send(testUser);
      cookie = loginResponse.headers['set-cookie'].join(';');
    });

    it('GET /api/user/me -> should succeed for a request with a valid cookie', async () => {
        const res = await request(app).get('/api/user/me').set('Cookie', cookie);
        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe(testUser.email);
    });
  });
});