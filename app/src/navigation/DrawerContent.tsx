import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import type { RootStackParamList } from './types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface DrawerItemProps {
  icon: IconName;
  label: string;
  badge?: number;
  onPress: () => void;
  active?: boolean;
}

function DrawerItem({ icon, label, badge, onPress, active }: DrawerItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-1 flex-row items-center gap-3 rounded-2xl px-4 py-3 ${
        active ? 'bg-primary-container' : 'active:bg-surface-container'
      }`}
    >
      <View className={`h-9 w-9 items-center justify-center rounded-xl ${
        active ? 'bg-primary' : 'bg-surface-container'
      }`}>
        <Icon name={icon} size={20} color={active ? '#ffffff' : '#4d644b'} />
      </View>
      <Text
        className={`flex-1 text-[15px] ${
          active ? 'font-headline text-primary' : 'font-body-semibold text-on-surface'
        }`}
      >
        {label}
      </Text>
      {badge !== undefined && badge > 0 && (
        <View className="h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5">
          <Text className="font-body-semibold text-[10px] text-on-error">{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

function Divider() {
  return <View className="mx-4 my-3 h-px bg-outline-variant" />;
}

/**
 * Shared drawer content used by both Customer and Merchant drawer navigators.
 */
export function DrawerContent(props: any) {
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuth();
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const isMerchant = user?.role === 'merchant';

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, paddingTop: 0 }}
      style={{ backgroundColor: '#fbf9f4' }}
    >
      {/* Profile header — premium card */}
      <View className="mx-4 mt-12 mb-2 overflow-hidden rounded-3xl bg-surface-container-lowest shadow-elevation-1" style={{ elevation: 1 }}>
        <View className="h-1 bg-primary/20" />
        <View className="flex-row items-center gap-3 p-4">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Icon name="person" size={22} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="font-headline text-base text-on-surface">
              {isMerchant ? 'Merchant' : 'Welcome back'}
            </Text>
            <Text className="font-body text-xs text-on-surface-variant" numberOfLines={1}>
              {user?.email ?? 'Guest'}
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View className="mt-2 px-3">
        <DrawerItem
          icon="home"
          label="Home"
          onPress={() => props.navigation.closeDrawer()}
        />
        <DrawerItem
          icon="search"
          label="Browse Menu"
          onPress={() => props.navigation.closeDrawer()}
        />
        <DrawerItem
          icon="shopping_bag"
          label="Cart"
          badge={cartCount}
          onPress={() => props.navigation.closeDrawer()}
        />
        <DrawerItem
          icon="receipt_long"
          label="My Orders"
          onPress={() => props.navigation.closeDrawer()}
        />
      </View>

      <Divider />

      {/* Account */}
      <View className="px-3">
        <DrawerItem
          icon="person"
          label="Profile"
          onPress={() => props.navigation.closeDrawer()}
        />
        <DrawerItem
          icon="favorite"
          label="Favorites"
          onPress={() => {
            props.navigation.closeDrawer();
            navigation.navigate('Favorites');
          }}
        />
        <DrawerItem
          icon="stars"
          label="Rewards"
          onPress={() => {
            props.navigation.closeDrawer();
            navigation.navigate('Rewards');
          }}
        />
      </View>

      {isMerchant && (
        <>
          <Divider />
          <View className="px-3">
            <DrawerItem
              icon="dashboard"
              label="Merchant Dashboard"
              onPress={() => {
                props.navigation.closeDrawer();
                // @ts-ignore — navigation.navigate works fine at runtime
                navigation.navigate('MerchantTabs');
              }}
            />
            {user?.role === 'admin' && (
              <DrawerItem
                icon="admin_panel_settings"
                label="Admin Dashboard"
                onPress={() => {
                  props.navigation.closeDrawer();
                  navigation.navigate('AdminDashboard');
                }}
              />
            )}
          </View>
        </>
      )}

      {/* Spacer */}
      <View className="flex-1" />

      {/* Sign out */}
      <View className="mx-3 mb-8">
        <DrawerItem
          icon="logout"
          label="Sign Out"
          onPress={() => {
            props.navigation.closeDrawer();
            signOut();
          }}
        />
      </View>
    </DrawerContentScrollView>
  );
}
