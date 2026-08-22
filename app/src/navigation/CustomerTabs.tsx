import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CustomerTabParamList, CustomerDrawerParamList } from './types';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { DrawerContent } from './DrawerContent';
import { HomeScreen } from '@/screens/customer/HomeScreen';
import { BrowseScreen } from '@/screens/customer/BrowseScreen';
import { CartScreen } from '@/screens/customer/CartScreen';
import { OrdersScreen } from '@/screens/customer/OrdersScreen';
import { ProfileScreen } from '@/screens/customer/ProfileScreen';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Drawer = createDrawerNavigator<CustomerDrawerParamList>();

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

function CustomerTabNavigator() {
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const { bottom } = useSafeAreaInsets();
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
          paddingTop: 6,
          paddingBottom: Math.max(bottom, 12),
          height: undefined,
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
        tabBarIcon: ({ color, focused }) => (
          <View className="items-center">
            <Icon name={tabIcons[route.name]} size={22} color={color} />
            {route.name === 'Cart' && (
              <AnimatedBadge
                count={cartCount}
                className="absolute -right-2 -top-1"
              />
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

export function CustomerTabs() {
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
      <Drawer.Screen name="Tabs" component={CustomerTabNavigator} />
    </Drawer.Navigator>
  );
}
