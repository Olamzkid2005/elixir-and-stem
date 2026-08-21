import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import { formatPrice, type Order, type OrderStatus } from '@/api/types';

type QueueOrder = Order & { customerName: string };

/** Incoming orders for this merchant (seed queue for the demo). */
const initialQueue: QueueOrder[] = [
  {
    id: 'ES-49205',
    customerId: 'u-c9',
    customerName: 'A. Martinez',
    merchantId: 'm1',
    merchantName: 'Elixir & Stem Downtown',
    status: 'placed',
    paymentMethod: 'pay_on_delivery',
    deliveryAddress: '500 S Grand Ave, Los Angeles, CA',
    items: [
      { productId: 'p1', name: 'Blue Dream', weightLabel: '3.5g', quantity: 1, priceAtPurchase: 4500 },
      { productId: 'p7', name: 'Soothe Confections', weightLabel: '20 pack', quantity: 1, priceAtPurchase: 3500 },
    ],
    subtotal: 8000,
    tax: 760,
    deliveryFee: 500,
    total: 9260,
    createdAt: new Date().toISOString(),
    timeline: [],
  },
  {
    id: 'ES-49203',
    customerId: 'u-c7',
    customerName: 'J. Okafor',
    merchantId: 'm1',
    merchantName: 'Elixir & Stem Downtown',
    status: 'confirmed',
    paymentMethod: 'pay_on_delivery',
    deliveryAddress: '727 W 7th St, Los Angeles, CA',
    items: [
      { productId: 'p4', name: 'Wedding Cake', weightLabel: '7g', quantity: 1, priceAtPurchase: 10500 },
    ],
    subtotal: 10500,
    tax: 998,
    deliveryFee: 500,
    total: 11998,
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    timeline: [],
  },
  {
    id: 'ES-49201',
    customerId: 'u-c3',
    customerName: 'R. Chen',
    merchantId: 'm1',
    merchantName: 'Elixir & Stem Downtown',
    status: 'out_for_delivery',
    paymentMethod: 'pay_on_delivery',
    deliveryAddress: '300 E 2nd St, Los Angeles, CA',
    items: [
      { productId: 'p6', name: 'Clarity Drops', weightLabel: '30ml', quantity: 2, priceAtPurchase: 8500 },
    ],
    subtotal: 17000,
    tax: 1615,
    deliveryFee: 500,
    total: 19115,
    createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    timeline: [],
  },
  // Scheduled order
  {
    id: 'ES-49210',
    customerId: 'u-c5',
    customerName: 'L. Kim',
    merchantId: 'm1',
    merchantName: 'Elixir & Stem Downtown',
    status: 'placed',
    paymentMethod: 'pay_on_delivery',
    deliveryAddress: '1200 Wilshire Blvd, Los Angeles, CA',
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // tomorrow
    items: [
      { productId: 'p2', name: 'Granddaddy Purple', weightLabel: '3.5g', quantity: 2, priceAtPurchase: 5000 },
    ],
    subtotal: 10000,
    tax: 950,
    deliveryFee: 500,
    total: 11450,
    createdAt: new Date().toISOString(),
    timeline: [],
  },
];

const statusLabel: Record<string, string> = {
  placed: 'New',
  confirmed: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  rejected: 'Rejected',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'gold' | 'error'> = {
  placed: 'gold',
  confirmed: 'secondary',
  out_for_delivery: 'default',
  delivered: 'secondary',
  rejected: 'error',
};

type QueueTab = 'today' | 'scheduled';

/** Merchant order queue — Today/Scheduled tabs, accept/reject/advance fulfillment. */
export function OrderQueueScreen() {
  const [queue, setQueue] = useState<QueueOrder[]>(initialQueue);
  const [tab, setTab] = useState<QueueTab>('today');

  const todayOrders = queue.filter((o) => !o.scheduledFor);
  const scheduledOrders = queue.filter((o) => !!o.scheduledFor);
  const visibleOrders = tab === 'today' ? todayOrders : scheduledOrders;

  const setStatus = (id: string, status: OrderStatus) => {
    setQueue((q) => q.map((o) => (o.id === id ? { ...o, status } : o)));
    api.updateOrderStatus(id, status).catch(() => {});
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Headline className="mt-2">Order Queue</Headline>
        <Text className="mt-1 font-body text-sm text-on-surface-variant">
          New orders push here in real time once notifications are enabled.
        </Text>

        {/* Today / Scheduled tabs */}
        <View className="mt-4 flex-row rounded-full bg-surface-container p-1">
          {(['today', 'scheduled'] as QueueTab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={cn(
                'flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2.5',
                tab === t && 'bg-surface-container-lowest'
              )}
            >
              <Icon
                name={t === 'today' ? 'today' : 'calendar_today'}
                size={16}
                color={tab === t ? '#061b0e' : '#737973'}
              />
              <Text
                className={cn(
                  'font-body-semibold text-sm',
                  tab === t ? 'text-on-surface' : 'text-on-surface-variant'
                )}
              >
                {t === 'today' ? 'Today' : 'Scheduled'}
              </Text>
              {t === 'scheduled' && scheduledOrders.length > 0 && (
                <Badge variant="gold" label={`${scheduledOrders.length}`} className="px-1.5 py-0.5" />
              )}
            </Pressable>
          ))}
        </View>

        <View className="mt-4 pb-8">
          {visibleOrders.length === 0 && (
            <View className="items-center rounded-2xl bg-surface-container-lowest py-12">
              <Icon name={tab === 'today' ? 'today' : 'calendar_today'} size={40} color="#c3c8c1" />
              <Text className="mt-3 font-body text-sm text-on-surface-variant">
                {tab === 'today' ? 'No orders for today' : 'No scheduled orders'}
              </Text>
            </View>
          )}

          {visibleOrders.map((o) => (
            <View key={o.id} className="mb-3 rounded-2xl bg-surface-container-lowest p-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-body-semibold text-base text-on-surface">#{o.id}</Text>
                <View className="flex-row items-center gap-2">
                  {o.scheduledFor && (
                    <Badge variant="gold" label="Scheduled" />
                  )}
                  <Badge variant={statusVariant[o.status]} label={statusLabel[o.status]} />
                </View>
              </View>
              <Text className="mt-1 font-body text-sm text-on-surface-variant">
                {o.customerName} • {o.deliveryAddress}
              </Text>
              {o.scheduledFor && (
                <View className="mt-1 flex-row items-center gap-1">
                  <Icon name="calendar_today" size={13} color="#737973" />
                  <Text className="font-body text-xs text-secondary">
                    {new Date(o.scheduledFor).toLocaleString()}
                  </Text>
                </View>
              )}
              <View className="mt-2 gap-1">
                {o.items.map((i) => (
                  <Text key={i.productId} className="font-body text-sm text-on-surface">
                    {i.quantity}× {i.name} ({i.weightLabel})
                  </Text>
                ))}
              </View>
              <Text className="mt-2 font-body-semibold text-sm text-on-surface">
                {formatPrice(o.total)} due on delivery
              </Text>

              <View className="mt-3 flex-row gap-2">
                {o.status === 'placed' && (
                  <>
                    <Button
                      label="Accept"
                      size="sm"
                      className="flex-1"
                      onPress={() => setStatus(o.id, 'confirmed')}
                    />
                    <Button
                      label="Reject"
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onPress={() => setStatus(o.id, 'rejected')}
                    />
                  </>
                )}
                {o.status === 'confirmed' && (
                  <Button
                    label="Out for Delivery"
                    size="sm"
                    icon="local_shipping"
                    className="flex-1"
                    onPress={() => setStatus(o.id, 'out_for_delivery')}
                  />
                )}
                {o.status === 'out_for_delivery' && (
                  <Button
                    label="Mark Delivered"
                    size="sm"
                    icon="check_circle"
                    className="flex-1"
                    onPress={() => setStatus(o.id, 'delivered')}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
