import request from 'supertest';
import { app } from '../src/app';
import {
  prisma, setupTestData, cleanupTestData, disconnectPrisma,
  getCustomer, getMerchant, getAdmin, getProduct,
} from './setup';

let riderUserId: string;
let riderId: string;

beforeAll(async () => {
  await setupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

describe('Riders Routes', () => {
  describe('POST /riders', () => {
    it('should create a new rider (admin only)', async () => {
      const admin = getAdmin();

      // Create a new user to become a rider
      const signupRes = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test-rider@example.com',
          password: 'password123',
          role: 'merchant', // riders are created from merchant users
        });

      riderUserId = signupRes.body.user.id;

      const res = await request(app)
        .post('/riders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ userId: riderUserId, vehicleType: 'motorcycle' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.vehicleType).toBe('motorcycle');
      expect(res.body.isOnline).toBe(false);
      expect(res.body.rating).toBe(5.0);

      riderId = res.body.id;
    });

    it('should reject duplicate rider creation', async () => {
      const admin = getAdmin();

      const res = await request(app)
        .post('/riders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ userId: riderUserId, vehicleType: 'car' });

      expect(res.status).toBe(409);
    });

    it('should reject non-admin creating riders', async () => {
      const customer = getCustomer();

      const res = await request(app)
        .post('/riders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({ userId: 'some-user', vehicleType: 'car' });

      expect(res.status).toBe(403);
    });

    it('should reject with invalid user ID', async () => {
      const admin = getAdmin();

      const res = await request(app)
        .post('/riders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ userId: 'nonexistent-user', vehicleType: 'car' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /riders', () => {
    it('should list all riders', async () => {
      const admin = getAdmin();

      const res = await request(app)
        .get('/riders')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should require admin role', async () => {
      const customer = getCustomer();

      const res = await request(app)
        .get('/riders')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /riders/online', () => {
    it('should list only online riders', async () => {
      const admin = getAdmin();

      // Initially no online riders
      const res = await request(app)
        .get('/riders/online')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // All returned riders should be online
      expect(res.body.every((r: any) => r.isOnline === true)).toBe(true);
    });
  });

  describe('PATCH /riders/:id/location', () => {
    it('should update rider location', async () => {
      const admin = getAdmin();

      const res = await request(app)
        .patch(`/riders/${riderId}/location`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ lat: 6.5244, lng: 3.3792 }); // Lagos coordinates

      expect(res.status).toBe(200);
      expect(res.body.lat).toBe(6.5244);
      expect(res.body.lng).toBe(3.3792);
    });

    it('should reject invalid coordinates', async () => {
      const admin = getAdmin();

      const res = await request(app)
        .patch(`/riders/${riderId}/location`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ lat: 'invalid', lng: 3.3792 });

      expect(res.status).toBe(400);
    });

    it('should reject non-existent rider', async () => {
      const admin = getAdmin();

      const res = await request(app)
        .patch('/riders/nonexistent/location')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ lat: 6.5244, lng: 3.3792 });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /riders/:id/online', () => {
    it('should toggle rider online status', async () => {
      const admin = getAdmin();

      // Go online
      let res = await request(app)
        .patch(`/riders/${riderId}/online`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ isOnline: true });

      expect(res.status).toBe(200);
      expect(res.body.isOnline).toBe(true);

      // Go offline
      res = await request(app)
        .patch(`/riders/${riderId}/online`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ isOnline: false });

      expect(res.status).toBe(200);
      expect(res.body.isOnline).toBe(false);
    });

    it('should toggle without explicit value', async () => {
      const admin = getAdmin();

      // Should toggle from false to true
      const res = await request(app)
        .patch(`/riders/${riderId}/online`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.isOnline).toBe(true);
    });
  });
});
