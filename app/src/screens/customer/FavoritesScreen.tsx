import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Icon } from '@/components/ui/Icon';
import { ProductImage } from '@/components/ProductImage';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/api/types';
import { useFavorites } from '@/store/favorites';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** FavoritesScreen — grid of favorited products, accessible from Profile tab. */
export function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const { favorites, loading, refresh, toggle } = useFavorites();

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Screen>
      <AppHeader back />
      <View className="flex-1 px-4">
        <Headline className="mt-2">Favorites</Headline>
        <Text className="mt-1 mb-4 font-body text-sm text-on-surface-variant">
          {favorites.length} saved product{favorites.length === 1 ? '' : 's'}
        </Text>

        {favorites.length === 0 && !loading && (
          <View className="flex-1 items-center justify-center pb-20">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <Icon name="favorite_border" size={32} color="#c3c8c1" />
            </View>
            <Text className="font-body text-base text-on-surface-variant">
              No favorites yet
            </Text>
            <Text className="mt-1 font-body text-sm text-on-surface-variant">
              Tap the heart on any product to save it here
            </Text>
          </View>
        )}

        <View className="flex-row flex-wrap gap-3">
          {favorites.map((product) => (
            <Pressable
              key={product.id}
              onPress={() => navigation.navigate('ProductDetail', { product })}
              className="w-[calc(50%-6px)] rounded-2xl bg-surface-container-lowest overflow-hidden"
            >
              <View className="relative">
                <ProductImage
                  imageUrl={product.imageUrl}
                  color={product.imageColor}
                  className="h-36 w-full"
                  iconSize={40}
                />
                <Pressable
                  onPress={() => toggle(product.id)}
                  hitSlop={8}
                  className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-surface/80"
                >
                  <Icon name="favorite" size={18} color="#ba1a1a" />
                </Pressable>
              </View>
              <View className="p-3">
                <Badge
                  variant="secondary"
                  label={product.strainType ?? product.category}
                  className="mb-1 self-start px-2 py-0.5"
                />
                <Text className="font-headline text-sm text-on-surface" numberOfLines={1}>
                  {product.name}
                </Text>
                <Text className="font-body text-xs text-on-surface-variant" numberOfLines={1}>
                  {product.brand}
                </Text>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="font-body-semibold text-sm text-primary">
                    {formatPrice(product.weightOptions[0]?.price ?? 0)}
                  </Text>
                  <View className="flex-row items-center gap-0.5">
                    <Icon name="star" size={12} color="#e9c176" />
                    <Text className="font-body text-xs text-on-surface-variant">
                      {product.rating}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
