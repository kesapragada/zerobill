// backend/__tests__/auth.test.js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');

describe('Auth API Endpoints', () => {
  const testUserCredentials = {
    email: 'test@example.com',
    password: 'ValidPassword123!',
  };

  // Create a user before each test in this suite for login/me endpoints
  beforeEach(async () => {
    // Clear existing users to ensure test isolation
    await User.deleteMany({});
    
    // Create a new user for testing login and authenticated routes
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUserCredentials.password, salt);
    await User.create({ email: testUserCredentials.email, password: hashedPassword });
  });

  // Test registration endpoint separately as it creates its own user
  it('POST /api/auth/register -> should register a new user', async () => {
    const newUser = { email: 'new-register@example.com', password: 'NewPassword123!' };
    const res = await request(app).post('/api/auth/register').send(newUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toContain('User registered successfully');

    // Verify user was actually created in the DB
    const dbUser = await User.findOne({ email: newUser.email });
    expect(dbUser).not.toBeNull();
  });

  it('POST /api/auth/login -> should log in and set httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/login').send(testUserCredentials);
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(res.headers['set-cookie'][0]).toContain('token=');
  });

  it('GET /api/user/me -> should succeed for an authenticated user', async () => {
    // Step 1: Login to get the authentication cookie
    const loginRes = await request(app).post('/api/auth/login').send(testUserCredentials);
    const cookie = loginRes.headers['set-cookie'].join(';');

    // Step 2: Make the authenticated request using the cookie
    const res = await request(app).get('/api/user/me').set('Cookie', cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testUserCredentials.email);
    expect(res.body).not.toHaveProperty('password');
  });
  
  it('GET /api/user/me -> should fail for an unauthenticated user', async () => {
    const res = await request(app).get('/api/user/me');
    expect(res.statusCode).toBe(401);
  });
});