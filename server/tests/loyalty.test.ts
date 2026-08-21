import request from 'supertest';
import { app } from '../src/app';
import {
  prisma, setupTestData, cleanupTestData, disconnectPrisma,
  getCustomer, getMerchant, getProduct,
} from './setup';

beforeAll(async () => {
  await setupTestData();

  // Create a delivered order to generate some loyalty points
  const customer = getCustomer();
  const product = getProduct();
  const merchant = getMerchant();

  const orderRes = await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({
      merchantId: product.merchantId,
      deliveryAddress: '100 Loyalty Ave, Los Angeles, CA 90001',
      items: [{ productId: product.id, weightLabel: '3.5g', quantity: 1 }],
    });

  const orderId = orderRes.body.id;

  // Advance to delivered to trigger points
  await request(app)
    .patch(`/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${merchant.token}`)
    .send({ status: 'confirmed' });
  await request(app)
    .patch(`/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${merchant.token}`)
    .send({ status: 'out_for_delivery' });
  await request(app)
    .patch(`/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${merchant.token}`)
    .send({ status: 'delivered' });
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

describe('Loyalty Routes', () => {
  describe('GET /loyalty/me', () => {
    it('should return loyalty account with points and tier', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .get('/loyalty/me')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('points');
      expect(res.body).toHaveProperty('tier');
      expect(res.body).toHaveProperty('transactions');
      expect(res.body.points).toBeGreaterThan(0);
      expect(['bronze', 'silver', 'gold']).toContain(res.body.tier);
      expect(Array.isArray(res.body.transactions)).toBe(true);
    });

    it('should return default account for user with no loyalty', async () => {
      // Create a fresh user with no orders
      const signupRes = await request(app)
        .post('/auth/signup')
        .send({
          email: 'fresh-loyalty@example.com',
          password: 'testpass123',
          role: 'customer',
        });

      const res = await request(app)
        .get('/loyalty/me')
        .set('Authorization', `Bearer ${signupRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.points).toBe(0);
      expect(res.body.tier).toBe('bronze');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/loyalty/me');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /loyalty/rewards', () => {
    it('should return the rewards catalog', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .get('/loyalty/rewards')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('points');
    });
  });

  describe('POST /loyalty/redeem', () => {
    it('should redeem a reward if sufficient points', async () => {
      const customer = getCustomer();
      const accountRes = await request(app)
        .get('/loyalty/me')
        .set('Authorization', `Bearer ${customer.token}`);

      const currentPoints = accountRes.body.points;
      if (currentPoints >= 100) {
        const res = await request(app)
          .post('/loyalty/redeem')
          .set('Authorization', `Bearer ${customer.token}`)
          .send({ rewardId: 'free_delivery', points: 100, discountCents: 500 });

        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.remainingPoints).toBe(currentPoints - 100);
      }
    });

    it('should reject redemption with insufficient points', async () => {
      // Create a fresh user with 0 points
      const signupRes = await request(app)
        .post('/auth/signup')
        .send({
          email: 'poor-loyalty@example.com',
          password: 'testpass123',
          role: 'customer',
        });

      const res = await request(app)
        .post('/loyalty/redeem')
        .set('Authorization', `Bearer ${signupRes.body.token}`)
        .send({ rewardId: 'free_delivery', points: 100, discountCents: 500 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Insufficient/);
    });

    it('should reject non-existent reward', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/loyalty/redeem')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({ rewardId: 'nonexistent', points: 100, discountCents: 500 });

      expect(res.status).toBe(404);
    });

    it('should reject points mismatch', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/loyalty/redeem')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({ rewardId: 'free_delivery', points: 50, discountCents: 500 }); // wrong points

      expect(res.status).toBe(400);
    });
  });
});
