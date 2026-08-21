import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProductImage } from '@/components/ProductImage';
import { mockProducts } from '@/api/mock';
import { formatPrice } from '@/api/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Inventory — list products, adjust stock, add/edit/remove. */
export function InventoryScreen() {
  const navigation = useNavigation<Nav>();
  const [products, setProducts] = useState(mockProducts.filter((p) => p.merchantId === 'm1'));

  const adjustStock = (id: string, delta: number) =>
    setProducts((ps) =>
      ps.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    );

  const removeProduct = (id: string) =>
    Alert.alert('Remove product?', 'This takes it off your customer-facing menu.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setProducts((ps) => ps.filter((p) => p.id !== id)),
      },
    ]);

  return (
    <Screen>
      <AppHeader />
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <View className="mt-2 flex-row items-center justify-between">
          <Headline>Inventory</Headline>
          <Button
            label="Add Product"
            icon="add"
            size="sm"
            onPress={() => navigation.navigate('ProductForm', {})}
          />
        </View>

        <View className="mt-4 pb-8">
          {products.map((p) => (
            <View
              key={p.id}
              className="mb-3 flex-row items-center gap-3 rounded-2xl bg-surface-container-lowest p-3"
            >
              <ProductImage imageUrl={p.imageUrl} color={p.imageColor} className="h-16 w-16 rounded-xl" iconSize={24} />
              <View className="flex-1">
                <Text className="font-body-semibold text-base text-on-surface">{p.name}</Text>
                <Text className="font-body text-xs text-on-surface-variant">
                  {p.category} • from {formatPrice(p.weightOptions[0].price)}
                </Text>
                <View className="mt-1.5 flex-row items-center gap-2">
                  <Pressable
                    hitSlop={6}
                    onPress={() => adjustStock(p.id, -1)}
                    className="h-7 w-7 items-center justify-center rounded-full bg-surface-container"
                  >
                    <Icon name="remove" size={14} color="#1b1c19" />
                  </Pressable>
                  <Text className="font-body-semibold text-sm text-on-surface">{p.stock}</Text>
                  <Pressable
                    hitSlop={6}
                    onPress={() => adjustStock(p.id, 1)}
                    className="h-7 w-7 items-center justify-center rounded-full bg-surface-container"
                  >
                    <Icon name="add" size={14} color="#1b1c19" />
                  </Pressable>
                  {p.stock < 20 && <Badge variant="gold" label="Low" className="ml-1" />}
                </View>
              </View>
              <View className="gap-1">
                <Pressable
                  hitSlop={8}
                  onPress={() => navigation.navigate('ProductForm', { productId: p.id })}
                  className="h-9 w-9 items-center justify-center"
                >
                  <Icon name="edit" size={20} color="#4d644b" />
                </Pressable>
                <Pressable
                  hitSlop={8}
                  onPress={() => removeProduct(p.id)}
                  className="h-9 w-9 items-center justify-center"
                >
                  <Icon name="delete" size={20} color="#ba1a1a" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
