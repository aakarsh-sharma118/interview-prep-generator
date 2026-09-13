/**
 * API Integration Tests
 * Tests healthcheck, auth routes, and protected API endpoints.
 * Author: Aakarsh Sharma
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../src/index.js';
import { connectDatabase, disconnectDatabase } from '../src/connections/database.js';

describe('API & Authentication Integration Tests', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('GET /health returns healthy status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

  it('rejects unauthenticated access to /api/kits', async () => {
    const response = await request(app).get('/api/kits');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('registers a new user and returns JWT token', async () => {
    const testEmail = `candidate_${Date.now()}@example.com`;
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Aakarsh Sharma',
        email: testEmail,
        password: 'securePassword123',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe(testEmail);
  });

  it('logs in an existing user with correct credentials', async () => {
    const testEmail = `login_test_${Date.now()}@example.com`;
    // 1. Register user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Aakarsh Sharma',
        email: testEmail,
        password: 'loginSecret456',
      });

    // 2. Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'loginSecret456',
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data.token).toBeDefined();

    // 3. Access protected route with token
    const token = loginResponse.body.data.token;
    const kitsResponse = await request(app)
      .get('/api/kits')
      .set('Authorization', `Bearer ${token}`);

    expect(kitsResponse.status).toBe(200);
    expect(kitsResponse.body.success).toBe(true);
    expect(Array.isArray(kitsResponse.body.data)).toBe(true);
  });
});
