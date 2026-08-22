import React from 'react';
import { Image, View } from 'react-native';
import { Icon } from './ui/Icon';
import { cn } from '@/lib/utils';

/**
 * Product image — shows a real photo when imageUrl is provided,
 * otherwise falls back to a tinted placeholder tile with botanical leaf icon
 * and subtle decorative elements.
 */
export function ProductImage({
  imageUrl,
  color,
  className,
  iconSize = 36,
}: {
  imageUrl?: string | null;
  color: string;
  className?: string;
  iconSize?: number;
}) {
  if (imageUrl) {
    return (
      <View className={cn('overflow-hidden', className)}>
        <Image
          source={{ uri: imageUrl }}
          className="h-full w-full"
          resizeMode="cover"
        />
      </View>
    );
  }

  // Placeholder tile — botanical aesthetic with depth
  return (
    <View
      style={{ backgroundColor: color }}
      className={cn('items-center justify-center overflow-hidden', className)}
    >
      {/* Subtle inner highlight for depth */}
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.12)',
          width: '100%',
          height: '50%',
          position: 'absolute',
          top: 0,
        }}
      />
      {/* Decorative circle */}
      <View
        style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: iconSize * 1.8,
          height: iconSize * 1.8,
          borderRadius: iconSize * 0.9,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}
      />
      {/* Bottom accent line */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: '20%',
          right: '20%',
          height: 3,
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: 1.5,
        }}
      />
      <Icon name="local_florist" size={iconSize} color="#4d644b" />
    </View>
  );
}
