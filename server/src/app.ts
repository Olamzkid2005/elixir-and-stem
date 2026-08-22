import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { merchantsRouter } from './routes/merchants';
import { productsRouter } from './routes/products';
import { ordersRouter } from './routes/orders';
import { adminRouter } from './routes/admin';
import { favoritesRouter } from './routes/favorites';
import { reviewsRouter } from './routes/reviews';
import { loyaltyRouter } from './routes/loyalty';
import { pushTokensRouter } from './routes/pushTokens';
import { uploadRouter } from './routes/upload';
import { ridersRouter } from './routes/riders';

// ── Fail fast if JWT_SECRET is missing in production ──────────────────
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET must be set in production');
  process.exit(1);
}

const app = express();

// ── CORS — restrict to known origins in production ────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:8081', 'http://localhost:19006']; // Expo defaults

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/merchants', merchantsRouter);
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);
app.use('/admin', adminRouter);
app.use('/favorites', favoritesRouter);
app.use('/reviews', reviewsRouter);
app.use('/loyalty', loyaltyRouter);
app.use('/push-tokens', pushTokensRouter);
app.use('/upload', uploadRouter);
app.use('/riders', ridersRouter);

// Central error handler — logs 500s, returns structured error
app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status ?? 500;
    if (status >= 500) {
      console.error(`[Error] ${status}:`, err.message, err.stack);
    }
    res.status(status).json({ error: err.message ?? 'Internal server error' });
  }
);

export { app };
