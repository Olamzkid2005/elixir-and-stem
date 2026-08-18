import { Router } from 'express';
import { z } from 'zod';
import { prisma, requireAuth, requireRole } from '../auth';

export const productsRouter = Router();

/** GET /products?merchantId= — only products of approved merchants are listed publicly. */
productsRouter.get('/', async (req, res) => {
  const merchantId = req.query.merchantId as string | undefined;
  const products = await prisma.product.findMany({
    where: {
      ...(merchantId ? { merchantId } : {}),
      merchant: { status: 'approved' },
    },
  });
  res.json(products);
});

const productInput = z.object({
  name: z.string().min(1),
  brand: z.string().default(''),
  category: z.enum(['Flower', 'Edibles', 'Vapes', 'Concentrates', 'Tinctures', 'Topicals']),
  strainType: z.enum(['sativa', 'indica', 'hybrid']).optional(),
  thcPct: z.number().min(0).max(100).optional(),
  cbdPct: z.number().min(0).max(100).optional(),
  description: z.string().default(''),
  terpenes: z.array(z.string()).default([]),
  price: z.number().int().positive(), // cents
  weightOptions: z.array(z.object({ label: z.string(), price: z.number().int().positive() })),
  stock: z.number().int().min(0),
  imageUrl: z.string().optional(),
});

async function ownedMerchant(userId: string) {
  return prisma.merchant.findUnique({ where: { userId } });
}

productsRouter.post('/', requireAuth, requireRole('merchant'), async (req, res) => {
  const merchant = await ownedMerchant(req.user!.id);
  if (!merchant) return res.status(404).json({ error: 'Complete merchant onboarding first.' });
  const parsed = productInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid product fields.' });

  const product = await prisma.product.create({
    data: { ...parsed.data, merchantId: merchant.id },
  });
  res.status(201).json(product);
});

productsRouter.patch('/:id', requireAuth, requireRole('merchant'), async (req, res) => {
  const merchant = await ownedMerchant(req.user!.id);
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!merchant || !product || product.merchantId !== merchant.id) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const parsed = productInput.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid product fields.' });

  res.json(await prisma.product.update({ where: { id: product.id }, data: parsed.data }));
});

productsRouter.delete('/:id', requireAuth, requireRole('merchant'), async (req, res) => {
  const merchant = await ownedMerchant(req.user!.id);
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!merchant || !product || product.merchantId !== merchant.id) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  await prisma.product.delete({ where: { id: product.id } });
  res.json({ ok: true });
});
