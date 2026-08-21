import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Icon, type IconName } from '@/components/ui/Icon';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { ProductImage } from '@/components/ProductImage';
import { AppHeader } from '@/components/AppHeader';
import { formatPrice, type WeightOption, type Review } from '@/api/types';
import { useCart } from '@/store/cart';
import { useFavorites } from '@/store/favorites';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

/** Product Detail — hero, strain stats, terpenes, effects, weight tiers, favorites, reviews. */
export function ProductDetailScreen({ route, navigation }: Props) {
  const { product } = route.params;
  const [weight, setWeight] = useState<WeightOption>(product.weightOptions[0]);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const add = useCart((s) => s.add);
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const { toggle, isFavorite, refresh: refreshFavorites } = useFavorites();
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    refreshFavorites();
    api.listProductReviews(product.id).then(setReviews).catch(() => {});
  }, [product.id]);

  const strain = product.strainType
    ? `${product.strainType.charAt(0).toUpperCase() + product.strainType.slice(1)} ${
        product.strainType === 'indica' ? 'Dominant' : ''
      }`
    : product.category;

  const favorited = isFavorite(product.id);

  return (
    <Screen edges={['top']}>
      <AppHeader back />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero with favorites toggle */}
        <View className="px-4">
          <View className="relative">
            <ProductImage imageUrl={product.imageUrl} color={product.imageColor} className="h-72 w-full rounded-2xl" iconSize={72} />
            <Pressable
              onPress={() => toggle(product.id)}
              hitSlop={8}
              className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full bg-surface/80"
            >
              <Icon
                name={favorited ? 'favorite' : 'favorite_border'}
                size={22}
                color={favorited ? '#ba1a1a' : '#1b1c19'}
              />
            </Pressable>
          </View>
        </View>

        <View className="px-4 pt-5">
          <View className="flex-row items-center justify-between">
            <Badge variant="secondary" label={strain} />
            <View className="flex-row items-center gap-1">
              <Icon name="star" size={16} color="#e9c176" />
              <Text className="font-body-semibold text-sm text-on-surface">
                {product.rating} ({product.reviews})
              </Text>
            </View>
          </View>

          <Headline className="mt-3">{product.name}</Headline>
          <Text className="mt-2 font-body text-base leading-6 text-on-surface-variant">
            {product.description}
          </Text>

          {/* THC / CBD stats */}
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1 items-center rounded-2xl bg-surface-container-lowest py-4">
              <Text className="font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
                THC
              </Text>
              <Text className="mt-1 font-headline text-2xl text-primary">
                {product.thcPct ?? 0}%
              </Text>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-surface-container-lowest py-4">
              <Text className="font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
                CBD
              </Text>
              <Text className="mt-1 font-headline text-2xl text-primary">
                {product.cbdPct ?? 0}%
              </Text>
            </View>
          </View>

          {/* Terpenes */}
          {product.terpenes.length > 0 && (
            <>
              <Text className="mb-2 mt-6 font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
                Dominant Terpenes
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {product.terpenes.map((t) => (
                  <Chip key={t} label={t} />
                ))}
              </View>
            </>
          )}

          {/* Effects */}
          {product.effects.length > 0 && (
            <>
              <Text className="mb-2 mt-6 font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
                Reported Effects
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {product.effects.map((e) => (
                  <Chip key={e.label} label={e.label} icon={e.icon as IconName} />
                ))}
              </View>
            </>
          )}

          {/* Weight selector */}
          <View className="mb-3 mt-6 flex-row items-baseline justify-between">
            <Text className="font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
              Select Weight
            </Text>
            <Text className="font-headline text-xl text-primary">{formatPrice(weight.price)}</Text>
          </View>
          <View className="flex-row gap-2">
            {product.weightOptions.map((w) => (
              <Pressable
                key={w.label}
                onPress={() => setWeight(w)}
                className={cn(
                  'flex-1 items-center rounded-xl border py-3',
                  weight.label === w.label
                    ? 'border-primary bg-primary'
                    : 'border-outline-variant bg-surface-container-lowest'
                )}
              >
                <Text
                  className={cn(
                    'font-body-semibold text-sm',
                    weight.label === w.label ? 'text-on-primary' : 'text-on-surface'
                  )}
                >
                  {w.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Quantity + stock */}
          <View className="mb-6 mt-5 flex-row items-center justify-between">
            <Text className="font-body text-sm text-on-surface-variant">
              {product.stock} in stock
            </Text>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.min(product.stock, 99)}
            />
          </View>

          {/* Reviews section */}
          <Pressable
            onPress={() => setShowReviews(!showReviews)}
            className="flex-row items-center justify-between rounded-2xl bg-surface-container-lowest p-4"
          >
            <View className="flex-row items-center gap-2">
              <Icon name="rate_review" size={20} color="#4d644b" />
              <Text className="font-body-semibold text-base text-on-surface">
                Reviews ({reviews.length})
              </Text>
            </View>
            <Icon
              name={showReviews ? 'expand_less' : 'expand_more'}
              size={22}
              color="#737973"
            />
          </Pressable>

          {showReviews && (
            <View className="mt-3 gap-3 pb-4">
              {reviews.length === 0 && (
                <Text className="py-4 text-center font-body text-sm text-on-surface-variant">
                  No reviews yet — be the first!
                </Text>
              )}
              {reviews.map((review) => (
                <View key={review.id} className="rounded-2xl bg-surface-container-lowest p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Icon
                          key={star}
                          name={star <= review.rating ? 'star' : 'star_border'}
                          size={14}
                          color={star <= review.rating ? '#e9c176' : '#c3c8c1'}
                        />
                      ))}
                    </View>
                    <Text className="font-body text-xs text-on-surface-variant">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {review.comment && (
                    <Text className="mt-2 font-body text-sm text-on-surface leading-5">
                      {review.comment}
                    </Text>
                  )}
                  <Text className="mt-2 font-body text-xs text-on-surface-variant">
                    Verified purchase
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Purchase action bar */}
      <View className="flex-row items-center gap-3 border-t border-outline-variant bg-surface px-4 py-3">
        <Button
          label={`Add to Cart · ${formatPrice(weight.price * quantity)}`}
          icon="shopping_bag"
          size="lg"
          className="flex-1"
          onPress={() => {
            add(product, weight, quantity);
            navigation.goBack();
          }}
        />
        {cartCount > 0 && (
          <Pressable
            onPress={() => navigation.navigate('CustomerTabs', { screen: 'Cart' })}
            className="h-12 w-12 items-center justify-center rounded-full bg-secondary-container"
          >
            <Icon name="shopping_bag" size={22} color="#536a51" />
          </Pressable>
        )}
      </View>
    </Screen>
  );
}
