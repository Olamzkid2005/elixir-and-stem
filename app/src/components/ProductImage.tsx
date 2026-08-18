import React from 'react';
import { View } from 'react-native';
import { Icon } from './ui/Icon';
import { cn } from '@/lib/utils';

/**
 * Placeholder product art — a tinted tile with the brand leaf glyph.
 * Swap for expo-image once product photos land in S3 (products.image_url).
 */
export function ProductImage({
  color,
  className,
  iconSize = 36,
}: {
  color: string;
  className?: string;
  iconSize?: number;
}) {
  return (
    <View
      style={{ backgroundColor: color }}
      className={cn('items-center justify-center', className)}
    >
      <Icon name="local_florist" size={iconSize} color="#4d644b" />
    </View>
  );
}
