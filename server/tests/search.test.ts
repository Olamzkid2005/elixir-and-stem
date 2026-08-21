import request from 'supertest';
import { app } from '../src/app';
import { prisma, setupTestData, cleanupTestData, disconnectPrisma, getMerchant, getProduct } from './setup';

beforeAll(async () => {
  await setupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

describe('Products Search Routes', () => {
  describe('GET /products/search', () => {
    it('should return all approved products with no query', async () => {
      const res = await request(app).get('/products/search');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should search by product name', async () => {
      const res = await request(app).get('/products/search?q=Test+Flower');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].name).toBe('Test Flower');
    });

    it('should search by brand', async () => {
      const res = await request(app).get('/products/search?q=Test+Brand');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].brand).toBe('Test Brand');
    });

    it('should search by description', async () => {
      const res = await request(app).get('/products/search?q=unit+tests');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should search by strain type', async () => {
      const res = await request(app).get('/products/search?q=sativa');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].strainType).toBe('sativa');
    });

    it('should filter by category', async () => {
      const res = await request(app).get('/products/search?category=Flower');

      expect(res.status).toBe(200);
      expect(res.body.every((p: any) => p.category === 'Flower')).toBe(true);
    });

    it('should combine text search and category filter', async () => {
      const res = await request(app).get('/products/search?q=Test&category=Flower');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].category).toBe('Flower');
      expect(res.body[0].name.toLowerCase()).toContain('test');
    });

    it('should return empty for non-matching query', async () => {
      const res = await request(app).get('/products/search?q=xyznonexistent');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should be case-insensitive', async () => {
      const res = await request(app).get('/products/search?q=TEST');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should not return products from unapproved merchants', async () => {
      // Create an unapproved merchant with a product
      const bcrypt = require('bcryptjs');
      const { signToken } = require('../src/auth');
      const password = await bcrypt.hash('password123', 10);

      const user = await prisma.user.create({
        data: { email: 'unapproved-merchant@example.com', passwordHash: password, role: 'merchant', ageVerified: true },
      });
      const merchant = await prisma.merchant.create({
        data: {
          userId: user.id, businessName: 'Unapproved Shop', licenseNumber: 'CA-UNAP-001',
          status: 'pending', address: '999 Unapproved St, LA, CA', lat: 0, lng: 0,
        },
      });
      await prisma.product.create({
        data: {
          merchantId: merchant.id, name: 'Secret Unapproved Product', category: 'Flower',
          price: 1000, weightOptions: [{ label: '1g', price: 1000 }], stock: 5,
        },
      });

      const res = await request(app).get('/products/search?q=Secret+Unapproved');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);

      // Cleanup
      await prisma.product.deleteMany({ where: { merchantId: merchant.id } });
      await prisma.merchant.delete({ where: { id: merchant.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
