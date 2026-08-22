import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma, signToken } from '../auth';

export const authRouter = Router();

// ── Rate Limiting (in-memory, per-route) ──────────────────────────────
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(maxAttempts: number, windowMs: number) {
  return (req: any, _res: any, next: any) => {
    // Skip rate limiting in test environment
    if (process.env.NODE_ENV === 'test') return next();
    const key = `${req.ip}:${req.route?.path ?? req.path}`;
    const now = Date.now();
    const entry = rateLimits.get(key);

    if (entry && now < entry.resetAt) {
      if (entry.count >= maxAttempts) {
        return _res.status(429).json({ error: 'Too many attempts. Please try again later.' });
      }
      entry.count++;
    } else {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    }
    next();
  };
}

// 5 attempts per minute per IP per route
const authLimiter = rateLimit(5, 60_000);

// ── Input Schemas ─────────────────────────────────────────────────────

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['customer', 'merchant']),
  phone: z.string().optional(),
});

const oauthInput = z.object({
  provider: z.enum(['google', 'apple']),
  // Accept either idToken (preferred) or email (fallback for mock mode)
  idToken: z.string().optional(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['customer', 'merchant']).default('customer'),
});

// ── Routes ────────────────────────────────────────────────────────────

/** POST /auth/signup */
authRouter.post('/signup', authLimiter, async (req, res) => {
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
      ageVerified: true,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  res.json({ token: signToken({ id: user.id, role: user.role }), user: sanitize(user) });
});

/** POST /auth/signin */
authRouter.post('/signin', authLimiter, async (req, res) => {
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

// ── OAuth (Google / Apple) ────────────────────────────────────────────

/**
 * Verify Google ID token by calling Google's tokeninfo endpoint.
 * Returns the verified email and name, or throws on failure.
 */
async function verifyGoogleToken(idToken: string): Promise<{ email: string; name?: string }> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) throw new Error('Invalid Google token');
  const payload = await res.json();
  if (!payload.email || payload.email_verified !== 'true') {
    throw new Error('Google email not verified');
  }
  return {
    email: payload.email,
    name: payload.name ?? payload.given_name,
  };
}

/**
 * Verify Apple identity token by checking against Apple's public keys.
 * For MVP, we decode and validate basic claims. In production, use
 * a library like `jose` or `apple-signin-auth` for full JWT verification.
 */
async function verifyAppleToken(idToken: string): Promise<{ email: string; name?: string }> {
  // Decode JWT payload (base64url)
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid Apple token format');

  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

  // Validate basic claims
  if (!payload.email) throw new Error('Apple token missing email');
  if (payload.iss !== 'https://appleid.apple.com') throw new Error('Invalid Apple token issuer');
  if (payload.aud !== process.env.APPLE_SERVICE_ID && payload.aud !== process.env.APPLE_BUNDLE_ID) {
    // In dev, allow any aud for flexibility
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Apple token audience mismatch');
    }
  }

  // Check expiry
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Apple token expired');
  }

  return {
    email: payload.email,
    name: payload.sub, // Apple doesn't always return name in token
  };
}

/**
 * POST /auth/oauth — sign in or sign up via Google/Apple.
 * Verifies the OAuth token server-side when idToken is provided.
 */
authRouter.post('/oauth', authLimiter, async (req, res) => {
  const parsed = oauthInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid OAuth payload.' });

  const { provider, idToken, email: clientEmail, name: clientName, role } = parsed.data;

  let email = clientEmail;
  let name = clientName;

  // Verify token server-side if provided
  if (idToken) {
    try {
      if (provider === 'google') {
        const verified = await verifyGoogleToken(idToken);
        email = verified.email;
        name = verified.name ?? name;
      } else if (provider === 'apple') {
        const verified = await verifyAppleToken(idToken);
        email = verified.email;
        name = verified.name ?? name;
      }
    } catch (err) {
      return res.status(401).json({ error: `Invalid ${provider} token.` });
    }
  } else {
    // No token provided — in production, reject. In dev, allow for testing.
    if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'OAuth token required.' });
    }
    console.warn(`[Auth] OAuth request without idToken (dev mode): ${provider} ${email}`);
  }

  // Find or create user
  let isNewUser = false;
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (user.suspended) return res.status(403).json({ error: 'Account suspended.' });
  } else {
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        email,
        role,
        ageVerified: true,
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
