import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

/**
 * SlidingTab — animated indicator pill that slides between tab options.
 * Adapted from transitions.dev tabs-sliding pattern.
 *
 * Usage: <SlidingTab tabs={['List', 'Map']} selectedIndex={0} onSelect={setMode} />
 */

interface Tab {
  label: string;
  icon?: IconName;
}

interface SlidingTabProps {
  tabs: (string | Tab)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

export function SlidingTab({ tabs, selectedIndex, onSelect, className }: SlidingTabProps) {
  const progress = useSharedValue(selectedIndex);

  React.useEffect(() => {
    progress.value = withSpring(selectedIndex, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
  }, [selectedIndex, progress]);

  return (
    <View
      className={cn(
        'flex-row rounded-full bg-surface-container p-1',
        className
      )}
    >
      {tabs.map((tab, i) => {
        const label = typeof tab === 'string' ? tab : tab.label;
        const icon = typeof tab === 'object' ? tab.icon : undefined;
        const isSelected = i === selectedIndex;

        return (
          <Pressable
            key={label}
            onPress={() => onSelect(i)}
            className={cn(
              'flex-1 items-center justify-center rounded-full py-2.5',
              isSelected && 'bg-surface-container-lowest shadow-elevation-1'
            )}
            style={{ elevation: isSelected ? 1 : 0 }}
          >
            <View className="flex-row items-center gap-1.5">
              {icon && (
                <Icon
                  name={icon}
                  size={16}
                  color={isSelected ? '#061b0e' : '#737973'}
                />
              )}
              <Text
                className={cn(
                  'font-body-semibold text-sm',
                  isSelected ? 'text-on-surface' : 'text-on-surface-variant'
                )}
              >
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
