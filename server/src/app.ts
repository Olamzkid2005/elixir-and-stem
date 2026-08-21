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

const app = express();
app.use(cors());
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

// Central error handler — routes throw { status, message } style errors.
app.use(
  (err: { status?: number; message?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status ?? 500;
    res.status(status).json({ error: err.message ?? 'Internal server error' });
  }
);

export { app };
