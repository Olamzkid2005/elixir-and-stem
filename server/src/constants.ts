/**
 * Shared constants across backend routes.
 * Avoids duplication of STATUS_LABELS between notifications.ts and orders.ts.
 */

export const STATUS_LABELS: Record<string, string> = {
  placed: 'Order Received',
  confirmed: 'Order Confirmed',
  ready_for_pickup: 'Ready for Pickup',
  rider_assigned: 'Rider Assigned',
  picked_up: 'Order Picked Up',
  out_for_delivery: 'Out for Delivery',
  arrived: 'Rider Has Arrived',
  delivered: 'Order Delivered',
  rejected: 'Order Rejected',
};

export const STATUS_MESSAGES: Record<string, string> = {
  placed: 'Your order has been received and is being reviewed.',
  confirmed: 'Your order is being prepared by the dispensary.',
  ready_for_pickup: 'Your order is ready for rider pickup.',
  rider_assigned: 'A rider has been assigned to your order.',
  picked_up: 'Your order has been picked up by the rider.',
  out_for_delivery: 'Your order is on its way to you!',
  arrived: 'Your rider has arrived at your location.',
  delivered: 'Your order has been delivered. Enjoy!',
  rejected: 'Your order could not be fulfilled. Please contact support.',
};

/** Nigeria bounds for coordinate validation */
export const NIGERIA_BOUNDS = {
  lat: { min: 4, max: 14 },
  lng: { min: 3, max: 15 },
} as const;
