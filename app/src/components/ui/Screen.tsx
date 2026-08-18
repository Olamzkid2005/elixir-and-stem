import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

/** Shared screen canvas — warm off-white background from the design system. */
export function Screen({
  children,
  className,
  edges = ['top'],
}: {
  children: React.ReactNode;
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  return (
    <SafeAreaView edges={edges} className={cn('flex-1 bg-background', className)}>
      {children}
    </SafeAreaView>
  );
}

/** Centered headline (Playfair Display). */
export function Headline({
  children,
  size = 'lg',
  className,
}: {
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return (
    <View>
      <RNText size={size} className={className}>
        {children}
      </RNText>
    </View>
  );
}

import { Text } from 'react-native';

function RNText({
  children,
  size,
  className,
}: {
  children: React.ReactNode;
  size: 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return (
    <Text
      className={cn(
        'font-headline text-on-surface',
        size === 'xl' && 'text-4xl leading-[44px]',
        size === 'lg' && 'text-[28px] leading-9',
        size === 'md' && 'text-2xl leading-8',
        className
      )}
    >
      {children}
    </Text>
  );
}
