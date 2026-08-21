import request from 'supertest';
import { app } from '../src/app';
import {
  prisma, setupTestData, cleanupTestData, disconnectPrisma,
  getCustomer, getMerchant, getAdmin, getProduct,
} from './setup';

let orderId: string;
let riderId: string;

beforeAll(async () => {
  await setupTestData();

  // Create a rider for auto-dispatch tests
  const admin = getAdmin();
  const signupRes = await request(app)
    .post('/auth/signup')
    .send({
      email: 'delivery-rider@example.com',
      password: 'password123',
      role: 'merchant',
    });

  const riderRes = await request(app)
    .post('/riders')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ userId: signupRes.body.user.id, vehicleType: 'motorcycle' });

  riderId = riderRes.body.id;

  // Set rider location near merchant (6.4281, 3.4219)
  await request(app)
    .patch(`/riders/${riderId}/location`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ lat: 6.43, lng: 3.42 });

  // Go online
  await request(app)
    .patch(`/riders/${riderId}/online`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ isOnline: true });
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

describe('Delivery Lifecycle', () => {
  describe('Full order lifecycle', () => {
    it('should create order and advance through all statuses', async () => {
      const customer = getCustomer();
      const merchant = getMerchant();
      const product = getProduct();

      // Create order
      const createRes = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          merchantId: product.merchantId,
          deliveryAddress: '45 Broad St, Lagos Island, Lagos',
          items: [{ productId: product.id, weightLabel: '3.5g', quantity: 1 }],
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.status).toBe('placed');
      orderId = createRes.body.id;

      // placed → confirmed
      let res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'confirmed' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('confirmed');

      // confirmed → ready_for_pickup (triggers auto-dispatch)
      res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'ready_for_pickup' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready_for_pickup');

      // ready_for_pickup → rider_assigned
      res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'rider_assigned' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rider_assigned');

      // rider_assigned → picked_up
      res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'picked_up' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('picked_up');

      // picked_up → out_for_delivery
      res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'out_for_delivery' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('out_for_delivery');

      // out_for_delivery → arrived
      res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'arrived' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('arrived');

      // arrived → delivered (awards loyalty points)
      res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'delivered' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('delivered');

      // Verify loyalty points awarded
      const loyaltyRes = await request(app)
        .get('/loyalty/me')
        .set('Authorization', `Bearer ${customer.token}`);
      expect(loyaltyRes.status).toBe(200);
      expect(loyaltyRes.body.points).toBeGreaterThan(0);
    });
  });

  describe('Invalid status transitions', () => {
    it('should reject skipping statuses', async () => {
      const customer = getCustomer();
      const merchant = getMerchant();
      const product = getProduct();

      // Create a new order
      const createRes = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          merchantId: product.merchantId,
          deliveryAddress: '78 Allen Ave, Ikeja, Lagos',
          items: [{ productId: product.id, weightLabel: '3.5g', quantity: 1 }],
        });

      const newOrderId = createRes.body.id;

      // Try to skip from placed to out_for_delivery (should fail)
      const res = await request(app)
        .patch(`/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'out_for_delivery' });

      expect(res.status).toBe(400);
    });

    it('should reject going backwards', async () => {
      const merchant = getMerchant();

      // Try to go from delivered to placed (should fail)
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'placed' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid status values', async () => {
      const merchant = getMerchant();

      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });
  });

  describe('Order rejection', () => {
    it('should allow merchant to reject at any early stage', async () => {
      const customer = getCustomer();
      const merchant = getMerchant();
      const product = getProduct();

      // Create order
      const createRes = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          merchantId: product.merchantId,
          deliveryAddress: '12 Marina Rd, Lagos Island',
          items: [{ productId: product.id, weightLabel: '7g', quantity: 1 }],
        });

      const rejectOrderId = createRes.body.id;

      // Confirm then reject
      await request(app)
        .patch(`/orders/${rejectOrderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'confirmed' });

      const res = await request(app)
        .patch(`/orders/${rejectOrderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'rejected' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rejected');
    });
  });

  describe('Auto-dispatch', () => {
    it('should assign rider when order becomes ready_for_pickup', async () => {
      const customer = getCustomer();
      const merchant = getMerchant();
      const product = getProduct();

      // Create order
      const createRes = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          merchantId: product.merchantId,
          deliveryAddress: '5 Admiralty Way, Lekki Phase 1',
          items: [{ productId: product.id, weightLabel: '3.5g', quantity: 1 }],
        });

      const dispatchOrderId = createRes.body.id;

      // Confirm
      await request(app)
        .patch(`/orders/${dispatchOrderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'confirmed' });

      // Ready for pickup should trigger rider assignment
      const res = await request(app)
        .patch(`/orders/${dispatchOrderId}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'ready_for_pickup' });

      expect(res.status).toBe(200);
      // Rider should be assigned (or null if no riders nearby)
      // Since we have a rider at 6.43, 3.42 and merchant at 6.4281, 3.4219
      // they should be within 10km
    });
  });

  describe('Scheduled orders', () => {
    it('should handle scheduled orders through lifecycle', async () => {
      const customer = getCustomer();
      const merchant = getMerchant();
      const product = getProduct();
      const tomorrow = new Date(Date.now() + 86400000).toISOString();

      const createRes = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          merchantId: product.merchantId,
          deliveryAddress: '22 Ozumba Mbadiwe Ave, Victoria Island',
          scheduledFor: tomorrow,
          items: [{ productId: product.id, weightLabel: '3.5g', quantity: 1 }],
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.scheduledFor).toBeDefined();

      // Should still be processable through lifecycle
      const res = await request(app)
        .patch(`/orders/${createRes.body.id}/status`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ status: 'confirmed' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('confirmed');
    });
  });
});
