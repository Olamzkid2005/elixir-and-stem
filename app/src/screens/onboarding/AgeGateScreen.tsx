import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Age Verification — premium botanical atmosphere.
 * First screen the user sees. Sets the brand tone.
 */
export function AgeGateScreen() {
  const setAgeVerified = useAuth((s) => s.setAgeVerified);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 6,
        tension: 30,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Atmospheric gradient background */}
      <View className="absolute inset-0 bg-primary" />

      {/* Decorative circle patterns — subtle botanical feel */}
      <View
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: 'rgba(77,100,75,0.15)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 120,
          left: -40,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: 'rgba(77,100,75,0.12)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '40%',
          right: -20,
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: 'rgba(233,193,118,0.08)',
        }}
      />

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="flex-1 items-center justify-center px-8"
      >
        {/* Logo mark */}
        <Animated.View
          style={{ transform: [{ scale: iconScale }] }}
          className="mb-8"
        >
          <View className="h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Icon name="local_florist" size={48} color="#cfeaca" />
          </View>
        </Animated.View>

        {/* Brand name */}
        <Text className="mb-2 text-center font-headline-bold text-[36px] leading-tight text-white">
          Elixir &amp; Stem
        </Text>

        {/* Decorative divider */}
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

        {/* Action buttons */}
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

        {/* Legal text */}
        <Text className="mt-10 text-center font-body text-[11px] leading-4 text-white/40">
          By entering this site, you agree to our{' '}
          <Text className="font-body-semibold text-white/60">Terms of Service</Text> and{' '}
          <Text className="font-body-semibold text-white/60">Privacy Policy</Text>. Products are
          for adult use only.
        </Text>
      </Animated.View>
    </Screen>
  );
}
