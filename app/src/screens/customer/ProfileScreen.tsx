import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';
import { useOrders } from '@/store/orders';
import { mockRewards } from '@/api/mock';
import { formatPrice } from '@/api/types';

/** Profile — member card, rewards & tiers, past orders, support, sign out. */
export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { orders, refresh } = useOrders();
  const points = 240;
  const nextTierAt = 400;

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Member card */}
        <View className="mx-4 mt-2 rounded-2xl bg-primary p-5">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-container">
              <Icon name="person" size={30} color="#d0e9d4" />
            </View>
            <View className="flex-1">
              <Text className="font-headline text-2xl text-on-primary">
                {user?.name ?? 'Julian Reed'}
              </Text>
              <Text className="font-body text-sm text-on-primary-container">
                Connoisseur Member
              </Text>
            </View>
          </View>
          <View className="mt-4 flex-row items-center gap-2 rounded-full bg-primary-container px-4 py-2.5">
            <Icon name="stars" size={18} color="#e9c176" />
            <Text className="font-body-semibold text-base text-tertiary-fixed-dim">
              {points} Points
            </Text>
          </View>
        </View>

        {/* Rewards & tiers */}
        <SectionTitle title="Rewards &amp; Tiers" />
        <View className="mx-4 rounded-2xl bg-surface-container-lowest p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-sm text-on-surface-variant">Current Tier</Text>
            <Text className="font-body-semibold text-base text-on-surface">Connoisseur</Text>
          </View>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="font-body text-sm text-on-surface-variant">Next Tier: Master</Text>
            <Text className="font-body-semibold text-sm text-secondary">
              {nextTierAt - points} pts away
            </Text>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container">
            <View
              className="h-full rounded-full bg-tertiary-fixed-dim"
              style={{ width: `${(points / nextTierAt) * 100}%` }}
            />
          </View>
        </View>

        <View className="mx-4 mt-3 gap-3">
          {mockRewards.map((r) => (
            <View
              key={r.id}
              className="flex-row items-center gap-4 rounded-2xl bg-surface-container-lowest p-4"
            >
              <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary-container">
                <Icon name={r.icon as IconName} size={22} color="#4d644b" />
              </View>
              <View className="flex-1">
                <Text className="font-body-semibold text-base text-on-surface">{r.title}</Text>
                <Text className="font-body text-xs text-on-surface-variant">{r.subtitle}</Text>
              </View>
              <Button
                label={r.points ? 'Redeem Now' : 'View Details'}
                size="sm"
                variant={r.points && points >= r.points ? 'gold' : 'outline'}
                onPress={() => {}}
              />
            </View>
          ))}
        </View>

        {/* Past orders */}
        <SectionTitle title="Past Orders" action="View All" />
        <View className="mx-4 gap-3">
          {orders.slice(0, 3).map((o) => (
            <View
              key={o.id}
              className="flex-row items-center gap-4 rounded-2xl bg-surface-container-lowest p-4"
            >
              <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                <Icon name="receipt_long" size={22} color="#4d644b" />
              </View>
              <View className="flex-1">
                <Text className="font-body-semibold text-base text-on-surface">
                  Order #{o.id}
                </Text>
                <Text className="font-body text-xs text-on-surface-variant">
                  {new Date(o.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View className="items-end gap-1">
                <Text className="font-body-semibold text-base text-on-surface">
                  {formatPrice(o.total)}
                </Text>
                <Badge variant="secondary" label="Delivered" />
              </View>
            </View>
          ))}
        </View>

        <View className="mx-4 mb-10 mt-6 gap-3">
          <Button label="Contact Support" icon="support_agent" variant="outline" onPress={() => {}} />
          <Button label="Sign Out" icon="logout" variant="ghost" onPress={signOut} />
        </View>
      </ScrollView>
    </Screen>
  );
}
