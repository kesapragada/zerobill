// zerobill/backend/__tests__/auth.test.js
const request = require('supertest');
const app = require('../app'); // Import the testable Express app
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
    expect(response.body.message).toBe('User registered successfully. Please log in.');
    
    // Check if user was actually created in the DB
    const userInDb = await User.findOne({ email: testUser.email });
    expect(userInDb).not.toBeNull();
  });

  it('POST /api/auth/register -> should fail to register a duplicate user', async () => {
    // First, create the user
    await request(app).post('/api/auth/register').send(testUser);
    
    // Then, try to create the same user again
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(response.statusCode).toBe(409); // 409 Conflict
    expect(response.body.message).toBe('An account with this email already exists.');
  });

  it('POST /api/auth/login -> should fail with incorrect credentials', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });
    
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Invalid credentials.');
  });

  it('POST /api/auth/login -> should log in successfully and set httpOnly cookie', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const response = await request(app)
      .post('/api/auth/login')
      .send(testUser);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe(testUser.email);
    expect(response.headers['set-cookie'][0]).toMatch(/token=.+; Max-Age=.+; Path=\/; HttpOnly; SameSite=Strict/);
  });

  describe('Authenticated Routes', () => {
    let cookie;

    beforeEach(async () => {
      // Register and login to get a valid cookie before each authenticated test
      await request(app).post('/api/auth/register').send(testUser);
      const loginResponse = await request(app).post('/api/auth/login').send(testUser);
      cookie = loginResponse.headers['set-cookie'];
    });

    it('GET /api/user/me -> should fail for a request without a cookie', async () => {
        const response = await request(app).get('/api/user/me');
        expect(response.statusCode).toBe(401);
    });

    it('GET /api/user/me -> should succeed for a request with a valid cookie', async () => {
        const response = await request(app)
            .get('/api/user/me')
            .set('Cookie', cookie);

        expect(response.statusCode).toBe(200);
        expect(response.body.email).toBe(testUser.email);
    });
  });
});