import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { Screen } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';
import { useOrders } from '@/store/orders';
import { useFavorites } from '@/store/favorites';
import { useLoyalty, TIER_LABELS, getPointsToNextTier, getTierProgress } from '@/store/loyalty';
import { api } from '@/api/client';
import { formatPrice } from '@/api/types';
import { sendLocalTestNotification } from '@/lib/notifications';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Profile — member card, loyalty tier, favorites link, rewards, past orders, sign out. */
export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuth();
  const { orders, refresh: refreshOrders } = useOrders();
  const { favorites, refresh: refreshFavorites } = useFavorites();
  const { points, tier, refresh: refreshLoyalty } = useLoyalty();
  const [testingNotification, setTestingNotification] = useState(false);

  useEffect(() => {
    refreshOrders();
    refreshFavorites();
    refreshLoyalty();
  }, []);

  const nextTierPoints = getPointsToNextTier(tier);
  const progress = getTierProgress(points, tier);

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
                {TIER_LABELS[tier]} Member
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

        {/* Loyalty tier progress */}
        <SectionTitle title="Rewards & Tiers" />
        <View className="mx-4 rounded-2xl bg-surface-container-lowest p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-sm text-on-surface-variant">Current Tier</Text>
            <Text className="font-body-semibold text-base text-on-surface">
              {TIER_LABELS[tier]}
            </Text>
          </View>
          {nextTierPoints && (
            <>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="font-body text-sm text-on-surface-variant">
                  Next Tier: {tier === 'bronze' ? 'Silver' : 'Gold'}
                </Text>
                <Text className="font-body-semibold text-sm text-secondary">
                  {nextTierPoints - points} pts away
                </Text>
              </View>
              <View className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container">
                <View
                  className="h-full rounded-full bg-tertiary-fixed-dim"
                  style={{ width: `${Math.max(5, progress * 100)}%` }}
                />
              </View>
            </>
          )}
          {!nextTierPoints && (
            <Text className="mt-2 font-body text-xs text-on-surface-variant">
              You've reached the highest tier! 🎉
            </Text>
          )}
        </View>

        {/* Quick actions */}
        <View className="mx-4 mt-3 gap-3">
          {/* Favorites */}
          <Pressable
            onPress={() => navigation.navigate('Favorites')}
            className="flex-row items-center gap-4 rounded-2xl bg-surface-container-lowest p-4 active:bg-surface-container"
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-error-container">
              <Icon name="favorite" size={22} color="#ba1a1a" />
            </View>
            <View className="flex-1">
              <Text className="font-body-semibold text-base text-on-surface">Favorites</Text>
              <Text className="font-body text-xs text-on-surface-variant">
                {favorites.length} saved product{favorites.length === 1 ? '' : 's'}
              </Text>
            </View>
            <Icon name="chevron_right" size={22} color="#737973" />
          </Pressable>

          {/* Rewards */}
          <Pressable
            onPress={() => navigation.navigate('Rewards')}
            className="flex-row items-center gap-4 rounded-2xl bg-surface-container-lowest p-4 active:bg-surface-container"
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-tertiary-fixed">
              <Icon name="card_giftcard" size={22} color="#211500" />
            </View>
            <View className="flex-1">
              <Text className="font-body-semibold text-base text-on-surface">
                Rewards Catalog
              </Text>
              <Text className="font-body text-xs text-on-surface-variant">
                Redeem points for discounts
              </Text>
            </View>
            <Badge variant="gold" label={`${points} pts`} />
          </Pressable>
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

        {/* Debug: test push notification */}
        <SectionTitle title="Debug" />
        <View className="mx-4 gap-3">
          <Button
            label="Send Test Notification"
            icon="notifications"
            variant="secondary"
            loading={testingNotification}
            onPress={async () => {
              setTestingNotification(true);
              try {
                // Use local notification in Expo Go, backend endpoint in dev build
                if (Constants.executionEnvironment === 'storeClient') {
                  await sendLocalTestNotification();
                  Alert.alert('Local Notification Sent!', 'This is a local notification (Expo Go). For remote push, use a development build.');
                } else {
                  const result = await api.sendTestNotification();
                  Alert.alert('Sent!', result.message);
                }
              } catch (e) {
                Alert.alert('Failed', e instanceof Error ? e.message : 'Could not send notification.');
              } finally {
                setTestingNotification(false);
              }
            }}
          />
        </View>

        <View className="mx-4 mb-10 mt-6 gap-3">
          <Button label="Contact Support" icon="support_agent" variant="outline" onPress={() => {}} />
          <Button label="Sign Out" icon="logout" variant="ghost" onPress={signOut} />
        </View>
      </ScrollView>
    </Screen>
  );
}
