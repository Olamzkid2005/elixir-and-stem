import React from 'react';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './ui/Icon';
import { cn } from '@/lib/utils';

/**
 * Top app bar — frosted glass effect with subtle gradient.
 * menu (or back) | ELIXIR & STEM wordmark | notifications
 */
export function AppHeader({ back = false }: { back?: boolean }) {
  const navigation = useNavigation();
  const { top } = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: top }}
      className="border-b border-outline-variant/30"
    >
      <View className="h-14 flex-row items-center justify-between px-2">
        {back ? (
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-surface-container-high"
          >
            <Icon name="arrow_back" size={24} color="#1b1c19" />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={12}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-surface-container-high"
          >
            <Icon name="menu" size={24} color="#1b1c19" />
          </Pressable>
        )}

        {/* Brand wordmark — centered with decorative dots */}
        <View className="flex-row items-center gap-2">
          <View className="h-1.5 w-1.5 rounded-full bg-primary" />
          <Text className="font-headline-bold text-sm uppercase tracking-[0.2em] text-primary">
            Elixir &amp; Stem
          </Text>
          <View className="h-1.5 w-1.5 rounded-full bg-primary" />
        </View>

        <Pressable
          hitSlop={12}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-surface-container-high"
        >
          <Icon name="notifications" size={24} color="#1b1c19" />
        </Pressable>
      </View>
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
      <View className="flex-row items-center gap-2">
        <View className="h-5 w-1 rounded-full bg-primary" />
        <Text className="font-headline text-xl text-on-surface">{title}</Text>
      </View>
      {action && (
        <Pressable onPress={onAction}>
          <Text className="font-body-semibold text-sm text-secondary">{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
