import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge } from './ui/Badge';
import { Icon } from './ui/Icon';
import { ProductImage } from './ProductImage';
import { formatPrice, type Product } from '@/api/types';
import { useCart } from '@/store/cart';

function strainLabel(p: Product) {
  if (!p.strainType) return p.category;
  return p.strainType.charAt(0).toUpperCase() + p.strainType.slice(1);
}

/** Wide featured card — horizontal "Featured Cultivars" carousel on Home. */
export function FeaturedCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="mr-4 w-64 active:opacity-90">
      <ProductImage color={product.imageColor} className="h-40 w-64 rounded-2xl" />
      <View className="mt-3 flex-row items-center justify-between">
        <Badge variant="secondary" label={strainLabel(product)} />
        <View className="flex-row items-center gap-1">
          <Icon name="star" size={14} color="#e9c176" />
          <Text className="font-body-semibold text-xs text-on-surface">{product.rating}</Text>
        </View>
      </View>
      <Text className="mt-2 font-headline text-lg text-on-surface">{product.name}</Text>
      <Text className="font-body text-sm text-on-surface-variant">
        {product.thcPct}% THC • {product.cbdPct}% CBD
      </Text>
      <Text className="mt-1 font-body-semibold text-sm text-secondary">
        From {formatPrice(product.weightOptions[0].price)} / {product.weightOptions[0].label}
      </Text>
    </Pressable>
  );
}

/** Compact row card — "Curated Selection" list on Home and Browse results. */
export function ProductRowCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const add = useCart((s) => s.add);
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center gap-4 rounded-2xl bg-surface-container-lowest p-3 active:bg-surface-container"
    >
      <ProductImage color={product.imageColor} className="h-20 w-20 rounded-xl" iconSize={28} />
      <View className="flex-1">
        <Badge variant="outline" label={strainLabel(product)} className="mb-1 px-2 py-0.5" />
        <Text className="font-headline text-base text-on-surface">{product.name}</Text>
        <Text className="font-body text-xs text-on-surface-variant">
          {product.thcPct ? `${product.thcPct}% THC` : product.category}
          {product.cbdPct ? ` • ${product.cbdPct}% CBD` : ''}
        </Text>
        <Text className="mt-0.5 font-body-semibold text-sm text-on-surface">
          {formatPrice(product.weightOptions[0].price)}
        </Text>
      </View>
      <Pressable
        hitSlop={8}
        onPress={() => add(product, product.weightOptions[0])}
        className="h-10 w-10 items-center justify-center"
      >
        <Icon name="add_circle" size={28} color="#4d644b" />
      </Pressable>
    </Pressable>
  );
}
