import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useOrders } from '@/store/orders';
import { useRiderLocation } from '@/lib/useRiderLocation';
import { formatPrice, type OrderStatus } from '@/api/types';
import { cn } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderTracking'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'placed', label: 'Order Received', icon: 'receipt_long' },
  { status: 'confirmed', label: 'Confirmed', icon: 'check_circle' },
  { status: 'ready_for_pickup', label: 'Preparing Order', icon: 'inventory' },
  { status: 'rider_assigned', label: 'Rider Assigned', icon: 'person' },
  { status: 'picked_up', label: 'Picked Up', icon: 'local_shipping' },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: 'local_shipping' },
  { status: 'arrived', label: 'Rider Has Arrived', icon: 'location_on' },
  { status: 'delivered', label: 'Delivered', icon: 'check_circle' },
];

/** Default map region — Lagos, Nigeria */
const DEFAULT_REGION = {
  latitude: 6.5244,
  longitude: 3.3792,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/** Order Tracking — ETA card, live rider map, courier card, vertical status timeline, review CTA. */
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
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-surface-container">
            <Icon name="receipt_long" size={32} color="#c3c8c1" />
          </View>
          <Text className="font-body-semibold text-base text-on-surface">
            Order not found
          </Text>
          <Text className="mt-1 font-body text-sm text-on-surface-variant">
            It may still be syncing.
          </Text>
        </View>
      </Screen>
    );
  }

  const activeIdx = STEPS.findIndex((s) => s.status === order.status);
  const isLive = order.status !== 'delivered' && order.status !== 'rejected';
  const isDelivered = order.status === 'delivered';

  // Poll rider location when order is in transit
  const shouldTrackRider = isLive && ['rider_assigned', 'picked_up', 'out_for_delivery', 'arrived'].includes(order.status);
  const { rider: liveRider } = useRiderLocation(order.id, (order as any).riderId, shouldTrackRider);

  // Compute map region centered on rider or merchant
  const mapRegion = liveRider?.lat && liveRider?.lng
    ? {
        latitude: liveRider.lat,
        longitude: liveRider.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : DEFAULT_REGION;

  return (
    <Screen>
      <AppHeader back />
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Headline>Track Your Order</Headline>
        <Text className="mt-1 font-body text-sm text-on-surface-variant">Order #{order.id}</Text>

        {/* Live rider map — shown during transit */}
        {shouldTrackRider && (
          <View className="mt-4 overflow-hidden rounded-3xl shadow-elevation-2" style={{ elevation: 2 }}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ height: 200, width: '100%' }}
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              {/* Rider marker */}
              {liveRider?.lat && liveRider?.lng && (
                <Marker
                  coordinate={{ latitude: liveRider.lat, longitude: liveRider.lng }}
                  title="Rider"
                >
                  <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-primary shadow-elevation-4" style={{ elevation: 4 }}>
                    <Icon name="local_shipping" size={20} color="#ffffff" />
                  </View>
                </Marker>
              )}
            </MapView>
            <View className="bg-surface-container p-2.5">
              <Text className="text-center font-body text-xs text-on-surface-variant">
                {liveRider?.lat ? '● Live — Rider location updating' : 'Waiting for rider GPS…'}
              </Text>
            </View>
          </View>
        )}

        {/* Expected arrival */}
        {order.etaMins && isLive && (
          <View className="mt-5 overflow-hidden rounded-3xl">
            <View className="absolute inset-0 bg-primary" />
            {/* Decorative circle */}
            <View
              style={{
                position: 'absolute',
                top: -20,
                right: -10,
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(77,100,75,0.2)',
              }}
            />
            <View className="flex-row items-center gap-4 p-5">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-container">
                <Icon name="schedule" size={24} color="#d0e9d4" />
              </View>
              <View>
                <Text className="font-body text-xs uppercase tracking-widest text-on-primary-container">
                  Estimated Arrival
                </Text>
                <Text className="mt-1 font-headline text-2xl text-on-primary">
                  {order.etaMins[0]} - {order.etaMins[1]} Min
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Courier / Rider */}
        {(liveRider || order.driver) && isLive && (
          <View className="mt-3 overflow-hidden rounded-3xl bg-surface-container-lowest shadow-elevation-1" style={{ elevation: 1 }}>
            <View className="h-1 bg-primary/20" />
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container">
                  <Icon name="local_shipping" size={24} color="#4d644b" />
                </View>
                <View>
                  <Text className="font-body-semibold text-base text-on-surface">
                    {liveRider?.vehicleType === 'motorcycle' ? 'Motorcycle Rider' : 'Your Courier'}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Icon name="star" size={13} color="#e9c176" />
                    <Text className="font-body text-xs text-on-surface-variant">
                      {(liveRider?.rating ?? order.driver?.rating ?? 5.0).toFixed(1)} Rating
                    </Text>
                    {liveRider?.lat && liveRider?.lng && (
                      <Badge variant="secondary" label="Live" className="px-2 py-0.5" />
                    )}
                  </View>
                </View>
              </View>
              <View className="flex-row gap-2">
                <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                  <Icon name="call" size={20} color="#1b1c19" />
                </Pressable>
                <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                  <Icon name="chat" size={20} color="#1b1c19" />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View className="mb-3 mt-7 flex-row items-center gap-2">
          <View className="h-5 w-1 rounded-full bg-primary" />
          <Text className="font-headline text-xl text-on-surface">Order Status</Text>
        </View>
        <View className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-elevation-1" style={{ elevation: 1 }}>
          {STEPS.map((step, i) => {
            const done = i < activeIdx || order.status === 'delivered';
            const current = i === activeIdx && order.status !== 'delivered';
            const isLast = i === STEPS.length - 1;
            return (
              <View key={step.status} className="flex-row">
                <View className="items-center">
                  <View
                    className={cn(
                      'h-9 w-9 items-center justify-center rounded-full',
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
                  {!isLast && (
                    <View
                      className={cn(
                        'my-0.5 w-0.5',
                        i < activeIdx ? 'bg-primary' : 'bg-surface-container-highest'
                      )}
                      style={{ minHeight: 28 }}
                    />
                  )}
                </View>
                <View className={cn('ml-4 flex-1', isLast ? 'py-3' : 'pb-5')}>
                  <Text
                    className={cn(
                      'font-body-semibold text-base',
                      done || current ? 'text-on-surface' : 'text-on-surface-variant'
                    )}
                  >
                    {step.label}
                  </Text>
                  <Text className="font-body text-xs text-on-surface-variant">
                    {step.status === 'placed' && 'Order placed'}
                    {step.status === 'confirmed' && `${order.merchantName} accepted`}
                    {step.status === 'ready_for_pickup' && current && 'Being prepared by the merchant'}
                    {step.status === 'rider_assigned' && current && 'Rider is heading to the merchant'}
                    {step.status === 'out_for_delivery' && current && 'On the way to you'}
                    {step.status === 'arrived' && current && 'At your location'}
                    {step.status === 'delivered' && current && 'Enjoy your order! 🌿'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Review CTA for delivered orders */}
        {isDelivered && order.items.length > 0 && (
          <>
            <View className="mb-3 mt-7 flex-row items-center gap-2">
              <View className="h-5 w-1 rounded-full bg-secondary" />
              <Text className="font-headline text-xl text-on-surface">Leave a Review</Text>
            </View>
            <Text className="mb-4 font-body text-sm text-on-surface-variant">
              Share your experience to help other customers.
            </Text>
            {order.items.map((item) => (
              <View
                key={item.productId}
                className="mb-3 flex-row items-center gap-3 rounded-3xl bg-surface-container-lowest p-4 shadow-elevation-1"
                style={{ elevation: 1 }}
              >
                <View className="flex-1">
                  <Text className="font-body-semibold text-base text-on-surface">{item.name}</Text>
                  <Text className="font-body text-xs text-on-surface-variant">
                    {item.weightLabel} · {formatPrice(item.priceAtPurchase)}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    navigation.navigate('WriteReview', {
                      orderItemId: item.id ?? '',
                      productName: item.name,
                      productImageColor: item.imageColor,
                      imageUrl: item.imageUrl,
                    })
                  }
                  className="flex-row items-center gap-1.5 rounded-full bg-secondary-container px-3 py-2"
                >
                  <Icon name="rate_review" size={16} color="#4d644b" />
                  <Text className="font-body-semibold text-xs text-on-secondary-container">Review</Text>
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
