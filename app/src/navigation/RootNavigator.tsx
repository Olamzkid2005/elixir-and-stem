import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useAuth } from '@/store/auth';
import { CustomerTabs } from './CustomerTabs';
import { MerchantTabs } from './MerchantTabs';
import { AgeGateScreen } from '@/screens/onboarding/AgeGateScreen';
import { RoleSelectScreen } from '@/screens/onboarding/RoleSelectScreen';
import { SignInScreen } from '@/screens/auth/SignInScreen';
import { MerchantOnboardingScreen } from '@/screens/merchant/MerchantOnboardingScreen';
import { ProductDetailScreen } from '@/screens/customer/ProductDetailScreen';
import { CheckoutScreen } from '@/screens/customer/CheckoutScreen';
import { OrderTrackingScreen } from '@/screens/customer/OrderTrackingScreen';
import { ProductFormScreen } from '@/screens/merchant/ProductFormScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { ageVerified, user, role } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!ageVerified ? (
        <Stack.Screen name="AgeGate" component={AgeGateScreen} />
      ) : !user ? (
        <>
          <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="MerchantOnboarding" component={MerchantOnboardingScreen} />
        </>
      ) : role === 'merchant' ? (
        <>
          <Stack.Screen name="MerchantTabs" component={MerchantTabs} />
          <Stack.Screen name="ProductForm" component={ProductFormScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
