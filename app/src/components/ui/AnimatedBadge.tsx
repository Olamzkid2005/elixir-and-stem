import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

/**
 * AnimatedBadge — badge with number pop-in animation when count changes.
 * Adapted from transitions.dev number-pop-in pattern.
 *
 * Usage: <AnimatedBadge count={3} />
 */

interface AnimatedBadgeProps {
  count: number;
  className?: string;
}

export function AnimatedBadge({ count, className }: AnimatedBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current && count > 0) {
      // Pop in
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          damping: 8,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 10,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (count > 0) {
      scaleAnim.setValue(1);
    }
    prevCount.current = count;
  }, [count, scaleAnim]);

  if (count <= 0) return null;

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
      className={className}
    >
      <View className="h-4 min-w-4 items-center justify-center rounded-full bg-error px-1">
        <Text className="font-body-semibold text-[9px] text-on-error">
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    </Animated.View>
  );
}
