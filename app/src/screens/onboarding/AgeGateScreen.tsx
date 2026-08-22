import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';

export function AgeGateScreen() {
  const setAgeVerified = useAuth((s) => s.setAgeVerified);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Screen edges={['top', 'bottom']}>
      <View className="absolute inset-0 bg-primary" />

      {/* Decorative circles */}
      <View style={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(77,100,75,0.15)' }} />
      <View style={{ position: 'absolute', bottom: 120, left: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(77,100,75,0.12)' }} />
      <View style={{ position: 'absolute', top: '40%', right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(233,193,118,0.08)' }} />

      {/* Layout wrapper — plain View handles flex, Animated.View only handles opacity */}
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View style={{ opacity }}>
          <View className="items-center">
            <View className="mb-8 h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Icon name="local_florist" size={48} color="#cfeaca" />
            </View>

            <Text className="mb-2 text-center font-headline-bold text-[36px] leading-tight text-white">
              Elixir &amp; Stem
            </Text>

            <View className="my-4 flex-row items-center gap-3">
              <View className="h-px w-12 bg-white/20" />
              <View className="h-1.5 w-1.5 rounded-full bg-tertiary-fixed-dim" />
              <View className="h-px w-12 bg-white/20" />
            </View>

            <Text className="mb-2 text-center font-body text-base leading-6 text-white/70">
              Premium Cannabis Delivery
            </Text>
            <Text className="mb-12 text-center font-body text-sm leading-5 text-white/50">
              Please verify your age to enter.
            </Text>

            <View className="w-full">
              <Button label="I am 21 or older" className="mb-3" size="lg" onPress={() => setAgeVerified(true)} />
              <Button label="I am under 21" variant="outline" size="lg" onPress={() => {}} />
            </View>

            <Text className="mt-10 text-center font-body text-[11px] leading-4 text-white/40">
              By entering this site, you agree to our{' '}
              <Text className="font-body-semibold text-white/60">Terms of Service</Text> and{' '}
              <Text className="font-body-semibold text-white/60">Privacy Policy</Text>. Products are for adult use only.
            </Text>
          </View>
        </Animated.View>
      </View>
    </Screen>
  );
}
