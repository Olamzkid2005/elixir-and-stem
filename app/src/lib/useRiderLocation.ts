import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
import { subscribeToOrder, getSocket } from '@/lib/socket';

interface RiderLocation {
  id: string;
  lat: number | null;
  lng: number | null;
  isOnline: boolean;
  vehicleType: string | null;
  rating: number;
}

/**
 * Track a rider's location for an order.
 *
 * Uses Socket.io when available (dev build), falls back to polling in Expo Go.
 * - Socket mode: receives real-time `rider:location` events
 * - Polling mode: fetches every 5 seconds as fallback
 */
export function useRiderLocation(
  orderId: string,
  riderId?: string | null,
  shouldTrack = false
) {
  const [rider, setRider] = useState<RiderLocation | null>(null);
  const socketRef = useRef<(() => void) | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!shouldTrack || !orderId) {
      setRider(null);
      return;
    }

    const socket = getSocket();

    if (socket) {
      // ── Socket.io mode: real-time updates ──
      const unsub = subscribeToOrder(orderId, {
        onRiderAssigned: (data) => {
          if (data.rider) {
            setRider((prev) => ({
              ...(prev ?? { id: data.rider.id, isOnline: true, vehicleType: 'motorcycle', rating: 5.0 }),
              ...data.rider,
            }));
          }
        },
        onRiderLocation: (data) => {
          setRider((prev) => ({
            id: data.riderId,
            lat: data.lat,
            lng: data.lng,
            isOnline: true,
            vehicleType: data.vehicleType ?? prev?.vehicleType ?? 'motorcycle',
            rating: data.rating ?? prev?.rating ?? 5.0,
          }));
        },
      });
      socketRef.current = unsub;

      // Also do an initial fetch in case rider is already assigned
      if (riderId) {
        api.getRiderLocation(riderId).then(setRider).catch(() => {});
      }
    } else {
      // ── Polling fallback (Expo Go) ──
      const fetchLocation = () => {
        if (riderId) {
          api.getRiderLocation(riderId).then(setRider).catch(() => {});
        }
      };

      fetchLocation(); // immediate
      pollingRef.current = setInterval(fetchLocation, 5000);
    }

    return () => {
      socketRef.current?.();
      socketRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [orderId, riderId, shouldTrack]);

  return { rider };
}
