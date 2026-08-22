import { Router } from 'express';
import { z } from 'zod';
import { prisma, requireAuth, requireRole } from '../auth';
import { awardOrderPoints } from './loyalty';
import { notifyOrderStatusChange, notifyNewOrder } from '../notifications';
import { calculateTax, calculateDeliveryFee, calculateDistance } from '../tax';
import { getIo } from '../socket';

export const ordersRouter = Router();

/** GET /orders — customers see their own; merchants see their shop's queue. */
ordersRouter.get('/', requireAuth, async (req, res) => {
  if (req.user!.role === 'merchant') {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
    if (!merchant) return res.json([]);
    const scheduled = req.query.scheduled as string | undefined;
    const where: any = { merchantId: merchant.id };
    if (scheduled === 'true') where.scheduledFor = { not: null };
    else if (scheduled === 'false') where.scheduledFor = null;
    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: { select: { imageUrl: true, imageColor: true } } } }, merchant: { select: { businessName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders.map((o) => ({
      ...o,
      merchantName: o.merchant?.businessName ?? '',
      items: o.items.map((item) => ({
        ...item,
        imageUrl: item.product?.imageUrl,
        imageColor: item.product?.imageColor,
      })),
    })));
  }
  const orders = await prisma.order.findMany({
    where: { customerId: req.user!.id },
    include: { items: { include: { product: { select: { imageUrl: true, imageColor: true } } } }, merchant: { select: { businessName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders.map((o) => ({
    ...o,
    merchantName: o.merchant?.businessName ?? '',
    items: o.items.map((item) => ({
      ...item,
      imageUrl: item.product?.imageUrl,
      imageColor: item.product?.imageColor,
    })),
  })));
});

const createInput = z.object({
  merchantId: z.string(),
  deliveryAddress: z.string().min(6),
  notes: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      weightLabel: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

/** POST /orders — totals recomputed server-side from current prices. Pay-on-delivery only. */
ordersRouter.post('/', requireAuth, requireRole('customer'), async (req, res) => {
  const parsed = createInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid order payload.' });

  const merchant = await prisma.merchant.findUnique({ where: { id: parsed.data.merchantId } });
  if (!merchant || merchant.status !== 'approved') {
    return res.status(400).json({ error: 'This dispensary is not currently accepting orders.' });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: parsed.data.items.map((i) => i.productId) }, merchantId: merchant.id },
  });

  let subtotal = 0;
  const items = parsed.data.items.map((i) => {
    const product = products.find((p) => p.id === i.productId);
    if (!product) throw Object.assign(new Error('A product in your cart is unavailable.'), { status: 400 });
    const tiers = product.weightOptions as { label: string; price: number }[];
    const tier = tiers.find((t) => t.label === i.weightLabel) ?? { price: product.price };
    subtotal += tier.price * i.quantity;
    return { productId: product.id, quantity: i.quantity, weightLabel: i.weightLabel, priceAtPurchase: tier.price };
  });

  // Calculate tax based on merchant's state
  const tax = calculateTax(subtotal, merchant.stateCode);

  // Calculate delivery fee based on distance
  // Customer location would come from request in production; for now use merchant coords as fallback
  const customerLat = req.body.customerLat ?? merchant.lat;
  const customerLng = req.body.customerLng ?? merchant.lng;
  const distance = calculateDistance(merchant.lat, merchant.lng, customerLat, customerLng);
  const deliveryFee = calculateDeliveryFee(distance, subtotal);

  const order = await prisma.order.create({
    data: {
      customerId: req.user!.id,
      merchantId: merchant.id,
      deliveryAddress: parsed.data.deliveryAddress,
      notes: parsed.data.notes,
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : undefined,
      subtotal,
      tax,
      deliveryFee,
      total: subtotal + tax + deliveryFee,
      paymentMethod: 'pay_on_delivery',
      items: { create: items },
    },
    include: { items: true },
  });

  // Notify merchant of new order (fire-and-forget)
  notifyNewOrder(merchant.userId, order.id, req.user!.id, order.total).catch(() => {});

  res.status(201).json({ ...order, merchantName: merchant.businessName });
});

/** PATCH /orders/:id/status — merchant advances the fulfillment state machine. */
const VALID_TRANSITIONS: Record<string, string[]> = {
  placed: ['confirmed', 'rejected'],
  confirmed: ['ready_for_pickup', 'rejected'],
  ready_for_pickup: ['rider_assigned', 'rejected'],
  rider_assigned: ['picked_up'],
  picked_up: ['out_for_delivery'],
  out_for_delivery: ['arrived'],
  arrived: ['delivered'],
  delivered: [],
  rejected: [],
};

// Status labels for notifications
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Order Confirmed',
  ready_for_pickup: 'Ready for Pickup',
  rider_assigned: 'Rider Assigned',
  picked_up: 'Order Picked Up',
  out_for_delivery: 'Out for Delivery',
  arrived: 'Rider Has Arrived',
  delivered: 'Order Delivered',
  rejected: 'Order Rejected',
};

ordersRouter.patch('/:id/status', requireAuth, requireRole('merchant'), async (req, res) => {
  const { status } = req.body as { status?: string };
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
  if (!order || !merchant || order.merchantId !== merchant.id) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  if (!status || !VALID_TRANSITIONS[order.status]?.includes(status)) {
    return res.status(400).json({ error: `Cannot move order from ${order.status} to ${status}.` });
  }

  // When order is ready for pickup, auto-assign nearest rider
  let riderId = order.riderId;
  if (status === 'ready_for_pickup' && !riderId) {
    riderId = await assignNearestRider(merchant.lat, merchant.lng);
    if (!riderId) {
      // No riders available — keep in ready_for_pickup, customer will be notified of delay
      console.log(`[Orders] No riders available for order ${order.id}`);
    }
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: status as any,
      ...(riderId && riderId !== order.riderId ? { riderId } : {}),
    },
    include: { rider: { include: { user: { select: { email: true } } } } },
  });

  // Award loyalty points when order is delivered
  if (status === 'delivered') {
    await awardOrderPoints(order.id, order.customerId, order.total);
  }

  // Send push notification to customer (fire-and-forget)
  notifyOrderStatusChange(order.id, order.customerId, status, merchant.businessName).catch(() => {});

  // Emit Socket.io event for real-time tracking
  const io = getIo();
  if (io) {
    io.to(`order:${order.id}`).emit('order:status', {
      orderId: order.id,
      status,
      label: STATUS_LABELS[status] ?? status,
    });

    // When rider is assigned, also emit rider info
    if (status === 'rider_assigned' && updated.rider) {
      io.to(`order:${order.id}`).emit('rider:assigned', {
        orderId: order.id,
        rider: {
          id: updated.rider.id,
          lat: updated.rider.lat,
          lng: updated.rider.lng,
          vehicleType: updated.rider.vehicleType,
          rating: updated.rider.rating,
        },
      });
    }
  }

  res.json({ ...updated, merchantName: merchant.businessName });
});

/**
 * Auto-assign the nearest online rider to an order.
 * Returns riderId or null if no riders available.
 */
async function assignNearestRider(merchantLat: number, merchantLng: number): Promise<string | null> {
  // Find online riders, sorted by proximity to merchant
  const onlineRiders = await prisma.rider.findMany({
    where: { isOnline: true, lat: { not: null }, lng: { not: null } },
    orderBy: { rating: 'desc' }, // prefer higher-rated riders
  });

  if (onlineRiders.length === 0) return null;

  // Calculate distance to each rider and sort by proximity
  const ridersWithDistance = onlineRiders
    .map((rider) => ({
      ...rider,
      distance: calculateDistance(merchantLat, merchantLng, rider.lat!, rider.lng!),
    }))
    .sort((a, b) => a.distance - b.distance);

  // Return nearest rider (within 10km)
  const nearest = ridersWithDistance[0];
  if (nearest.distance > 10) return null; // too far
  return nearest.id;
}
