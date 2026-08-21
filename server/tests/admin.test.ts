import request from 'supertest';
import { app } from '../src/app';
import {
  prisma, setupTestData, cleanupTestData, disconnectPrisma,
  getCustomer, getMerchant, getAdmin,
} from './setup';

let pendingMerchantId: string;

beforeAll(async () => {
  await setupTestData();

  // Create a pending merchant for admin review testing
  const signupRes = await request(app)
    .post('/auth/signup')
    .send({
      email: 'pending-merchant@example.com',
      password: 'testpass123',
      role: 'merchant',
    });

  await request(app)
    .post('/merchants')
    .set('Authorization', `Bearer ${signupRes.body.token}`)
    .send({
      businessName: 'Pending Shop',
      licenseNumber: 'CA-C10-PEND-001',
      address: '999 Pending St, Los Angeles, CA',
    });

  const merchantRes = await prisma.merchant.findFirst({
    where: { user: { email: 'pending-merchant@example.com' } },
  });
  pendingMerchantId = merchantRes!.id;
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

describe('Admin Routes', () => {
  describe('GET /admin/merchants', () => {
    it('should list all merchants', async () => {
      const admin = getAdmin();
      const res = await request(app)
        .get('/admin/merchants')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      const admin = getAdmin();
      const res = await request(app)
        .get('/admin/merchants?status=pending')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.every((m: any) => m.status === 'pending')).toBe(true);
    });

    it('should reject non-admin', async () => {
      const merchant = getMerchant();
      const res = await request(app)
        .get('/admin/merchants')
        .set('Authorization', `Bearer ${merchant.token}`);

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/admin/merchants');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /admin/merchants/:id', () => {
    it('should approve a pending merchant', async () => {
      const admin = getAdmin();
      const res = await request(app)
        .patch(`/admin/merchants/${pendingMerchantId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
    });

    it('should reject invalid status', async () => {
      const admin = getAdmin();
      const res = await request(app)
        .patch(`/admin/merchants/${pendingMerchantId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /admin/users', () => {
    it('should list all users', async () => {
      const admin = getAdmin();
      const res = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      // Should not include passwordHash
      expect(res.body[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('PATCH /admin/users/:id/suspend', () => {
    it('should suspend a user', async () => {
      const admin = getAdmin();
      const customer = getCustomer();

      const res = await request(app)
        .patch(`/admin/users/${customer.id}/suspend`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ suspended: true });

      expect(res.status).toBe(200);
      expect(res.body.suspended).toBe(true);

      // Unsuspend for cleanup
      await request(app)
        .patch(`/admin/users/${customer.id}/suspend`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ suspended: false });
    });

    it('should default to suspending when no value given', async () => {
      const admin = getAdmin();
      const customer = getCustomer();

      const res = await request(app)
        .patch(`/admin/users/${customer.id}/suspend`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.suspended).toBe(true);

      // Cleanup
      await request(app)
        .patch(`/admin/users/${customer.id}/suspend`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ suspended: false });
    });
  });
});
