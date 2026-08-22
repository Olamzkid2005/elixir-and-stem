import React from 'react';
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gold';
type Size = 'default' | 'sm' | 'lg' | 'icon';

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary active:opacity-90',
  secondary: 'bg-secondary-container active:bg-primary-fixed',
  outline: 'border border-outline-variant bg-transparent active:bg-surface-container',
  ghost: 'bg-transparent active:bg-surface-container',
  destructive: 'bg-error active:opacity-90',
  gold: 'bg-tertiary-fixed-dim active:bg-tertiary-fixed',
};

const variantTextClasses: Record<Variant, string> = {
  default: 'text-on-primary',
  secondary: 'text-on-secondary-container',
  outline: 'text-on-surface',
  ghost: 'text-on-surface',
  destructive: 'text-on-error',
  gold: 'text-tertiary',
};

const sizeClasses: Record<Size, string> = {
  default: 'h-12 px-6',
  sm: 'h-9 px-4',
  lg: 'h-14 px-8',
  icon: 'h-11 w-11',
};

export interface ButtonProps extends PressableProps {
  variant?: Variant;
  size?: Size;
  label?: string;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

/** shadcn-style Button for React Native (NativeWind). */
export function Button({
  variant = 'default',
  size = 'default',
  label,
  icon,
  iconRight,
  loading,
  disabled,
  className,
  textClassName,
  children,
  ...props
}: ButtonProps) {
  const textColor =
    variant === 'default'
      ? '#ffffff'
      : variant === 'secondary'
        ? '#536a51'
        : variant === 'gold'
          ? '#211500'
          : variant === 'destructive'
            ? '#ffffff'
            : '#1b1c19';

  return (
    <Pressable
      disabled={disabled || loading}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50',
        className
      )}
      style={{
        // Subtle shadow for default (filled) buttons
        ...(variant === 'default' || variant === 'destructive' || variant === 'gold'
          ? { shadowColor: '#061b0e', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 }
          : {}),
      }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <Icon name={icon} size={size === 'sm' ? 18 : 20} color={textColor} />}
          {label ? (
            <Text
              className={cn(
                'font-body-semibold text-base',
                size === 'sm' && 'text-sm',
                variantTextClasses[variant],
                textClassName
              )}
            >
              {label}
            </Text>
          ) : (
            children
          )}
          {iconRight && <Icon name={iconRight} size={size === 'sm' ? 18 : 20} color={textColor} />}
        </>
      )}
    </Pressable>
  );
}
