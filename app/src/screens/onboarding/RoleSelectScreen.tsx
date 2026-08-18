import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelect'>;

/** "Continue as Customer" / "Continue as Merchant" onboarding split. */
export function RoleSelectScreen({ navigation }: Props) {
  const setRole = useAuth((s) => s.setRole);

  const choose = (role: 'customer' | 'merchant') => {
    setRole(role);
    navigation.navigate('SignIn');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View className="flex-1 justify-center px-6">
        <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-secondary-container">
          <Icon name="local_florist" size={28} color="#4d644b" />
        </View>
        <Headline className="mb-2">Welcome to{'\n'}Elixir &amp; Stem</Headline>
        <Text className="mb-10 font-body text-base text-on-surface-variant">
          How would you like to continue?
        </Text>

        <Pressable
          onPress={() => choose('customer')}
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-surface-container-lowest p-5 active:bg-surface-container"
        >
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Icon name="person" size={24} color="#ffffff" />
            </View>
            <View>
              <Text className="font-headline text-lg text-on-surface">Continue as Customer</Text>
              <Text className="font-body text-sm text-on-surface-variant">
                Browse licensed dispensaries &amp; order delivery
              </Text>
            </View>
          </View>
          <Icon name="chevron_right" size={24} color="#737973" />
        </Pressable>

        <Pressable
          onPress={() => choose('merchant')}
          className="flex-row items-center justify-between rounded-2xl bg-surface-container-lowest p-5 active:bg-surface-container"
        >
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-tertiary-fixed-dim">
              <Icon name="storefront" size={24} color="#211500" />
            </View>
            <View>
              <Text className="font-headline text-lg text-on-surface">Continue as Merchant</Text>
              <Text className="font-body text-sm text-on-surface-variant">
                List your licensed dispensary &amp; manage orders
              </Text>
            </View>
          </View>
          <Icon name="chevron_right" size={24} color="#737973" />
        </Pressable>

        <Text className="mt-10 text-center font-body text-xs text-on-surface-variant">
          Merchants must hold a valid state license and complete verification before going live.
        </Text>
      </View>
    </Screen>
  );
}
