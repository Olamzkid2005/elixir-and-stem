import React from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'outline' | 'gold' | 'error';

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary',
  secondary: 'bg-secondary-container',
  outline: 'border border-outline-variant bg-transparent',
  gold: 'bg-tertiary-fixed',
  error: 'bg-error-container',
};

const textClasses: Record<Variant, string> = {
  default: 'text-on-primary',
  secondary: 'text-on-secondary-container',
  outline: 'text-on-surface-variant',
  gold: 'text-tertiary',
  error: 'text-on-error-container',
};

export function Badge({
  variant = 'default',
  label,
  className,
  ...props
}: ViewProps & { variant?: Variant; label: string; className?: string }) {
  return (
    <View
      className={cn('self-start rounded-full px-3 py-1', variantClasses[variant], className)}
      {...props}
    >
      <Text
        className={cn('font-body-semibold text-xs uppercase tracking-wider', textClasses[variant])}
      >
        {label}
      </Text>
    </View>
  );
}
