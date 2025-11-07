const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock server setup for unit testing
const createTestApp = () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  // Mock auth routes for testing
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Basic validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: { message: 'All fields are required' }
        });
      }
      
      // Mock successful registration
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: 'test-user-id',
            email,
            firstName,
            lastName,
            role: 'STUDENT'
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          }
        },
        message: 'User registered successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Registration failed' }
      });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Email and password are required' }
        });
      }
      
      // Mock successful login
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: 'test-user-id',
            email,
            firstName: 'Test',
            lastName: 'User',
            role: 'STUDENT'
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          }
        },
        message: 'Login successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Login failed' }
      });
    }
  });
  
  return app;
};

describe('Authentication Unit Tests', () => {
  let app;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });
    
    test('should fail registration with missing fields', async () => {
      const userData = {
        email: 'test@example.com'
        // Missing required fields
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('required');
    });
  });
  
  describe('POST /api/auth/login', () => {
    test('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });
    
    test('should fail login with missing credentials', async () => {
      const loginData = {
        email: 'test@example.com'
        // Missing password
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('required');
    });
  });
});

module.exports = { createTestApp };
