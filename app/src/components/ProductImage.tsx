import React from 'react';
import { Image, View } from 'react-native';
import { Icon } from './ui/Icon';
import { cn } from '@/lib/utils';

/**
 * Product image — shows a real photo when imageUrl is provided,
 * otherwise falls back to a tinted placeholder tile with leaf icon.
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

  // Placeholder tile
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
