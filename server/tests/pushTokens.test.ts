import request from 'supertest';
import { app } from '../src/app';
import {
  prisma, setupTestData, cleanupTestData, disconnectPrisma,
  getCustomer, getMerchant, getProduct,
} from './setup';

beforeAll(async () => {
  await setupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

describe('Push Token Routes', () => {
  describe('POST /push-tokens', () => {
    it('should register a push token', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/push-tokens')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          token: 'ExponentPushToken[test-token-abc123]',
          platform: 'ios',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should be idempotent for same token + user', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/push-tokens')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          token: 'ExponentPushToken[test-token-abc123]',
          platform: 'ios',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should register a second token for the same user', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/push-tokens')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          token: 'ExponentPushToken[second-token-def456]',
          platform: 'android',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should reject invalid token', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/push-tokens')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          token: 'short',
          platform: 'ios',
        });

      expect(res.status).toBe(400);
    });

    it('should reject invalid platform', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/push-tokens')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          token: 'ExponentPushToken[valid-token]',
          platform: 'windows',
        });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/push-tokens')
        .send({
          token: 'ExponentPushToken[no-auth]',
          platform: 'ios',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /push-tokens', () => {
    it('should unregister all push tokens for user', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .delete('/push-tokens')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Verify tokens are gone
      const tokens = await prisma.pushToken.findMany({
        where: { userId: customer.id },
      });
      expect(tokens).toHaveLength(0);
    });
  });

  describe('DELETE /push-tokens/:token', () => {
    it('should unregister a specific push token', async () => {
      const customer = getCustomer();

      // Register a token first
      await request(app)
        .post('/push-tokens')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          token: 'ExponentPushToken[specific-delete-token]',
          platform: 'ios',
        });

      // Delete it
      const res = await request(app)
        .delete(`/push-tokens/${encodeURIComponent('ExponentPushToken[specific-delete-token]')}`)
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should return 404 for non-existent token', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .delete(`/push-tokens/${encodeURIComponent('ExponentPushToken[nonexistent]')}`)
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /push-tokens/test', () => {
    it('should send a test notification when tokens are registered', async () => {
      const customer = getCustomer();

      // Register a token first
      await request(app)
        .post('/push-tokens')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          token: 'ExponentPushToken[test-notification-token]',
          platform: 'ios',
        });

      const res = await request(app)
        .post('/push-tokens/test')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.message).toMatch(/1 device/);
    });

    it('should reject when no tokens are registered', async () => {
      const customer = getCustomer();

      // Ensure no tokens
      await prisma.pushToken.deleteMany({ where: { userId: customer.id } });

      const res = await request(app)
        .post('/push-tokens/test')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/No push tokens/);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).post('/push-tokens/test');
      expect(res.status).toBe(401);
    });
  });

  describe('Push notifications on order status change', () => {
    it('should not fail when sending notifications (no tokens registered)', async () => {
      const customer = getCustomer();
      const product = getProduct();

      // Create an order
      const orderRes = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          merchantId: product.merchantId,
          deliveryAddress: '100 Push Ave, Los Angeles, CA 90001',
          items: [{ productId: product.id, weightLabel: '3.5g', quantity: 1 }],
        });

      expect(orderRes.status).toBe(201);
      const orderId = orderRes.body.id;

      // Update status — should not fail even without push tokens
      const merchant = getMerchant();
      const statusRes = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'confirmed' });

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.status).toBe('confirmed');
    });

    it('should handle status transitions with registered tokens', async () => {
      const customer = getCustomer();
      const product = getProduct();
      const merchant = getMerchant();

      // Register a push token
      await request(app)
        .post('/push-tokens')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          token: 'ExponentPushToken[test-status-notification]',
          platform: 'ios',
        });

      // Create an order
      const orderRes = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          merchantId: product.merchantId,
          deliveryAddress: '200 Push Ave, Los Angeles, CA 90002',
          items: [{ productId: product.id, weightLabel: '3.5g', quantity: 1 }],
        });

      const orderId = orderRes.body.id;

      // Advance through statuses — each should trigger a notification (fire-and-forget)
      const statuses = ['confirmed', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'out_for_delivery', 'arrived', 'delivered'];
      for (const status of statuses) {
        const res = await request(app)
          .patch(`/orders/${orderId}/status`)
          .set('Authorization', `Bearer ${merchant.token}`)
          .send({ status });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(status);
      }

      // Clean up
      await request(app)
        .delete('/push-tokens')
        .set('Authorization', `Bearer ${customer.token}`);
    });
  });
});
