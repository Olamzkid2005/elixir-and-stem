import request from 'supertest';
import { app } from '../src/app';
import {
  prisma, setupTestData, cleanupTestData, disconnectPrisma,
  getCustomer, getMerchant, getProduct,
} from './setup';

let deliveredOrderId: string;
let deliveredOrderItemId: string;

beforeAll(async () => {
  await setupTestData();

  // Create a delivered order with order items for review testing
  const customer = getCustomer();
  const product = getProduct();

  const orderRes = await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({
      merchantId: product.merchantId,
      deliveryAddress: '100 Review Ave, Los Angeles, CA 90001',
      items: [{ productId: product.id, weightLabel: '3.5g', quantity: 1 }],
    });

  deliveredOrderId = orderRes.body.id;
  deliveredOrderItemId = orderRes.body.items[0].id;

  // Advance order to delivered
  const merchant = getMerchant();
  await request(app)
    .patch(`/orders/${deliveredOrderId}/status`)
    .set('Authorization', `Bearer ${merchant.token}`)
    .send({ status: 'confirmed' });

  await request(app)
    .patch(`/orders/${deliveredOrderId}/status`)
    .set('Authorization', `Bearer ${merchant.token}`)
    .send({ status: 'out_for_delivery' });

  await request(app)
    .patch(`/orders/${deliveredOrderId}/status`)
    .set('Authorization', `Bearer ${merchant.token}`)
    .send({ status: 'delivered' });
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

describe('Reviews Routes', () => {
  describe('POST /reviews', () => {
    it('should submit a review for a delivered order item', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          orderItemId: deliveredOrderItemId,
          rating: 5,
          comment: 'Amazing quality! Would definitely order again.',
        });

      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(5);
      expect(res.body.comment).toBe('Amazing quality! Would definitely order again.');
      expect(res.body.orderItemId).toBe(deliveredOrderItemId);
    });

    it('should reject duplicate review for same order item', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          orderItemId: deliveredOrderItemId,
          rating: 4,
          comment: 'Second review attempt.',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already reviewed/);
    });

    it('should reject review for non-existent order item', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          orderItemId: 'nonexistent-item-id',
          rating: 5,
        });

      expect(res.status).toBe(404);
    });

    it('should reject review with invalid rating', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          orderItemId: deliveredOrderItemId,
          rating: 6, // max is 5
        });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/reviews')
        .send({
          orderItemId: deliveredOrderItemId,
          rating: 5,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /reviews/product/:id', () => {
    it('should list reviews for a product', async () => {
      const customer = getCustomer();
      const product = getProduct();
      const res = await request(app)
        .get(`/reviews/product/${product.id}`)
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('rating');
      expect(res.body[0]).toHaveProperty('comment');
    });
  });

  describe('GET /reviews/merchant/:id', () => {
    it('should list reviews for a merchant products', async () => {
      const customer = getCustomer();
      const product = getProduct();
      const res = await request(app)
        .get(`/reviews/merchant/${product.merchantId}`)
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
