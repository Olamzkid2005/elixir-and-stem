import { useEffect, useState, useRef } from 'react';
import { api } from '@/api/client';

interface RiderLocation {
  id: string;
  lat: number | null;
  lng: number | null;
  isOnline: boolean;
  vehicleType: string | null;
  rating: number;
}

const POLL_INTERVAL = 5000; // 5 seconds

/**
 * Polls rider location for an order.
 * Returns rider location and loading state.
 * Only polls when order status is rider_assigned, picked_up, or out_for_delivery.
 */
export function useRiderLocation(
  orderId: string | undefined,
  riderId: string | undefined,
  shouldTrack: boolean
) {
  const [rider, setRider] = useState<RiderLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clean up previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!shouldTrack || !riderId) {
      setRider(null);
      return;
    }

    // Initial fetch
    const fetchLocation = async () => {
      try {
        const location = await api.getRiderLocation(riderId);
        setRider(location);
      } catch (err) {
        console.error('[RiderLocation] Failed to fetch:', err);
      }
    };

    fetchLocation();

    // Start polling
    intervalRef.current = setInterval(fetchLocation, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [orderId, riderId, shouldTrack]);

  return { rider, loading };
}
