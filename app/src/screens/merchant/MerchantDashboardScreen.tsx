import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Merchant home — approval status banner + quick actions + today snapshot. */
export function MerchantDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuth((s) => s.user);
  // In production this comes from GET /merchants/me — mock mode treats new signups as pending.
  const status: 'pending' | 'approved' = 'pending';

  return (
    <Screen>
      <AppHeader />
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Headline className="mt-2">{user?.name ?? 'Your Dispensary'}</Headline>

        {/* Approval gate banner */}
        <View className="mt-4 flex-row items-start gap-3 rounded-2xl bg-tertiary-fixed p-4">
          <Icon name="pending" size={22} color="#211500" />
          <View className="flex-1">
            <Text className="font-body-semibold text-base text-tertiary">
              {status === 'pending' ? 'License review in progress' : 'Live'}
            </Text>
            <Text className="mt-0.5 font-body text-sm leading-5 text-tertiary">
              {status === 'pending'
                ? 'Your shop is hidden from customers until an admin approves your license. You can still build your menu below.'
                : 'Your shop is visible to customers.'}
            </Text>
          </View>
          <Badge variant="gold" label={status === 'pending' ? 'Pending' : 'Approved'} />
        </View>

        {/* Today snapshot */}
        <SectionTitle title="Today" />
        <View className="flex-row gap-3">
          <Stat label="Orders" value="12" />
          <Stat label="Revenue" value="$1,840" />
          <Stat label="Low Stock" value="3" />
        </View>

        {/* Quick actions */}
        <SectionTitle title="Manage" />
        <View className="mb-8 gap-3">
          <ActionRow
            icon="inventory"
            title="Inventory"
            subtitle="Add, edit, and stock your products"
            onPress={() => navigation.navigate('MerchantTabs', { screen: 'Inventory' })}
          />
          <ActionRow
            icon="receipt_long"
            title="Order Queue"
            subtitle="Accept, reject, and fulfill incoming orders"
            onPress={() => navigation.navigate('MerchantTabs', { screen: 'OrderQueue' })}
          />
          <ActionRow
            icon="schedule"
            title="Sales Analytics"
            subtitle="Orders per day and top products"
            onPress={() => navigation.navigate('MerchantTabs', { screen: 'Analytics' })}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-surface-container-lowest p-4">
      <Text className="font-body text-xs uppercase tracking-widest text-on-surface-variant">
        {label}
      </Text>
      <Text className="mt-1 font-headline text-2xl text-primary">{value}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-2xl bg-surface-container-lowest p-4 active:bg-surface-container"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary-container">
        <Icon name={icon} size={22} color="#4d644b" />
      </View>
      <View className="flex-1">
        <Text className="font-body-semibold text-base text-on-surface">{title}</Text>
        <Text className="font-body text-xs text-on-surface-variant">{subtitle}</Text>
      </View>
      <Icon name="chevron_right" size={22} color="#737973" />
    </Pressable>
  );
}
