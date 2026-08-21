import { Router } from 'express';
import { z } from 'zod';
import { prisma, requireAuth } from '../auth';
import { notifyUser } from '../notifications';

export const pushTokensRouter = Router();

// All push token routes require authentication
pushTokensRouter.use(requireAuth);

/** POST /push-tokens — register a push token */
const registerInput = z.object({
  token: z.string().min(10),
  platform: z.enum(['ios', 'android', 'web']),
});

pushTokensRouter.post('/', async (req, res) => {
  const parsed = registerInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid push token payload.' });

  const { token, platform } = parsed.data;

  // Upsert: if token already exists, update the userId (user re-installed app)
  const existing = await prisma.pushToken.findUnique({ where: { token } });
  if (existing) {
    if (existing.userId === req.user!.id) {
      return res.json({ ok: true, message: 'Token already registered.' });
    }
    // Token belongs to a different user (shouldn't happen, but handle gracefully)
    await prisma.pushToken.update({
      where: { id: existing.id },
      data: { userId: req.user!.id },
    });
    return res.json({ ok: true, message: 'Token transferred.' });
  }

  await prisma.pushToken.create({
    data: {
      userId: req.user!.id,
      token,
      platform,
    },
  });

  res.json({ ok: true, message: 'Push token registered.' });
});

/** DELETE /push-tokens — unregister all push tokens for this user */
pushTokensRouter.delete('/', async (req, res) => {
  await prisma.pushToken.deleteMany({ where: { userId: req.user!.id } });
  res.json({ ok: true });
});

/** DELETE /push-tokens/:token — unregister a specific push token */
pushTokensRouter.delete('/:token', async (req, res) => {
  const token = decodeURIComponent(req.params.token);
  const existing = await prisma.pushToken.findUnique({ where: { token } });
  if (!existing || existing.userId !== req.user!.id) {
    return res.status(404).json({ error: 'Token not found.' });
  }
  await prisma.pushToken.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

/** POST /push-tokens/test — send a test notification to the current user */
pushTokensRouter.post('/test', async (req, res) => {
  const tokenCount = await prisma.pushToken.count({ where: { userId: req.user!.id } });
  if (tokenCount === 0) {
    return res.status(400).json({ error: 'No push tokens registered. Open the app on a device to register.' });
  }

  await notifyUser(
    req.user!.id,
    '🔔 Test Notification',
    'Push notifications are working! You\'ll receive alerts for order updates.',
    { screen: 'Profile' }
  );

  res.json({ ok: true, message: `Test notification sent to ${tokenCount} device(s).` });
});
