import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { ProductImage } from '@/components/ProductImage';
import { DELIVERY_FEE, useCart } from '@/store/cart';
import { formatPrice } from '@/api/types';
import { cn } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Cart — item list, delivery method (ASAP / Schedule), order summary. */
export function CartScreen() {
  const navigation = useNavigation<Nav>();
  const { items, setQuantity, remove, deliveryMode, setDeliveryMode, subtotal, tax, total, count } =
    useCart();

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-baseline justify-between px-4 pt-2">
          <Headline>Your Cart</Headline>
          <Text className="font-body text-sm text-on-surface-variant">
            {count()} Item{count() === 1 ? '' : 's'}
          </Text>
        </View>

        <View className="mt-4 px-4">
          {items.length === 0 && (
            <View className="items-center rounded-3xl bg-surface-container-lowest py-16 shadow-elevation-1" style={{ elevation: 1 }}>
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-surface-container">
                <Icon name="shopping_bag" size={40} color="#c3c8c1" />
              </View>
              <Text className="font-body-semibold text-base text-on-surface">
                Your cart is empty
              </Text>
              <Text className="mt-1 font-body text-sm text-on-surface-variant">
                Browse our menu to find something you'll love
              </Text>
              <Button
                label="Browse Menu"
                icon="search"
                variant="secondary"
                size="sm"
                className="mt-4"
                onPress={() => navigation.navigate('CustomerTabs', { screen: 'Browse' })}
              />
            </View>
          )}

          {items.map((item) => (
            <View
              key={`${item.product.id}-${item.weight.label}`}
              className="mb-3 flex-row gap-3 rounded-3xl bg-surface-container-lowest p-3 shadow-elevation-1"
              style={{ elevation: 1 }}
            >
              <ProductImage imageUrl={item.product.imageUrl} color={item.product.imageColor} className="h-20 w-20 rounded-2xl" iconSize={28} />
              <View className="flex-1">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Badge
                      variant="outline"
                      label={
                        item.product.strainType
                          ? item.product.strainType.charAt(0).toUpperCase() +
                            item.product.strainType.slice(1)
                          : item.product.category
                      }
                      className="mb-1 self-start px-2 py-0.5"
                    />
                    <Text className="font-headline text-base text-on-surface">
                      {item.product.name}
                    </Text>
                    <Text className="font-body text-xs text-on-surface-variant">
                      {item.weight.label} · {item.product.brand}
                    </Text>
                  </View>
                  <Pressable
                    hitSlop={8}
                    onPress={() => remove(item.product.id, item.weight.label)}
                    className="h-8 w-8 items-center justify-center rounded-full bg-surface-container"
                  >
                    <Icon name="close" size={18} color="#737973" />
                  </Pressable>
                </View>
                <View className="mt-2 flex-row items-center justify-between">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(q) => setQuantity(item.product.id, item.weight.label, q)}
                    min={0}
                    max={item.product.stock}
                  />
                  <Text className="font-body-semibold text-base text-on-surface">
                    {formatPrice(item.weight.price * item.quantity)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {items.length > 0 && (
          <>
            {/* Delivery method */}
            <SectionTitle title="Delivery Method" className="mt-2" />
            <View className="gap-3 px-4">
              <Pressable
                onPress={() => setDeliveryMode('asap')}
                className={cn(
                  'flex-row items-center justify-between rounded-3xl border-2 p-4',
                  deliveryMode === 'asap'
                    ? 'border-primary bg-surface-container-lowest shadow-elevation-1'
                    : 'border-outline-variant bg-surface-container-lowest'
                )}
                style={{ elevation: deliveryMode === 'asap' ? 1 : 0 }}
              >
                <View className="flex-row items-center gap-3">
                  <View className={cn(
                    'h-11 w-11 items-center justify-center rounded-2xl',
                    deliveryMode === 'asap' ? 'bg-primary' : 'bg-surface-container'
                  )}>
                    <Icon name="local_shipping" size={20} color={deliveryMode === 'asap' ? '#ffffff' : '#1b1c19'} />
                  </View>
                  <View>
                    <Text className="font-body-semibold text-base text-on-surface">
                      Standard Delivery
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Icon name="schedule" size={13} color="#737973" />
                      <Text className="font-body text-xs text-on-surface-variant">
                        Est. 45 - 60 mins
                      </Text>
                    </View>
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
                  'flex-row items-center justify-between rounded-3xl border-2 p-4',
                  deliveryMode === 'scheduled'
                    ? 'border-primary bg-surface-container-lowest shadow-elevation-1'
                    : 'border-outline-variant bg-surface-container-lowest'
                )}
                style={{ elevation: deliveryMode === 'scheduled' ? 1 : 0 }}
              >
                <View className="flex-row items-center gap-3">
                  <View className={cn(
                    'h-11 w-11 items-center justify-center rounded-2xl',
                    deliveryMode === 'scheduled' ? 'bg-primary' : 'bg-surface-container'
                  )}>
                    <Icon name="calendar_today" size={20} color={deliveryMode === 'scheduled' ? '#ffffff' : '#1b1c19'} />
                  </View>
                  <View>
                    <Text className="font-body-semibold text-base text-on-surface">
                      Schedule for Later
                    </Text>
                    <Text className="font-body text-xs text-on-surface-variant">
                      Choose date &amp; time
                    </Text>
                  </View>
                </View>
                <Icon
                  name="check_circle"
                  size={22}
                  color={deliveryMode === 'scheduled' ? '#061b0e' : '#c3c8c1'}
                />
              </Pressable>
            </View>

            {/* Order summary */}
            <SectionTitle title="Order Summary" className="mt-2" />
            <View className="mx-4 overflow-hidden rounded-3xl bg-surface-container-lowest shadow-elevation-1" style={{ elevation: 1 }}>
              <View className="h-1 bg-primary/20" />
              <View className="gap-2 p-4">
                <SummaryRow label="Subtotal" value={formatPrice(subtotal())} />
                <SummaryRow label="Estimated Tax" value={formatPrice(tax())} />
                <SummaryRow label="Delivery Fee" value={formatPrice(DELIVERY_FEE)} />
                <View className="my-1 h-px bg-outline-variant" />
                <SummaryRow label="Total" value={formatPrice(total())} bold />
              </View>
            </View>

            <View className="mb-8 mt-5 px-4">
              <Button
                label="Proceed to Checkout"
                iconRight="arrow_forward"
                size="lg"
                className="w-full"
                onPress={() => navigation.navigate('Checkout')}
              />
              <View className="mt-3 flex-row items-center justify-center gap-1.5">
                <Icon name="lock" size={13} color="#737973" />
                <Text className="font-body text-xs text-on-surface-variant">Secure Checkout</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
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
          bold ? 'font-headline text-lg text-primary' : 'font-body-semibold text-sm text-on-surface'
        )}
      >
        {value}
      </Text>
    </View>
  );
}
