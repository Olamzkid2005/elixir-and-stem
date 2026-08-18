import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

/** shadcn-style Card primitives. */
export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn('rounded-2xl bg-surface-container-lowest', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('gap-1.5 p-4', className)} {...props} />;
}

export function CardContent({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('p-4 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('flex-row items-center p-4 pt-0', className)} {...props} />;
}
