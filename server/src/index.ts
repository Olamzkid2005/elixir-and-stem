import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { merchantsRouter } from './routes/merchants';
import { productsRouter } from './routes/products';
import { ordersRouter } from './routes/orders';
import { adminRouter } from './routes/admin';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/merchants', merchantsRouter);
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);
app.use('/admin', adminRouter);

// Central error handler — routes throw { status, message } style errors.
app.use(
  (err: { status?: number; message?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status ?? 500;
    res.status(status).json({ error: err.message ?? 'Internal server error' });
  }
);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Elixir & Stem API listening on :${port}`);
});
