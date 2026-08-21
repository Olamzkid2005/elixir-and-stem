import request from 'supertest';
import { app } from '../src/app';
import { prisma, setupTestData, cleanupTestData, disconnectPrisma, getCustomer, getMerchant, getMerchantProfile } from './setup';

beforeAll(async () => {
  await setupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

describe('Merchants Routes', () => {
  describe('GET /merchants', () => {
    it('should return only approved merchants (public)', async () => {
      const res = await request(app).get('/merchants');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Should contain our test merchant
      const found = res.body.find((m: any) => m.businessName === 'Test Dispensary');
      expect(found).toBeDefined();
      expect(found.status).toBe('approved');
    });
  });

  describe('GET /merchants/me', () => {
    it('should return the merchant own profile', async () => {
      const merchant = getMerchant();
      const res = await request(app)
        .get('/merchants/me')
        .set('Authorization', `Bearer ${merchant.token}`);

      expect(res.status).toBe(200);
      expect(res.body.businessName).toBe('Test Dispensary');
      expect(res.body.status).toBe('approved');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/merchants/me');
      expect(res.status).toBe(401);
    });

    it('should reject customer role', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .get('/merchants/me')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /merchants', () => {
    it('should register a new merchant (always pending)', async () => {
      // First create a new merchant user
      const signupRes = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test-new-merchant@example.com',
          password: 'testpass123',
          role: 'merchant',
        });

      const token = signupRes.body.token;

      const res = await request(app)
        .post('/merchants')
        .set('Authorization', `Bearer ${token}`)
        .send({
          businessName: 'New Test Shop',
          licenseNumber: 'CA-C10-NEW-002',
          address: '456 New St, San Francisco, CA',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending');
    });

    it('should reject duplicate merchant registration', async () => {
      const merchant = getMerchant();
      const res = await request(app)
        .post('/merchants')
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({
          businessName: 'Duplicate Shop',
          licenseNumber: 'CA-C10-DUP-003',
          address: '789 Dup St, Oakland, CA',
        });

      expect(res.status).toBe(409);
    });

    it('should reject invalid business fields', async () => {
      const merchant = getMerchant();
      // Need a fresh merchant user who hasn't registered yet
      const signupRes = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test-invalid-merchant@example.com',
          password: 'testpass123',
          role: 'merchant',
        });

      const res = await request(app)
        .post('/merchants')
        .set('Authorization', `Bearer ${signupRes.body.token}`)
        .send({
          businessName: 'X', // too short
          licenseNumber: 'AB', // too short
          address: 'short', // too short
        });

      expect(res.status).toBe(400);
    });
  });
});
