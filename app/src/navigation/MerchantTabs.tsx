import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MerchantTabParamList, MerchantDrawerParamList } from './types';
import { Icon, type IconName } from '@/components/ui/Icon';
import { DrawerContent } from './DrawerContent';
import { MerchantDashboardScreen } from '@/screens/merchant/MerchantDashboardScreen';
import { InventoryScreen } from '@/screens/merchant/InventoryScreen';
import { OrderQueueScreen } from '@/screens/merchant/OrderQueueScreen';
import { AnalyticsScreen } from '@/screens/merchant/AnalyticsScreen';
import { MerchantProfileScreen } from '@/screens/merchant/MerchantProfileScreen';

const Tab = createBottomTabNavigator<MerchantTabParamList>();
const Drawer = createDrawerNavigator<MerchantDrawerParamList>();

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

function MerchantTabNavigator() {
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
          paddingTop: 6,
          paddingBottom: Math.max(bottom, 12),
        },
        tabBarLabel: ({ color, focused }) => (
          <View className="items-center">
            <Text
              style={{ color }}
              className={`font-body-semibold text-[10px] ${focused ? 'opacity-100' : 'opacity-70'}`}
            >
              {tabLabels[route.name]}
            </Text>
            {focused && (
              <View className="mt-1 h-1 w-1 rounded-full bg-primary" />
            )}
          </View>
        ),
        tabBarIcon: ({ color }) => <Icon name={tabIcons[route.name]} size={22} color={color} />,
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

export function MerchantTabs() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#fbf9f4',
          width: 300,
        },
        overlayColor: 'rgba(0,0,0,0.4)',
      }}
    >
      <Drawer.Screen name="Tabs" component={MerchantTabNavigator} />
    </Drawer.Navigator>
  );
}
