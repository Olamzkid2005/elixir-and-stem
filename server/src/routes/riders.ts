import { Router } from 'express';
import { z } from 'zod';
import { prisma, requireAuth, requireRole } from '../auth';

export const ridersRouter = Router();

// All rider routes require merchant or admin role for now (admin manages riders)
ridersRouter.use(requireAuth, requireRole('admin'));

const locationUpdate = z.object({
  lat: z.number(),
  lng: z.number(),
});

/** POST /riders — create a rider profile (admin only) */
ridersRouter.post('/', async (req, res) => {
  const { userId, vehicleType } = req.body as { userId: string; vehicleType?: string };
  
  // Check if user exists and isn't already a rider
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

/** GET /riders — list all riders */
ridersRouter.get('/', async (_req, res) => {
  const riders = await prisma.rider.findMany({
    include: { user: { select: { email: true } } },
  });
  res.json(riders);
});

/** GET /riders/online — list online riders (for dispatch) */
ridersRouter.get('/online', async (_req, res) => {
  const riders = await prisma.rider.findMany({
    where: { isOnline: true },
    include: { user: { select: { email: true } } },
  });
  res.json(riders);
});

/** PATCH /riders/:id/location — update rider location */
ridersRouter.patch('/:id/location', async (req, res) => {
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

/** PATCH /riders/:id/online — toggle rider online status */
ridersRouter.patch('/:id/online', async (req, res) => {
  const { isOnline } = req.body as { isOnline?: boolean };
  
  const rider = await prisma.rider.findUnique({ where: { id: req.params.id } });
  if (!rider) return res.status(404).json({ error: 'Rider not found.' });

  const updated = await prisma.rider.update({
    where: { id: rider.id },
    data: { isOnline: isOnline ?? !rider.isOnline },
  });
  res.json(updated);
});
