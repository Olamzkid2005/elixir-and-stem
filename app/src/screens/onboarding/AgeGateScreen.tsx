import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';

/** Age Verification screen — matches design reference (centered card, 21+ gate). */
export function AgeGateScreen() {
  const setAgeVerified = useAuth((s) => s.setAgeVerified);

  return (
    <Screen edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-8 h-20 w-20 items-center justify-center rounded-full bg-secondary-container">
          <Icon name="local_florist" size={40} color="#4d644b" />
        </View>
        <Text className="mb-2 text-center font-headline text-[32px] leading-10 text-on-surface">
          Elixir &amp; Stem
        </Text>
        <Text className="mb-10 text-center font-body text-base text-on-surface-variant">
          Please verify your age to enter.
        </Text>

        <Button
          label="I am 21 or older"
          className="mb-3 w-full"
          size="lg"
          onPress={() => setAgeVerified(true)}
        />
        <Button
          label="I am under 21"
          variant="outline"
          className="w-full"
          size="lg"
          onPress={() => {
            // Under-21 users stay locked out by design.
          }}
        />

        <Text className="mt-10 text-center font-body text-xs leading-5 text-on-surface-variant">
          By entering this site, you agree to our{' '}
          <Text className="font-body-semibold text-secondary">Terms of Service</Text> and{' '}
          <Text className="font-body-semibold text-secondary">Privacy Policy</Text>. Products are
          for adult use only.
        </Text>
      </View>
    </Screen>
  );
}
