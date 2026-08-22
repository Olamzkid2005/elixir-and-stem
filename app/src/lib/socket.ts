import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

let socket: Socket | null = null;

/**
 * Get or create a Socket.io connection to the backend.
 * In Expo Go, falls back gracefully (no real-time updates).
 */
export function getSocket(): Socket | null {
  // Skip in Expo Go — socket connections can be unreliable
  if (Constants.executionEnvironment === 'storeClient') {
    return null;
  }

  if (socket?.connected) return socket;

  // Determine backend URL
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const baseUrl = apiUrl
    ? apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')
    : Platform.OS === 'android'
      ? 'http://10.0.2.2:4000'
      : 'http://localhost:4000';

  socket = io(baseUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.log('[Socket] Connection error:', err.message);
  });

  socket.connect();

  return socket;
}

/**
 * Disconnect the socket cleanly.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Subscribe to rider location updates for a specific order.
 * Returns an unsubscribe function.
 */
export function subscribeToOrder(
  orderId: string,
  callbacks: {
    onStatus?: (data: { orderId: string; status: string; label: string }) => void;
    onRiderAssigned?: (data: { orderId: string; rider: any }) => void;
    onRiderLocation?: (data: { riderId: string; lat: number; lng: number; vehicleType: string; rating: number }) => void;
  }
): () => void {
  const s = getSocket();
  if (!s) return () => {};

  s.emit('join:order', orderId);

  if (callbacks.onStatus) s.on('order:status', callbacks.onStatus);
  if (callbacks.onRiderAssigned) s.on('rider:assigned', callbacks.onRiderAssigned);
  if (callbacks.onRiderLocation) s.on('rider:location', callbacks.onRiderLocation);

  return () => {
    s.emit('leave:order', orderId);
    if (callbacks.onStatus) s.off('order:status', callbacks.onStatus);
    if (callbacks.onRiderAssigned) s.off('rider:assigned', callbacks.onRiderAssigned);
    if (callbacks.onRiderLocation) s.off('rider:location', callbacks.onRiderLocation);
  };
}
