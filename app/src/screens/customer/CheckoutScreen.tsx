import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { useCart } from '@/store/cart';
import { useOrders } from '@/store/orders';
import { formatPrice } from '@/api/types';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

/** Checkout — delivery address, notes, Pay on Delivery (primary payment method). */
export function CheckoutScreen({ navigation }: Props) {
  const { items, subtotal, tax, total, deliveryMode, scheduledFor, notes, setNotes, clear } =
    useCart();
  const placeOrder = useOrders((s) => s.placeOrder);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!address.trim()) {
      Alert.alert('Delivery address required', 'Please enter where we should deliver your order.');
      return;
    }
    setLoading(true);
    try {
      const order = await placeOrder({
        deliveryAddress: address,
        notes,
        scheduledFor: deliveryMode === 'scheduled' ? scheduledFor : undefined,
        items: items.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          weightLabel: i.weight.label,
          quantity: i.quantity,
          priceAtPurchase: i.weight.price,
        })),
        subtotal: subtotal(),
        tax: tax(),
        deliveryFee: 500,
        total: total(),
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

        <SectionTitle title="Delivery Address" className="px-0" />
        <Input
          icon="location_on"
          placeholder="Street address, unit, city, ZIP"
          value={address}
          onChangeText={setAddress}
          className="gap-0"
        />

        <SectionTitle title="Order Notes" className="px-0" />
        <Input
          icon="edit"
          placeholder="Gate code, drop-off instructions… (optional)"
          value={notes}
          onChangeText={setNotes}
          className="gap-0"
        />

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

        {deliveryMode === 'scheduled' && (
          <Text className="mt-4 font-body text-sm text-secondary">
            Scheduled delivery: {scheduledFor ?? 'choose a time window at handoff confirmation'}
          </Text>
        )}

        <View className="mb-6 mt-6 gap-2 rounded-2xl bg-surface-container p-4">
          <View className="flex-row justify-between">
            <Text className="font-body text-sm text-on-surface-variant">Total due on delivery</Text>
            <Text className="font-headline text-xl text-primary">{formatPrice(total())}</Text>
          </View>
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
