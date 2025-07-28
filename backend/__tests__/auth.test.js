// backend/__tests__/auth.test.js

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth API Endpoints', () => {
  const testUser = { email: 'test@example.com', password: 'password123' };

  it('POST /api/auth/register -> should register a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.statusCode).toBe(201);
  });

  it('POST /api/auth/register -> should fail to register a duplicate user', async () => {
    await User.create({ email: testUser.email, password: 'hashedpassword' });
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.statusCode).toBe(409);
  });

  it('POST /api/auth/login -> should log in successfully and set httpOnly cookie', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/login').send(testUser);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testUser.email);
    // [THE FIX] This regex is more flexible and checks for the essential parts.
    expect(res.headers['set-cookie'][0]).toMatch(/token=.+; Max-Age=.+; Path=\/; HttpOnly/);
  });

  describe('Authenticated Routes', () => {
    let cookie;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const loginRes = await request(app).post('/api/auth/login').send(testUser);
      cookie = loginRes.headers['set-cookie'].join(';');
    });

    it('GET /api/user/me -> should fail for a request without a cookie', async () => {
        const res = await request(app).get('/api/user/me');
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/user/me -> should succeed for a request with a valid cookie', async () => {
        const res = await request(app).get('/api/user/me').set('Cookie', cookie);
        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe(testUser.email);
    });
  });
});