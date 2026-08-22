import 'dotenv/config';
import http from 'http';
import jwt from 'jsonwebtoken';
import { app } from './app';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { setIo } from './socket';
import { prisma } from './auth';

const port = Number(process.env.PORT ?? 4000);
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// ── Socket.io Authentication Middleware ───────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret';

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token || typeof token !== 'string') {
    return next(new Error('Authentication required'));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    socket.data.userId = payload.id;
    socket.data.userRole = payload.role;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// ── Socket.io Connection Handler ──────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id} (user: ${socket.data.userId})`);

  // Clients join a room for a specific order to receive rider updates
  socket.on('join:order', async (orderId: string) => {
    // Verify user is authorized for this order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, merchantId: true },
    });

    if (!order) {
      socket.emit('error', { message: 'Order not found' });
      return;
    }

    const userRole = socket.data.userRole;
    const userId = socket.data.userId;

    // Customers can only track their own orders
    if (userRole === 'customer' && order.customerId !== userId) {
      socket.emit('error', { message: 'Not authorized for this order' });
      return;
    }

    // Merchants can only track orders for their shop
    if (userRole === 'merchant') {
      const merchant = await prisma.merchant.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!merchant || order.merchantId !== merchant.id) {
        socket.emit('error', { message: 'Not authorized for this order' });
        return;
      }
    }

    // Admins can track any order
    socket.join(`order:${orderId}`);
    console.log(`[Socket] ${socket.id} joined order:${orderId}`);
  });

  socket.on('leave:order', (orderId: string) => {
    socket.leave(`order:${orderId}`);
  });

  // Riders join a room for dispatch notifications
  socket.on('join:dispatch', async (riderId: string) => {
    // Verify user is the rider
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      select: { userId: true },
    });

    if (!rider || rider.userId !== socket.data.userId) {
      socket.emit('error', { message: 'Not authorized for this dispatch channel' });
      return;
    }

    socket.join(`dispatch:${riderId}`);
    console.log(`[Socket] ${socket.id} joined dispatch:${riderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`Elixir & Stem API + WebSocket listening on :${port}`);
});

export { app };
