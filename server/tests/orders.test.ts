import request from 'supertest';
import { app } from '../src/app';
import { calculateTax, calculateDeliveryFee, calculateDistance } from '../src/tax';
import {
  prisma, setupTestData, cleanupTestData, disconnectPrisma,
  getCustomer, getMerchant, getProduct,
} from './setup';

let orderId: string;
let orderItemId: string;

beforeAll(async () => {
  await setupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

describe('Orders Routes', () => {
  describe('POST /orders', () => {
    it('should create an order with server-computed totals', async () => {
      const customer = getCustomer();
      const product = getProduct();

      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          merchantId: product.merchantId,
          deliveryAddress: '100 Test Ave, Los Angeles, CA 90001',
          items: [{ productId: product.id, weightLabel: '3.5g', quantity: 2 }],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('placed');
      expect(res.body.subtotal).toBe(9000); // 4500 * 2
      // Tax and delivery fee are now calculated dynamically
      const expectedTax = calculateTax(9000, 'LA');
      expect(res.body.tax).toBe(expectedTax);
      expect(res.body.deliveryFee).toBeGreaterThanOrEqual(0);
      expect(res.body.total).toBe(9000 + expectedTax + res.body.deliveryFee);
      expect(res.body.items).toHaveLength(1);

      orderId = res.body.id;
      orderItemId = res.body.items[0].id;
    });

    it('should create a scheduled order', async () => {
      const customer = getCustomer();
      const product = getProduct();
      const tomorrow = new Date(Date.now() + 86400000).toISOString();

      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          merchantId: product.merchantId,
          deliveryAddress: '200 Scheduled Ave, Los Angeles, CA 90002',
          scheduledFor: tomorrow,
          items: [{ productId: product.id, weightLabel: '7g', quantity: 1 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.scheduledFor).toBeDefined();
      const expectedTax = calculateTax(8500, 'LA');
      expect(res.body.total).toBe(8500 + expectedTax + res.body.deliveryFee);
    });

    it('should reject order with no items', async () => {
      const customer = getCustomer();
      const product = getProduct();

      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          merchantId: product.merchantId,
          deliveryAddress: '300 Empty Ave, Los Angeles, CA 90003',
          items: [],
        });

      expect(res.status).toBe(400);
    });

    it('should reject order to unapproved merchant', async () => {
      const customer = getCustomer();

      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          merchantId: 'nonexistent-merchant-id',
          deliveryAddress: '400 Bad Ave, Los Angeles, CA 90004',
          items: [{ productId: 'fake-product', weightLabel: '3.5g', quantity: 1 }],
        });

      expect(res.status).toBe(400);
    });

    it('should reject customer order without auth', async () => {
      const product = getProduct();
      const res = await request(app)
        .post('/orders')
        .send({
          merchantId: product.merchantId,
          deliveryAddress: '500 No Auth Ave, Los Angeles, CA 90005',
          items: [{ productId: product.id, weightLabel: '3.5g', quantity: 1 }],
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /orders', () => {
    it('should return customer own orders', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return merchant orders', async () => {
      const merchant = getMerchant();
      const res = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${merchant.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter merchant orders by scheduled', async () => {
      const merchant = getMerchant();
      const res = await request(app)
        .get('/orders?scheduled=true')
        .set('Authorization', `Bearer ${merchant.token}`);

      expect(res.status).toBe(200);
      // All returned orders should have scheduledFor
      expect(res.body.every((o: any) => o.scheduledFor !== null)).toBe(true);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should advance order from placed to confirmed', async () => {
      const merchant = getMerchant();
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'confirmed' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('confirmed');
    });

    it('should advance order from confirmed to out_for_delivery', async () => {
      const merchant = getMerchant();
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'out_for_delivery' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('out_for_delivery');
    });

    it('should advance order from out_for_delivery to delivered and award points', async () => {
      const merchant = getMerchant();
      const customer = getCustomer();
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'delivered' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('delivered');

      // Check that loyalty points were awarded
      const loyaltyRes = await request(app)
        .get('/loyalty/me')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(loyaltyRes.status).toBe(200);
      expect(loyaltyRes.body.points).toBeGreaterThan(0);
    });

    it('should reject invalid status transition', async () => {
      const merchant = getMerchant();
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'placed' }); // can't go backwards

      expect(res.status).toBe(400);
    });
  });
});
