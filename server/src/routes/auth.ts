import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma, signToken } from '../auth';

export const authRouter = Router();

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['customer', 'merchant']),
  phone: z.string().optional(),
});

/** POST /auth/signup — age verification is asserted client-side (21+ click-through),
 *  persisted here as a flag for audit. Merchants additionally register via /merchants. */
authRouter.post('/signup', async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email or password (min 8 chars).' });
  const { email, password, role, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const user = await prisma.user.create({
    data: {
      email,
      phone,
      role,
      ageVerified: true, // click-through gate completed before signup
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  res.json({ token: signToken({ id: user.id, role: user.role }), user: sanitize(user) });
});

authRouter.post('/signin', async (req, res) => {
  const parsed = credentials.partial({ role: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials.' });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  if (user.suspended) return res.status(403).json({ error: 'Account suspended.' });

  res.json({ token: signToken({ id: user.id, role: user.role }), user: sanitize(user) });
});

// ── OAuth (Google / Apple) ──────────────────────────────────────────────

const oauthInput = z.object({
  provider: z.enum(['google', 'apple']),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['customer', 'merchant']).default('customer'),
});

/**
 * POST /auth/oauth — sign in or sign up via Google/Apple.
 * The client handles the OAuth flow and sends us the verified user info.
 * We create or find the user and return a JWT.
 */
authRouter.post('/oauth', async (req, res) => {
  const parsed = oauthInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid OAuth payload.' });

  const { provider, email, name, role } = parsed.data;

  // Find or create user
  let isNewUser = false;
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Existing user — just sign in
    if (user.suspended) return res.status(403).json({ error: 'Account suspended.' });
  } else {
    // New user — create account via OAuth
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        email,
        role,
        ageVerified: true,
        // OAuth users don't need a password — generate a random hash
        passwordHash: await bcrypt.hash(`oauth-${Date.now()}-${Math.random()}`, 10),
      },
    });
  }

  res.json({
    token: signToken({ id: user.id, role: user.role }),
    user: sanitize(user),
    isNewUser,
  });
});

function sanitize(u: { id: string; email: string; phone: string | null; role: string; ageVerified: boolean }) {
  return { id: u.id, email: u.email, phone: u.phone, role: u.role, ageVerified: u.ageVerified };
}
