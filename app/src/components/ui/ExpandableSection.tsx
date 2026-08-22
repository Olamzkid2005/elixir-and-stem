import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Icon } from './Icon';
import { cn } from '@/lib/utils';

/**
 * ExpandableSection — accordion expand/collapse with height animation.
 * Adapted from transitions.dev accordion-expand pattern.
 *
 * Usage:
 * <ExpandableSection title="Reviews (5)">
 *   <ReviewList />
 * </ExpandableSection>
 */

interface ExpandableSectionProps {
  title: string;
  icon?: string;
  initiallyOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ExpandableSection({
  title,
  icon,
  initiallyOpen = false,
  children,
  className,
}: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useRef(new Animated.Value(initiallyOpen ? 1 : 0)).current;
  const chevronAnim = useRef(new Animated.Value(initiallyOpen ? 1 : 0)).current;

  const toggle = useCallback(() => {
    const toValue = isOpen ? 0 : 1;
    setIsOpen(!isOpen);

    Animated.parallel([
      Animated.spring(animatedHeight, {
        toValue,
        damping: 15,
        stiffness: 150,
        mass: 0.8,
        useNativeDriver: false,
      }),
      Animated.timing(chevronAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, animatedHeight, chevronAnim]);

  const rotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const height = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  return (
    <View className={cn('overflow-hidden', className)}>
      <Pressable
        onPress={toggle}
        className="flex-row items-center justify-between rounded-2xl bg-surface-container-lowest p-4"
      >
        <View className="flex-row items-center gap-2">
          {icon && <Icon name={icon as any} size={20} color="#4d644b" />}
          <Text className="font-body-semibold text-base text-on-surface">{title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon name="expand_more" size={22} color="#737973" />
        </Animated.View>
      </Pressable>

      <Animated.View style={{ height, overflow: 'hidden' }}>
        <View
          onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
          className="pt-3"
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}
