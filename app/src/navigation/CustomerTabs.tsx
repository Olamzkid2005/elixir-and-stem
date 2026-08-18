import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { CustomerTabParamList } from './types';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useCart } from '@/store/cart';
import { HomeScreen } from '@/screens/customer/HomeScreen';
import { BrowseScreen } from '@/screens/customer/BrowseScreen';
import { CartScreen } from '@/screens/customer/CartScreen';
import { OrdersScreen } from '@/screens/customer/OrdersScreen';
import { ProfileScreen } from '@/screens/customer/ProfileScreen';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

const tabIcons: Record<keyof CustomerTabParamList, IconName> = {
  Home: 'home',
  Browse: 'search',
  Cart: 'shopping_bag',
  Orders: 'receipt_long',
  Profile: 'person',
};

const tabLabels: Record<keyof CustomerTabParamList, string> = {
  Home: 'Home',
  Browse: 'Browse',
  Cart: 'Cart',
  Orders: 'Orders',
  Profile: 'Profile',
};

export function CustomerTabs() {
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#061b0e',
        tabBarInactiveTintColor: '#737973',
        tabBarStyle: {
          backgroundColor: '#fbf9f4',
          borderTopColor: '#c3c8c1',
          height: 76,
          paddingBottom: 14,
          paddingTop: 8,
        },
        tabBarLabel: ({ color, focused }) => (
          <Text
            style={{ color }}
            className={`font-body-semibold text-[11px] ${focused ? '' : 'opacity-80'}`}
          >
            {tabLabels[route.name]}
          </Text>
        ),
        tabBarIcon: ({ color }) => (
          <View>
            <Icon name={tabIcons[route.name]} size={24} color={color} />
            {route.name === 'Cart' && cartCount > 0 && (
              <View className="absolute -right-2 -top-1 h-4 min-w-4 items-center justify-center rounded-full bg-error px-1">
                <Text className="font-body-semibold text-[9px] text-on-error">{cartCount}</Text>
              </View>
            )}
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Browse" component={BrowseScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
