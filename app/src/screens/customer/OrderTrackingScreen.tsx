import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useOrders } from '@/store/orders';
import { formatPrice, type OrderStatus } from '@/api/types';
import { cn } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderTracking'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'placed', label: 'Order Received' },
  { status: 'confirmed', label: 'Preparing Order' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Arrived' },
];

/** Order Tracking — ETA card, courier card, vertical status timeline, review CTA for delivered. */
export function OrderTrackingScreen({ route }: Props) {
  const navigation = useNavigation<Nav>();
  const { activeOrder, orders, advanceActiveStatus } = useOrders();
  const order = useMemo(() => {
    if (activeOrder && (!route.params?.orderId || activeOrder.id === route.params.orderId)) {
      return activeOrder;
    }
    return orders.find((o) => o.id === route.params?.orderId) ?? activeOrder;
  }, [activeOrder, orders, route.params?.orderId]);

  if (!order) {
    return (
      <Screen>
        <AppHeader back />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-body text-base text-on-surface-variant">
            Order not found. It may still be syncing.
          </Text>
        </View>
      </Screen>
    );
  }

  const activeIdx = STEPS.findIndex((s) => s.status === order.status);
  const isLive = order.status !== 'delivered' && order.status !== 'rejected';
  const isDelivered = order.status === 'delivered';

  return (
    <Screen>
      <AppHeader back />
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Headline>Track Your Order</Headline>
        <Text className="mt-1 font-body text-sm text-on-surface-variant">Order #{order.id}</Text>

        {/* Expected arrival */}
        {order.etaMins && isLive && (
          <View className="mt-5 flex-row items-center gap-4 rounded-2xl bg-primary p-5">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-container">
              <Icon name="schedule" size={24} color="#d0e9d4" />
            </View>
            <View>
              <Text className="font-body text-xs uppercase tracking-widest text-on-primary-container">
                Estimated Arrival
              </Text>
              <Text className="font-headline text-2xl text-on-primary">
                {order.etaMins[0]} - {order.etaMins[1]} Min
              </Text>
            </View>
          </View>
        )}

        {/* Courier */}
        {order.driver && isLive && (
          <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-surface-container-lowest p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary-container">
                <Icon name="person" size={24} color="#4d644b" />
              </View>
              <View>
                <Text className="font-body-semibold text-base text-on-surface">
                  {order.driver.name}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Icon name="star" size={13} color="#e9c176" />
                  <Text className="font-body text-xs text-on-surface-variant">
                    {order.driver.rating} Courier
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row gap-2">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                <Icon name="call" size={20} color="#1b1c19" />
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                <Icon name="chat" size={20} color="#1b1c19" />
              </View>
            </View>
          </View>
        )}

        {/* Timeline */}
        <Text className="mb-3 mt-7 font-headline text-xl text-on-surface">Order Status</Text>
        <View className="rounded-2xl bg-surface-container-lowest p-5">
          {STEPS.map((step, i) => {
            const done = i < activeIdx || order.status === 'delivered';
            const current = i === activeIdx && order.status !== 'delivered';
            return (
              <View key={step.status} className="flex-row">
                <View className="items-center">
                  <View
                    className={cn(
                      'h-8 w-8 items-center justify-center rounded-full',
                      done
                        ? 'bg-primary'
                        : current
                          ? 'border-2 border-primary bg-surface-container-lowest'
                          : 'bg-surface-container-highest'
                    )}
                  >
                    {done ? (
                      <Icon name="check" size={16} color="#ffffff" />
                    ) : current ? (
                      <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                    ) : null}
                  </View>
                  {i < STEPS.length - 1 && (
                    <View
                      className={cn(
                        'my-1 w-0.5 flex-1',
                        i < activeIdx ? 'bg-primary' : 'bg-surface-container-highest'
                      )}
                      style={{ minHeight: 32 }}
                    />
                  )}
                </View>
                <View className="ml-4 flex-1 pb-6">
                  <Text
                    className={cn(
                      'font-body-semibold text-base',
                      done || current ? 'text-on-surface' : 'text-on-surface-variant'
                    )}
                  >
                    {step.label}
                  </Text>
                  <Text className="font-body text-xs text-on-surface-variant">
                    {step.status === 'placed' && '2:14 PM'}
                    {step.status === 'confirmed' && `2:20 PM - ${order.merchantName}`}
                    {step.status === 'out_for_delivery' && current && 'Driver is approaching your location.'}
                    {step.status === 'delivered' && current && 'Delivered — enjoy!'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Review CTA for delivered orders */}
        {isDelivered && order.items.length > 0 && (
          <>
            <Text className="mb-3 mt-7 font-headline text-xl text-on-surface">Leave a Review</Text>
            <Text className="mb-4 font-body text-sm text-on-surface-variant">
              Share your experience to help other customers.
            </Text>
            {order.items.map((item) => (
              <View
                key={item.productId}
                className="mb-3 flex-row items-center gap-3 rounded-2xl bg-surface-container-lowest p-4"
              >
                <View className="flex-1">
                  <Text className="font-body-semibold text-base text-on-surface">{item.name}</Text>
                  <Text className="font-body text-xs text-on-surface-variant">
                    {item.weightLabel} • {formatPrice(item.priceAtPurchase)}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    navigation.navigate('WriteReview', {
                      orderItemId: item.id ?? '',
                      productName: item.name,
                    })
                  }
                  className="flex-row items-center gap-1.5 rounded-full bg-secondary-container px-3 py-2"
                >
                  <Icon name="rate_review" size={16} color="#4d644b" />
                  <Text className="font-body-semibold text-xs text-on-secondary-container">
                    Review
                  </Text>
                </Pressable>
              </View>
            ))}
          </>
        )}

        <Button
          label="Contact Support"
          icon="support_agent"
          variant="outline"
          className="my-6 w-full"
          onPress={() => {}}
        />

        {/* Demo control: simulates merchant/driver status pushes */}
        {isLive && (
          <Button
            label="Simulate status update (demo)"
            variant="ghost"
            className="mb-8 w-full"
            onPress={advanceActiveStatus}
          />
        )}
      </ScrollView>
    </Screen>
  );
}
