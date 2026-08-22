import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Icon } from './Icon';

/**
 * FavoriteButton — heart toggle with scale pop + color transition.
 * Adapted from transitions.dev like-button pattern.
 *
 * Usage: <FavoriteButton isFavorite={false} onToggle={() => {}} />
 */

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
  className?: string;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = 22,
  className,
}: FavoriteButtonProps) {
  const scale = useSharedValue(1);
  const fillProgress = useSharedValue(isFavorite ? 1 : 0);

  React.useEffect(() => {
    fillProgress.value = withSpring(isFavorite ? 1 : 0, {
      damping: 12,
      stiffness: 200,
    });
  }, [isFavorite, fillProgress]);

  const handlePress = useCallback(() => {
    // Pop animation
    scale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onToggle();
  }, [onToggle, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress} hitSlop={8} className={className}>
      <Animated.View style={animatedStyle}>
        <Icon
          name={isFavorite ? 'favorite' : 'favorite_border'}
          size={size}
          color={isFavorite ? '#ba1a1a' : '#1b1c19'}
        />
      </Animated.View>
    </Pressable>
  );
}
