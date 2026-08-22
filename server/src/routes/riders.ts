import { Router } from 'express';
import { z } from 'zod';
import { prisma, requireAuth, requireRole } from '../auth';

export const ridersRouter = Router();

const locationUpdate = z.object({
  lat: z.number(),
  lng: z.number(),
});

// ── Static routes FIRST (before parameterized) ───────────────────────────

/** GET /riders/online — list online riders (admin) */
ridersRouter.get('/online', requireAuth, requireRole('admin'), async (_req, res) => {
  const riders = await prisma.rider.findMany({
    where: { isOnline: true },
    include: { user: { select: { email: true } } },
  });
  res.json(riders);
});

/** GET /riders/list — list all riders (admin) */
ridersRouter.get('/list', requireAuth, requireRole('admin'), async (_req, res) => {
  const riders = await prisma.rider.findMany({
    include: { user: { select: { email: true } } },
  });
  res.json(riders);
});

/** GET /riders/order/:orderId — get rider assigned to an order */
ridersRouter.get('/order/:orderId', requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    select: {
      rider: {
        select: {
          id: true,
          lat: true,
          lng: true,
          isOnline: true,
          vehicleType: true,
          rating: true,
        },
      },
    },
  });

  if (!order?.rider) return res.json({ rider: null });
  res.json({ rider: order.rider });
});

// ── Parameterized routes AFTER static ────────────────────────────────────

/** GET /riders/:id/location — get rider's current location */
ridersRouter.get('/:id/location', requireAuth, async (req, res) => {
  const rider = await prisma.rider.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      lat: true,
      lng: true,
      isOnline: true,
      vehicleType: true,
      rating: true,
    },
  });

  if (!rider) return res.status(404).json({ error: 'Rider not found.' });
  res.json(rider);
});

// ── Write routes ─────────────────────────────────────────────────────────

/** POST /riders — create a rider profile (admin) */
ridersRouter.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { userId, vehicleType } = req.body as { userId: string; vehicleType?: string };
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found.' });
  
  const existing = await prisma.rider.findUnique({ where: { userId } });
  if (existing) return res.status(409).json({ error: 'User is already a rider.' });

  const rider = await prisma.rider.create({
    data: {
      userId,
      vehicleType: vehicleType || 'motorcycle',
    },
  });
  res.status(201).json(rider);
});

/** PATCH /riders/:id/location — update rider location (admin) */
ridersRouter.patch('/:id/location', requireAuth, requireRole('admin'), async (req, res) => {
  const parsed = locationUpdate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid location.' });

  const rider = await prisma.rider.findUnique({ where: { id: req.params.id } });
  if (!rider) return res.status(404).json({ error: 'Rider not found.' });

  const updated = await prisma.rider.update({
    where: { id: rider.id },
    data: { lat: parsed.data.lat, lng: parsed.data.lng },
  });
  res.json(updated);
});

/** PATCH /riders/:id/online — toggle rider online status (admin) */
ridersRouter.patch('/:id/online', requireAuth, requireRole('admin'), async (req, res) => {
  const { isOnline } = req.body as { isOnline?: boolean };
  
  const rider = await prisma.rider.findUnique({ where: { id: req.params.id } });
  if (!rider) return res.status(404).json({ error: 'Rider not found.' });

  const updated = await prisma.rider.update({
    where: { id: rider.id },
    data: { isOnline: isOnline ?? !rider.isOnline },
  });
  res.json(updated);
});
