import React from 'react';
import { View } from 'react-native';
import { Icon } from './ui/Icon';
import { cn } from '@/lib/utils';

/**
 * Placeholder product art — a tinted tile with the brand leaf glyph.
 * Uses a two-tone treatment: lighter overlay + centered icon for visual depth.
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
      className={cn('items-center justify-center overflow-hidden', className)}
    >
      {/* Subtle inner highlight to give depth */}
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          width: '100%',
          height: '50%',
          position: 'absolute',
          top: 0,
        }}
      />
      <Icon name="local_florist" size={iconSize} color="#4d644b" />
    </View>
  );
}
