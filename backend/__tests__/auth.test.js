// backend/__tests__/auth.test.js

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth API Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
  };

  it('POST /api/auth/register -> should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(response.statusCode).toBe(201);
    const userInDb = await User.findOne({ email: testUser.email });
    expect(userInDb).not.toBeNull();
  });

  it('POST /api/auth/register -> should fail to register a duplicate user', async () => {
    await User.create({ email: testUser.email, password: 'hashedpassword' });
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(response.statusCode).toBe(409);
  });

  it('POST /api/auth/login -> should log in successfully and set httpOnly cookie', async () => {
    // First, register the user
    await request(app).post('/api/auth/register').send(testUser);

    const response = await request(app)
      .post('/api/auth/login')
      .send(testUser);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe(testUser.email);
    expect(response.headers['set-cookie'][0]).toMatch(/token=.+; Max-Age=.+; Path=\/; HttpOnly/);
  });

  describe('Authenticated Routes', () => {
    let cookie;

    beforeEach(async () => {
      // Register and login to get a valid cookie before each authenticated test
      await request(app).post('/api/auth/register').send(testUser);
      const loginResponse = await request(app).post('/api/auth/login').send(testUser);
      
      // [THE FIX] The 'set-cookie' header is an array. Supertest's .set() needs a single string.
      cookie = loginResponse.headers['set-cookie'].join(';');
    });

    it('GET /api/user/me -> should fail for a request without a cookie', async () => {
        const response = await request(app).get('/api/user/me');
        expect(response.statusCode).toBe(401);
    });

    it('GET /api/user/me -> should succeed for a request with a valid cookie', async () => {
        const response = await request(app)
            .get('/api/user/me')
            .set('Cookie', cookie); // This will now pass a valid string

        expect(response.statusCode).toBe(200);
        expect(response.body.email).toBe(testUser.email);
    });
  });
});