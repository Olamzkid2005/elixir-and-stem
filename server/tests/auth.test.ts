import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app';
import { prisma, setupTestData, cleanupTestData, disconnectPrisma, getCustomer, getMerchant } from './setup';

beforeAll(async () => {
  await setupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

describe('Auth Routes', () => {
  describe('POST /auth/signup', () => {
    it('should create a new customer account', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'new-customer@example.com',
          password: 'testpass123',
          role: 'customer',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        email: 'new-customer@example.com',
        role: 'customer',
        ageVerified: true,
      });
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'new-customer@example.com',
          password: 'testpass123',
          role: 'customer',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'not-an-email',
          password: 'testpass123',
          role: 'customer',
        });

      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test-short@example.com',
          password: '123',
          role: 'customer',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/signin', () => {
    it('should sign in with valid credentials', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/auth/signin')
        .send({
          email: customer.email,
          password: customer.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(customer.email);
    });

    it('should reject invalid password', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/auth/signin')
        .send({
          email: customer.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid/);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
    });

    it('should reject suspended account', async () => {
      const password = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'suspended@example.com',
          passwordHash: password,
          role: 'customer',
          ageVerified: true,
          suspended: true,
        },
      });

      const res = await request(app)
        .post('/auth/signin')
        .send({
          email: 'suspended@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/suspended/);

      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
