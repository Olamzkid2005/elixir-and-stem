import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

/** Quantity stepper used on Product Detail and Cart rows. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-4 rounded-full bg-surface-container px-2 py-1.5',
        className
      )}
    >
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        hitSlop={8}
        className="h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest"
      >
        <Icon name="remove" size={18} color="#1b1c19" />
      </Pressable>
      <Text className="min-w-[20px] text-center font-body-semibold text-base text-on-surface">
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        hitSlop={8}
        className="h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest"
      >
        <Icon name="add" size={18} color="#1b1c19" />
      </Pressable>
    </View>
  );
}
