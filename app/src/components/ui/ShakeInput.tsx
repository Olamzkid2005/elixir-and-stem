import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';
import { TextInput, type TextInputProps } from 'react-native';

/**
 * ShakeInput — input field that shakes on error.
 * Adapted from transitions.dev error-state-shake pattern.
 *
 * Usage: <ShakeInput error="Email is required" ... />
 */

export interface ShakeInputProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  error?: string;
  className?: string;
  rightSlot?: React.ReactNode;
}

export function ShakeInput({
  label,
  icon,
  error,
  className,
  rightSlot,
  ...props
}: ShakeInputProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const prevError = useRef(error);

  useEffect(() => {
    if (error && error !== prevError.current) {
      // Shake sequence
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      // Border color flash
      Animated.sequence([
        Animated.timing(borderAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
        Animated.timing(borderAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();
    }
    prevError.current = error;
  }, [error, shakeAnim, borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#c3c8c1', '#ba1a1a'],
  });

  return (
    <View className={cn('gap-2', className)}>
      {label && (
        <Text className="font-body-semibold text-[10px] uppercase tracking-widest text-on-surface-variant">
          {label}
        </Text>
      )}
      <Animated.View
        style={{ transform: [{ translateX: shakeAnim }], borderColor }}
        className={cn(
          'h-14 flex-row items-center gap-3 rounded-2xl border-2 bg-surface-container-lowest px-4'
        )}
      >
        {icon && <Icon name={icon} size={20} color="#737973" />}
        <TextInput
          placeholderTextColor="#737973"
          className="flex-1 font-body text-base text-on-surface"
          {...props}
        />
        {rightSlot}
      </Animated.View>
      {error && (
        <View className="flex-row items-center gap-1">
          <Icon name="error" size={14} color="#ba1a1a" />
          <Text className="font-body text-xs text-error">{error}</Text>
        </View>
      )}
    </View>
  );
}
