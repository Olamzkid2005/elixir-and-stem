import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelect'>;

/** "Continue as Customer" / "Continue as Merchant" — premium card design. */
export function RoleSelectScreen({ navigation }: Props) {
  const setRole = useAuth((s) => s.setRole);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const choose = (role: 'customer' | 'merchant') => {
    setRole(role);
    navigation.navigate('SignIn');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="flex-1 justify-center px-6"
      >
        {/* Brand mark */}
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Icon name="local_florist" size={28} color="#ffffff" />
        </View>

        <Headline className="mb-2">Welcome to{'\n'}Elixir &amp; Stem</Headline>
        <Text className="mb-10 font-body text-base text-on-surface-variant">
          How would you like to continue?
        </Text>

        {/* Customer card */}
        <Pressable
          onPress={() => choose('customer')}
          className="mb-4 flex-row items-center justify-between rounded-3xl bg-surface-container-lowest p-5 shadow-elevation-2 active:scale-[0.98]"
          style={{ elevation: 2 }}
        >
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Icon name="person" size={26} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="font-headline text-lg text-on-surface">Continue as Customer</Text>
              <Text className="mt-0.5 font-body text-sm text-on-surface-variant">
                Browse licensed dispensaries &amp; order delivery
              </Text>
            </View>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container">
            <Icon name="chevron_right" size={22} color="#737973" />
          </View>
        </Pressable>

        {/* Merchant card */}
        <Pressable
          onPress={() => choose('merchant')}
          className="flex-row items-center justify-between rounded-3xl bg-surface-container-lowest p-5 shadow-elevation-2 active:scale-[0.98]"
          style={{ elevation: 2 }}
        >
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-tertiary-fixed-dim">
              <Icon name="storefront" size={26} color="#211500" />
            </View>
            <View className="flex-1">
              <Text className="font-headline text-lg text-on-surface">Continue as Merchant</Text>
              <Text className="mt-0.5 font-body text-sm text-on-surface-variant">
                List your licensed dispensary &amp; manage orders
              </Text>
            </View>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container">
            <Icon name="chevron_right" size={22} color="#737973" />
          </View>
        </Pressable>

        <Text className="mt-8 text-center font-body text-xs leading-4 text-on-surface-variant">
          Merchants must hold a valid state license and complete verification before going live.
        </Text>
      </Animated.View>
    </Screen>
  );
}
