import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { useCart, DELIVERY_FEE } from '@/store/cart';
import { useOrders } from '@/store/orders';
import { useLoyalty } from '@/store/loyalty';
import { formatPrice } from '@/api/types';
import { cn } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

/** Checkout — delivery address, scheduling, points redemption, Pay on Delivery. */
export function CheckoutScreen({ navigation }: Props) {
  const { items, subtotal, tax, total, deliveryMode, scheduledFor, notes, setDeliveryMode, setNotes, clear } =
    useCart();
  const placeOrder = useOrders((s) => s.placeOrder);
  const { points, refresh: refreshLoyalty } = useLoyalty();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  useEffect(() => {
    refreshLoyalty();
  }, []);

  const canRedeemPoints = points >= 100; // minimum to get free delivery
  const pointsDiscount = usePoints ? DELIVERY_FEE : 0; // redeem points for free delivery
  const finalTotal = total() - pointsDiscount;

  const submit = async () => {
    if (!address.trim()) {
      Alert.alert('Delivery address required', 'Please enter where we should deliver your order.');
      return;
    }
    setLoading(true);
    try {
      const scheduledISO =
        deliveryMode === 'scheduled' && scheduleDate && scheduleTime
          ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
          : undefined;

      const order = await placeOrder({
        deliveryAddress: address,
        notes,
        scheduledFor: scheduledISO,
        items: items.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          weightLabel: i.weight.label,
          quantity: i.quantity,
          priceAtPurchase: i.weight.price,
        })),
        subtotal: subtotal(),
        tax: tax(),
        deliveryFee: usePoints ? 0 : DELIVERY_FEE,
        total: finalTotal,
      });
      clear();
      navigation.replace('OrderTracking', { orderId: order.id });
    } catch (e) {
      Alert.alert('Could not place order', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader back />
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Headline>Checkout</Headline>

        {/* Delivery Address */}
        <SectionTitle title="Delivery Address" className="px-0" />
        <Input
          icon="location_on"
          placeholder="Street address, unit, city, ZIP"
          value={address}
          onChangeText={setAddress}
          className="gap-0"
        />

        {/* Order Notes */}
        <SectionTitle title="Order Notes" className="px-0" />
        <Input
          icon="edit"
          placeholder="Gate code, drop-off instructions… (optional)"
          value={notes}
          onChangeText={setNotes}
          className="gap-0"
        />

        {/* Delivery Scheduling */}
        <SectionTitle title="Delivery Time" className="px-0" />
        <View className="gap-3">
          <Pressable
            onPress={() => setDeliveryMode('asap')}
            className={cn(
              'flex-row items-center justify-between rounded-2xl border p-4',
              deliveryMode === 'asap'
                ? 'border-primary bg-surface-container-lowest'
                : 'border-outline-variant bg-surface-container-lowest'
            )}
          >
            <View className="flex-row items-center gap-3">
              <Icon name="local_shipping" size={22} color="#1b1c19" />
              <View>
                <Text className="font-body-semibold text-base text-on-surface">
                  As Soon as Possible
                </Text>
                <Text className="font-body text-xs text-on-surface-variant">
                  Est. 45–60 minutes
                </Text>
              </View>
            </View>
            <Icon
              name="check_circle"
              size={22}
              color={deliveryMode === 'asap' ? '#061b0e' : '#c3c8c1'}
            />
          </Pressable>

          <Pressable
            onPress={() => setDeliveryMode('scheduled')}
            className={cn(
              'flex-row items-center justify-between rounded-2xl border p-4',
              deliveryMode === 'scheduled'
                ? 'border-primary bg-surface-container-lowest'
                : 'border-outline-variant bg-surface-container-lowest'
            )}
          >
            <View className="flex-row items-center gap-3">
              <Icon name="calendar_today" size={22} color="#1b1c19" />
              <View>
                <Text className="font-body-semibold text-base text-on-surface">
                  Schedule for Later
                </Text>
                <Text className="font-body text-xs text-on-surface-variant">
                  Choose a date & time
                </Text>
              </View>
            </View>
            <Icon
              name="check_circle"
              size={22}
              color={deliveryMode === 'scheduled' ? '#061b0e' : '#c3c8c1'}
            />
          </Pressable>

          {/* Date/time pickers when scheduled */}
          {deliveryMode === 'scheduled' && (
            <View className="flex-row gap-3">
              <Input
                label="Date"
                placeholder="MM/DD/YYYY"
                icon="calendar_today"
                value={scheduleDate}
                onChangeText={setScheduleDate}
                className="flex-1"
              />
              <Input
                label="Time"
                placeholder="HH:MM"
                icon="schedule"
                value={scheduleTime}
                onChangeText={setScheduleTime}
                className="flex-1"
              />
            </View>
          )}
        </View>

        {/* Payment Method */}
        <SectionTitle title="Payment Method" className="px-0" />
        <View className="flex-row items-center gap-3 rounded-2xl border border-primary bg-surface-container-lowest p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary-container">
            <Icon name="local_shipping" size={20} color="#4d644b" />
          </View>
          <View className="flex-1">
            <Text className="font-body-semibold text-base text-on-surface">Pay on Delivery</Text>
            <Text className="font-body text-xs text-on-surface-variant">
              Cash or card when your order arrives. ID check required at handoff.
            </Text>
          </View>
          <Icon name="check_circle" size={22} color="#061b0e" />
        </View>
        <Text className="mt-2 font-body text-xs text-on-surface-variant">
          Online payment processing arrives in a later phase — pay-on-delivery only for now.
        </Text>

        {/* Loyalty points redemption */}
        {canRedeemPoints && (
          <>
            <SectionTitle title="Loyalty Points" className="px-0" />
            <Pressable
              onPress={() => setUsePoints(!usePoints)}
              className={cn(
                'flex-row items-center gap-3 rounded-2xl border p-4',
                usePoints
                  ? 'border-primary bg-surface-container-lowest'
                  : 'border-outline-variant bg-surface-container-lowest'
              )}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-tertiary-fixed">
                <Icon name="card_giftcard" size={20} color="#211500" />
              </View>
              <View className="flex-1">
                <Text className="font-body-semibold text-base text-on-surface">
                  Redeem 100 Points for Free Delivery
                </Text>
                <Text className="font-body text-xs text-on-surface-variant">
                  You have {points} points available
                </Text>
              </View>
              <Icon
                name={usePoints ? 'check_circle' : 'radio_button_unchecked'}
                size={22}
                color={usePoints ? '#061b0e' : '#c3c8c1'}
              />
            </Pressable>
          </>
        )}

        {/* Order Summary */}
        <SectionTitle title="Order Summary" className="px-0" />
        <View className="mb-6 gap-2 rounded-2xl bg-surface-container p-4">
          <SummaryRow label="Subtotal" value={formatPrice(subtotal())} />
          <SummaryRow label="VAT (7.5%)" value={formatPrice(Math.round(subtotal() * 0.075))} />
          <SummaryRow label="State Levy (2.5%)" value={formatPrice(Math.round(subtotal() * 0.025))} />
          <SummaryRow
            label="Delivery Fee"
            value={usePoints ? 'FREE' : formatPrice(DELIVERY_FEE)}
            strikethrough={usePoints}
          />
          <View className="my-1 h-px bg-outline-variant" />
          <SummaryRow label="Total due on delivery" value={formatPrice(finalTotal)} bold />
        </View>

        <Button
          label="Place Order"
          iconRight="arrow_forward"
          size="lg"
          className="mb-10 w-full"
          loading={loading}
          onPress={submit}
        />
      </ScrollView>
    </Screen>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  strikethrough,
}: {
  label: string;
  value: string;
  bold?: boolean;
  strikethrough?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className={cn(
          bold ? 'font-body-semibold text-base text-on-surface' : 'font-body text-sm text-on-surface-variant'
        )}
      >
        {label}
      </Text>
      <Text
        className={cn(
          bold ? 'font-headline text-lg text-primary' : 'font-body-semibold text-sm text-on-surface',
          strikethrough && 'text-secondary'
        )}
      >
        {value}
      </Text>
    </View>
  );
}
