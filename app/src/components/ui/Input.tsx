import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

export interface InputProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  error?: string;
  className?: string;
  rightSlot?: React.ReactNode;
}

/** shadcn-style labeled Input. */
export function Input({ label, icon, error, className, rightSlot, ...props }: InputProps) {
  return (
    <View className={cn('gap-2', className)}>
      {label && (
        <Text className="font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
          {label}
        </Text>
      )}
      <View
        className={cn(
          'h-14 flex-row items-center gap-3 rounded-xl border bg-surface-container-lowest px-4',
          error ? 'border-error' : 'border-outline-variant'
        )}
      >
        {icon && <Icon name={icon} size={20} color="#737973" />}
        <TextInput
          placeholderTextColor="#737973"
          className="flex-1 font-body text-base text-on-surface"
          {...props}
        />
        {rightSlot}
      </View>
      {error && <Text className="font-body text-xs text-error">{error}</Text>}
    </View>
  );
}
