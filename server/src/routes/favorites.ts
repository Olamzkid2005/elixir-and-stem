import { Router } from 'express';
import { z } from 'zod';
import { prisma, requireAuth } from '../auth';

export const favoritesRouter = Router();

// All favorites routes require authentication
favoritesRouter.use(requireAuth);

/** GET /favorites — list current user's favorited products */
favoritesRouter.get('/', async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(favorites.map((f) => f.product));
});

/** POST /favorites — toggle favorite on/off */
const toggleInput = z.object({ productId: z.string() });

favoritesRouter.post('/', async (req, res) => {
  const parsed = toggleInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'productId is required.' });

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: req.user!.id, productId: parsed.data.productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return res.json({ favorited: false });
  }

  await prisma.favorite.create({
    data: { userId: req.user!.id, productId: parsed.data.productId },
  });
  res.json({ favorited: true });
});

/** DELETE /favorites/:productId — remove from favorites */
favoritesRouter.delete('/:productId', async (req, res) => {
  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: req.user!.id, productId: req.params.productId } },
  });
  if (!existing) return res.status(404).json({ error: 'Not in favorites.' });

  await prisma.favorite.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});
