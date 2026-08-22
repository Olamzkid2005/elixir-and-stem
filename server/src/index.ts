import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { Server as SocketIOServer } from 'socket.io';
import { setIo } from './socket';

const port = Number(process.env.PORT ?? 4000);
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] },
});

// Make io available to routes via shared module
setIo(io);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Clients join a room for a specific order to receive rider updates
  socket.on('join:order', (orderId: string) => {
    socket.join(`order:${orderId}`);
    console.log(`[Socket] ${socket.id} joined order:${orderId}`);
  });

  socket.on('leave:order', (orderId: string) => {
    socket.leave(`order:${orderId}`);
  });

  // Riders join a room for dispatch notifications
  socket.on('join:dispatch', (riderId: string) => {
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
