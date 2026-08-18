import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from './ui/Icon';
import { cn } from '@/lib/utils';

/**
 * Top app bar from the design reference:
 * menu (or back) | ELIXIR & STEM wordmark | notifications
 */
export function AppHeader({ back = false }: { back?: boolean }) {
  const navigation = useNavigation();
  return (
    <View className="h-14 flex-row items-center justify-between px-2">
      {back ? (
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <Icon name="arrow_back" size={24} color="#1b1c19" />
        </Pressable>
      ) : (
        <Pressable hitSlop={12} className="h-11 w-11 items-center justify-center rounded-full">
          <Icon name="menu" size={24} color="#1b1c19" />
        </Pressable>
      )}
      <Text className="font-headline-bold text-sm uppercase tracking-[0.2em] text-primary">
        Elixir &amp; Stem
      </Text>
      <Pressable hitSlop={12} className="h-11 w-11 items-center justify-center rounded-full">
        <Icon name="notifications" size={24} color="#1b1c19" />
      </Pressable>
    </View>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
  className,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <View className={cn('mb-3 mt-6 flex-row items-baseline justify-between px-4', className)}>
      <Text className="font-headline text-xl text-on-surface">{title}</Text>
      {action && (
        <Pressable onPress={onAction}>
          <Text className="font-body-semibold text-sm text-secondary">{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
