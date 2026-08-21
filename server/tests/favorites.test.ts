import request from 'supertest';
import { app } from '../src/app';
import { prisma, setupTestData, cleanupTestData, disconnectPrisma, getCustomer, getProduct } from './setup';

beforeAll(async () => {
  await setupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await disconnectPrisma();
});

// Helper: ensure a favorite exists
async function ensureFavorited() {
  const customer = getCustomer();
  const product = getProduct();
  // Remove any existing favorite first to get to a known state
  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: customer.id, productId: product.id } },
  });
  if (!existing) {
    await request(app)
      .post('/favorites')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ productId: product.id });
  }
}

// Helper: ensure no favorite exists
async function ensureNotFavorited() {
  const customer = getCustomer();
  const product = getProduct();
  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: customer.id, productId: product.id } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  }
}

describe('Favorites Routes', () => {
  describe('POST /favorites', () => {
    it('should toggle favorite on', async () => {
      await ensureNotFavorited();
      const customer = getCustomer();
      const product = getProduct();

      const res = await request(app)
        .post('/favorites')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({ productId: product.id });

      expect(res.status).toBe(200);
      expect(res.body.favorited).toBe(true);
    });

    it('should toggle favorite off on second call', async () => {
      await ensureFavorited();
      const customer = getCustomer();
      const product = getProduct();

      const res = await request(app)
        .post('/favorites')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({ productId: product.id });

      expect(res.status).toBe(200);
      expect(res.body.favorited).toBe(false);
    });

    it('should reject without productId', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .post('/favorites')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const product = getProduct();
      const res = await request(app)
        .post('/favorites')
        .send({ productId: product.id });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /favorites', () => {
    it('should list favorited products', async () => {
      await ensureFavorited();
      const customer = getCustomer();
      const product = getProduct();

      const res = await request(app)
        .get('/favorites')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((p: any) => p.id === product.id);
      expect(found).toBeDefined();
    });
  });

  describe('DELETE /favorites/:productId', () => {
    it('should remove a favorite', async () => {
      await ensureFavorited();
      const customer = getCustomer();
      const product = getProduct();

      const res = await request(app)
        .delete(`/favorites/${product.id}`)
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should return 404 if not in favorites', async () => {
      const customer = getCustomer();
      const res = await request(app)
        .delete('/favorites/nonexistent-product')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(404);
    });
  });
});
