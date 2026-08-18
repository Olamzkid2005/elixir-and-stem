import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MerchantTabParamList } from './types';
import { Icon, type IconName } from '@/components/ui/Icon';
import { MerchantDashboardScreen } from '@/screens/merchant/MerchantDashboardScreen';
import { InventoryScreen } from '@/screens/merchant/InventoryScreen';
import { OrderQueueScreen } from '@/screens/merchant/OrderQueueScreen';
import { AnalyticsScreen } from '@/screens/merchant/AnalyticsScreen';
import { MerchantProfileScreen } from '@/screens/merchant/MerchantProfileScreen';

const Tab = createBottomTabNavigator<MerchantTabParamList>();

const tabIcons: Record<keyof MerchantTabParamList, IconName> = {
  Dashboard: 'dashboard',
  Inventory: 'inventory',
  OrderQueue: 'receipt_long',
  Analytics: 'schedule',
  MerchantProfile: 'storefront',
};

const tabLabels: Record<keyof MerchantTabParamList, string> = {
  Dashboard: 'Home',
  Inventory: 'Products',
  OrderQueue: 'Orders',
  Analytics: 'Sales',
  MerchantProfile: 'Shop',
};

export function MerchantTabs() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#061b0e',
        tabBarInactiveTintColor: '#737973',
        tabBarStyle: {
          backgroundColor: '#fbf9f4',
          borderTopColor: '#c3c8c1',
          paddingTop: 8,
          paddingBottom: Math.max(bottom, 14),
        },
        tabBarLabel: ({ color }) => (
          <Text style={{ color }} className="font-body-semibold text-[11px]">
            {tabLabels[route.name]}
          </Text>
        ),
        tabBarIcon: ({ color }) => <Icon name={tabIcons[route.name]} size={24} color={color} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={MerchantDashboardScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="OrderQueue" component={OrderQueueScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="MerchantProfile" component={MerchantProfileScreen} />
    </Tab.Navigator>
  );
}
