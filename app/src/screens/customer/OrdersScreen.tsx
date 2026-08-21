import React, { useEffect } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useOrders } from '@/store/orders';
import { useCart } from '@/store/cart';
import { formatPrice, type OrderStatus } from '@/api/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'gold' | 'error'> = {
  placed: 'gold',
  confirmed: 'secondary',
  ready_for_pickup: 'secondary',
  rider_assigned: 'default',
  picked_up: 'default',
  out_for_delivery: 'default',
  arrived: 'gold',
  delivered: 'secondary',
  rejected: 'error',
};

const statusLabel: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  ready_for_pickup: 'Preparing',
  rider_assigned: 'Rider Assigned',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  arrived: 'Rider Arrived',
  delivered: 'Delivered',
  rejected: 'Rejected',
};

/** Orders tab — active + past orders with reorder functionality. */
export function OrdersScreen() {
  const navigation = useNavigation<Nav>();
  const { orders, activeOrder, refresh, loading } = useOrders();
  const reorderFromOrder = useCart((s) => s.reorderFromOrder);

  useEffect(() => {
    refresh();
  }, []);

  const all = activeOrder ? [activeOrder, ...orders.filter((o) => o.id !== activeOrder.id)] : orders;

  const handleReorder = (order: typeof all[0]) => {
    if (order.status !== 'delivered') return;
    const { added, unavailable } = reorderFromOrder(order);
    if (unavailable.length > 0) {
      Alert.alert(
        'Some items unavailable',
        `Added ${added} item${added === 1 ? '' : 's'} to cart.\n\nUnavailable:\n${unavailable.join('\n')}`,
        [
          { text: 'View Cart', onPress: () => navigation.navigate('CustomerTabs', { screen: 'Cart' }) },
          { text: 'OK' },
        ]
      );
    } else if (added > 0) {
      Alert.alert('Added to cart', `${added} item${added === 1 ? '' : 's'} added from your past order.`, [
        { text: 'View Cart', onPress: () => navigation.navigate('CustomerTabs', { screen: 'Cart' }) },
        { text: 'Continue Shopping' },
      ]);
    }
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Headline className="mt-2">Your Orders</Headline>
        {loading && (
          <Text className="mt-4 font-body text-sm text-on-surface-variant">Refreshing…</Text>
        )}
        {!loading && all.length === 0 && (
          <View className="mt-6 items-center rounded-2xl bg-surface-container-lowest py-12">
            <Icon name="receipt_long" size={40} color="#c3c8c1" />
            <Text className="mt-3 font-body text-sm text-on-surface-variant">
              No orders yet — your history will appear here.
            </Text>
          </View>
        )}
        <View className="mt-4 pb-8">
          {all.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => navigation.navigate('OrderTracking', { orderId: o.id })}
              className="mb-3 rounded-2xl bg-surface-container-lowest p-4 active:bg-surface-container"
            >
              <View className="flex-row items-center gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                  <Icon name="receipt_long" size={22} color="#4d644b" />
                </View>
                <View className="flex-1">
                  <Text className="font-body-semibold text-base text-on-surface">
                    Order #{o.id}
                  </Text>
                  <Text className="font-body text-xs text-on-surface-variant">
                    {new Date(o.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    • {o.merchantName}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="font-body-semibold text-base text-on-surface">
                    {formatPrice(o.total)}
                  </Text>
                  <Badge variant={statusVariant[o.status]} label={statusLabel[o.status]} />
                </View>
              </View>

              {/* Reorder button — only on delivered orders */}
              {o.status === 'delivered' && (
                <View className="mt-3 flex-row items-center gap-2 border-t border-outline-variant pt-3">
                  <Button
                    label="Reorder"
                    icon="replay"
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onPress={() => handleReorder(o)}
                  />
                </View>
              )}

              {/* Scheduled indicator */}
              {o.scheduledFor && (
                <View className="mt-2 flex-row items-center gap-1.5">
                  <Icon name="calendar_today" size={13} color="#737973" />
                  <Text className="font-body text-xs text-on-surface-variant">
                    Scheduled: {new Date(o.scheduledFor).toLocaleString()}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
