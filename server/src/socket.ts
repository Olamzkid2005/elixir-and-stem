import { Server as SocketIOServer } from 'socket.io';

/**
 * Shared Socket.io instance — initialized in server/src/index.ts, imported by routes.
 * This avoids circular require between routes and index.ts.
 */
let io: SocketIOServer | null = null;

export function setIo(instance: SocketIOServer) {
  io = instance;
}

export function getIo(): SocketIOServer | null {
  return io;
}
