import React from 'react';
import { Pressable, Text } from 'react-native';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

/** Selectable filter chip (category pills, terpenes, effects). */
export function Chip({
  label,
  icon,
  selected,
  onPress,
  className,
}: {
  label: string;
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1.5 rounded-full border px-4 py-2',
        selected
          ? 'border-primary bg-primary'
          : 'border-outline-variant bg-surface-container-lowest',
        className
      )}
    >
      {icon && <Icon name={icon} size={16} color={selected ? '#ffffff' : '#434843'} />}
      <Text
        className={cn(
          'font-body-semibold text-sm',
          selected ? 'text-on-primary' : 'text-on-surface-variant'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
