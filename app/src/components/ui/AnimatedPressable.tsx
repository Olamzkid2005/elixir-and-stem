import React, { useCallback } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressableImpl = Animated.createAnimatedComponent(Pressable);

/**
 * AnimatedPressable — spring scale on press.
 * Adapted from transitions.dev card-press pattern.
 */

interface Props extends PressableProps {
  springScale?: number;
  springConfig?: { damping?: number; stiffness?: number; mass?: number };
  children?: React.ReactNode;
}

export function AnimatedPressable({
  springScale = 0.97,
  springConfig = { damping: 15, stiffness: 150, mass: 0.8 },
  children,
  onPressIn,
  onPressOut,
  style,
  ...props
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(springScale, springConfig);
    onPressIn?.({} as any);
  }, [springScale, springConfig, onPressIn]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200, mass: 0.5 });
    onPressOut?.({} as any);
  }, [onPressOut]);

  return (
    <AnimatedPressableImpl
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style] as any}
      {...props}
    >
      {children}
    </AnimatedPressableImpl>
  );
}
