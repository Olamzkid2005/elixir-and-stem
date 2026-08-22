import { prisma } from './auth';
import { STATUS_LABELS, STATUS_MESSAGES } from './constants';

const EXPO_API_URL = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
}

/**
 * Send a push notification to one or more Expo push tokens.
 * Uses Expo's push API: https://docs.expo.dev/push-notifications/sending-notifications/
 */
async function sendPushNotifications(payloads: PushPayload[]): Promise<void> {
  if (payloads.length === 0) return;

  // Chunk into batches of 100 (Expo limit)
  const chunks: PushPayload[][] = [];
  for (let i = 0; i < payloads.length; i += 100) {
    chunks.push(payloads.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const res = await fetch(EXPO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('[Push] Expo API error:', res.status, text);
      }
    } catch (err) {
      console.error('[Push] Failed to send notifications:', err);
    }
  }
}

/**
 * Send push notification to a customer when their order status changes.
 */
export async function notifyOrderStatusChange(
  orderId: string,
  customerId: string,
  newStatus: string,
  merchantName?: string
): Promise<void> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId: customerId },
    select: { token: true },
  });

  if (tokens.length === 0) return;

  const title = STATUS_LABELS[newStatus] ?? 'Order Update';
  let body = STATUS_MESSAGES[newStatus] ?? `Your order #${orderId} status has been updated.`;
  if (merchantName && newStatus === 'confirmed') {
    body = `${merchantName} is preparing your order.`;
  }

  const payloads: PushPayload[] = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data: { orderId, status: newStatus, screen: 'OrderTracking' },
    sound: 'default',
  }));

  await sendPushNotifications(payloads);
}

/**
 * Send push notification to a merchant when a new order is placed.
 */
export async function notifyNewOrder(
  merchantUserId: string,
  orderId: string,
  customerName: string,
  totalCents: number
): Promise<void> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId: merchantUserId },
    select: { token: true },
  });

  if (tokens.length === 0) return;

  const total = `₦${(totalCents / 100).toFixed(0)}`;
  const payloads: PushPayload[] = tokens.map((t) => ({
    to: t.token,
    title: 'New Order',
    body: `New order from ${customerName} — ${total}`,
    data: { orderId, screen: 'OrderQueue' },
    sound: 'default',
  }));

  await sendPushNotifications(payloads);
}

/**
 * Send a generic push notification to a user.
 */
export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId },
    select: { token: true },
  });

  if (tokens.length === 0) return;

  const payloads: PushPayload[] = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data: data ?? {},
    sound: 'default',
  }));

  await sendPushNotifications(payloads);
}
