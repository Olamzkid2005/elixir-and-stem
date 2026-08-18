import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useOrders } from '@/store/orders';
import { formatPrice, type OrderStatus } from '@/api/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'gold' | 'error'> = {
  placed: 'gold',
  confirmed: 'secondary',
  out_for_delivery: 'default',
  delivered: 'secondary',
  rejected: 'error',
};

const statusLabel: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  rejected: 'Rejected',
};

/** Orders tab — active + past orders. */
export function OrdersScreen() {
  const navigation = useNavigation<Nav>();
  const { orders, activeOrder, refresh, loading } = useOrders();

  useEffect(() => {
    refresh();
  }, []);

  const all = activeOrder ? [activeOrder, ...orders.filter((o) => o.id !== activeOrder.id)] : orders;

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
              className="mb-3 flex-row items-center gap-4 rounded-2xl bg-surface-container-lowest p-4 active:bg-surface-container"
            >
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
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
