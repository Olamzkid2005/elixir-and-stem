import { Router } from 'express';
import { z } from 'zod';
import { prisma, requireAuth, requireRole } from '../auth';

export const merchantsRouter = Router();

const registration = z.object({
  businessName: z.string().min(2),
  licenseNumber: z.string().min(4),
  licenseDocUrl: z.string().optional(),
  address: z.string().min(6),
  lat: z.number().optional(),
  lng: z.number().optional(),
  stateCode: z.string().length(2).optional(),
});

/** GET /merchants — public: only approved shops are visible to customers. */
merchantsRouter.get('/', async (_req, res) => {
  const merchants = await prisma.merchant.findMany({ where: { status: 'approved' } });
  res.json(merchants.map((m) => ({
    ...m,
    deliveryEtaMins: [m.deliveryEtaMin, m.deliveryEtaMax] as [number, number],
    distanceMiles: undefined,
  })));
});

/** GET /merchants/me — the signed-in merchant's own record (any status). */
merchantsRouter.get('/me', requireAuth, requireRole('merchant'), async (req, res) => {
  const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
  if (!merchant) return res.status(404).json({ error: 'No merchant profile yet.' });
  res.json(merchant);
});

/**
 * POST /merchants — register a dispensary.
 * Always created as `pending`; only the admin route flips status. Never auto-approve.
 */
merchantsRouter.post('/', requireAuth, requireRole('merchant'), async (req, res) => {
  const parsed = registration.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Missing or invalid business fields.' });

  const existing = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
  if (existing) return res.status(409).json({ error: 'Merchant profile already exists.' });

  const merchant = await prisma.merchant.create({
    data: {
      ...parsed.data,
      lat: parsed.data.lat ?? 0,
      lng: parsed.data.lng ?? 0,
      userId: req.user!.id,
      status: 'pending',
    },
  });
  res.status(201).json({ status: merchant.status });
});

/** PATCH /merchants/me — update own profile (business info, license doc). */
merchantsRouter.patch('/me', requireAuth, requireRole('merchant'), async (req, res) => {
  const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
  if (!merchant) return res.status(404).json({ error: 'No merchant profile yet.' });

  const { businessName, licenseNumber, licenseDocUrl, address, lat, lng, stateCode } = req.body;
  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      ...(businessName && { businessName }),
      ...(licenseNumber && { licenseNumber }),
      ...(licenseDocUrl !== undefined && { licenseDocUrl }),
      ...(address && { address }),
      ...(lat !== undefined && { lat }),
      ...(lng !== undefined && { lng }),
      ...(stateCode && { stateCode }),
    },
  });
  res.json(updated);
});
