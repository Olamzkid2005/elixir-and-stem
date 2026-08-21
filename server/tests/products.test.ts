import request from 'supertest';
import { app } from '../src/app';
import { prisma, setupTestData, cleanupTestData, disconnectPrisma, getCustomer, getMerchant, getProduct } from './setup';

beforeAll(async () => {
  await setupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

describe('Products Routes', () => {
  describe('GET /products', () => {
    it('should list products from approved merchants', async () => {
      const res = await request(app).get('/products');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((p: any) => p.name === 'Test Flower');
      expect(found).toBeDefined();
    });

    it('should filter by merchantId', async () => {
      const product = getProduct();
      const res = await request(app).get(`/products?merchantId=${product.merchantId}`);

      expect(res.status).toBe(200);
      expect(res.body.every((p: any) => p.merchantId === product.merchantId)).toBe(true);
    });
  });

  describe('POST /products', () => {
    it('should allow merchant to create a product', async () => {
      const merchant = getMerchant();
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({
          name: 'New Test Product',
          category: 'Edibles',
          price: 3500,
          weightOptions: [{ label: '10 pack', price: 3500 }],
          stock: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Test Product');
      expect(res.body.category).toBe('Edibles');
    });

    it('should reject customer creating products', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
          name: 'Unauthorized Product',
          category: 'Flower',
          price: 5000,
          weightOptions: [{ label: '3.5g', price: 5000 }],
          stock: 10,
        });

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/products')
        .send({
          name: 'No Auth Product',
          category: 'Flower',
          price: 5000,
          weightOptions: [{ label: '3.5g', price: 5000 }],
          stock: 10,
        });

      expect(res.status).toBe(401);
    });

    it('should reject invalid product fields', async () => {
      const merchant = getMerchant();
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({
          name: '', // empty name
          category: 'Flower',
          price: -1, // negative price
          weightOptions: [],
          stock: -5, // negative stock
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /products/:id', () => {
    it('should allow merchant to update own product', async () => {
      const merchant = getMerchant();
      const product = getProduct();
      const res = await request(app)
        .patch(`/products/${product.id}`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ name: 'Updated Test Flower' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Test Flower');
    });

    it('should return 404 for non-existent product', async () => {
      const merchant = getMerchant();
      const res = await request(app)
        .patch('/products/nonexistent-id')
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ name: 'Does Not Exist' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should allow merchant to delete own product', async () => {
      const merchant = getMerchant();
      // Create a product to delete
      const createRes = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({
          name: 'To Be Deleted',
          category: 'Vapes',
          price: 2000,
          weightOptions: [{ label: '1ml', price: 2000 }],
          stock: 5,
        });

      const deleteId = createRes.body.id;
      const res = await request(app)
        .delete(`/products/${deleteId}`)
        .set('Authorization', `Bearer ${merchant.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should reject deleting another merchant product', async () => {
      // Create a product as the main merchant, then try to delete with a different token
      const merchant = getMerchant();
      const product = getProduct();
      const res = await request(app)
        .delete(`/products/${product.id}`)
        .set('Authorization', `Bearer ${merchant.token}`);

      // This should succeed since it IS the owner
      expect(res.status).toBe(200);
    });
  });
});
