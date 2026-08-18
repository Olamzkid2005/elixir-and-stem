import { Router } from 'express';
import { prisma, requireAuth, requireRole } from '../auth';

export const adminRouter = Router();

// All admin routes require an admin JWT (seeded admin user; manage via a web dashboard).
adminRouter.use(requireAuth, requireRole('admin'));

/** GET /admin/merchants?status=pending — review queue. */
adminRouter.get('/merchants', async (req, res) => {
  const status = req.query.status as string | undefined;
  const merchants = await prisma.merchant.findMany({
    where: status ? { status: status as any } : {},
    include: { user: { select: { email: true, createdAt: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(merchants);
});

/** PATCH /admin/merchants/:id — the ONLY place merchant status changes (manual review). */
adminRouter.patch('/merchants/:id', async (req, res) => {
  const { status } = req.body as { status?: 'approved' | 'rejected' };
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }
  const merchant = await prisma.merchant.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(merchant);
});

/** GET /admin/users — all customers and merchants. */
adminRouter.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, suspended: true, createdAt: true },
  });
  res.json(users);
});

/** PATCH /admin/users/:id/suspend — flag/suspend an account. */
adminRouter.patch('/users/:id/suspend', async (req, res) => {
  const { suspended } = req.body as { suspended?: boolean };
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { suspended: suspended ?? true },
    select: { id: true, email: true, suspended: true },
  });
  res.json(user);
});
