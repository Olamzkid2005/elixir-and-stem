import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatPrice } from '@/api/types';
import {
  useLoyalty,
  TIER_LABELS,
  TIER_THRESHOLDS,
  getPointsToNextTier,
  getTierProgress,
} from '@/store/loyalty';

/** RewardsScreen — points balance, tier progress, redeemable rewards, transaction history. */
export function RewardsScreen() {
  const { points, tier, transactions, rewards, refresh, loadRewards, redeem } = useLoyalty();
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    loadRewards();
  }, []);

  const nextTierPoints = getPointsToNextTier(tier);
  const progress = getTierProgress(points, tier);

  const handleRedeem = async (reward: typeof rewards[0]) => {
    if (points < reward.points) {
      Alert.alert('Not enough points', `You need ${reward.points - points} more points to redeem this.`);
      return;
    }
    setRedeeming(reward.id);
    const result = await redeem(reward);
    setRedeeming(null);
    if (result.ok) {
      Alert.alert('Redeemed!', `${reward.title} has been applied.`);
    } else {
      Alert.alert('Redemption failed', result.message ?? 'Please try again.');
    }
  };

  return (
    <Screen>
      <AppHeader back />
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Headline className="mt-2">Rewards</Headline>

        {/* Points balance card — premium dark with decorative elements */}
        <View className="mt-4 overflow-hidden rounded-3xl bg-primary shadow-elevation-3" style={{ elevation: 3 }}>
          {/* Decorative circles */}
          <View
            style={{
              position: 'absolute',
              top: -30,
              right: -20,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(77,100,75,0.2)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -15,
              left: 40,
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(233,193,118,0.08)',
            }}
          />

          <View className="p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-body text-xs uppercase tracking-widest text-on-primary-container">
                  Points Balance
                </Text>
                <Text className="mt-1 font-headline text-4xl text-on-primary">{points}</Text>
              </View>
              <View className="items-center">
                <View className="h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Icon
                    name={tier === 'gold' ? 'workspace_premium' : 'emoji_events'}
                    size={28}
                    color={tier === 'gold' ? '#e9c176' : '#cfeaca'}
                  />
                </View>
                <Badge
                  variant={tier === 'gold' ? 'gold' : 'secondary'}
                  label={TIER_LABELS[tier]}
                  className="mt-2"
                />
              </View>
            </View>

            {/* Tier progress */}
            {nextTierPoints && (
              <View className="mt-4">
                <View className="flex-row justify-between">
                  <Text className="font-body text-xs text-on-primary-container">
                    {TIER_LABELS[tier]}
                  </Text>
                  <Text className="font-body text-xs text-on-primary-container">
                    {nextTierPoints - points} pts to {tier === 'bronze' ? 'Silver' : 'Gold'}
                  </Text>
                </View>
                <View className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-primary-container">
                  <View
                    className="h-full rounded-full bg-tertiary-fixed-dim"
                    style={{ width: `${Math.max(5, progress * 100)}%` }}
                  />
                </View>
              </View>
            )}
            {!nextTierPoints && (
              <Text className="mt-3 font-body text-xs text-on-primary-container">
                You've reached the highest tier! 🎉
              </Text>
            )}
          </View>
        </View>

        {/* Tier thresholds */}
        <SectionTitle title="Tier Benefits" className="mt-2" />
        <View className="flex-row gap-3">
          {(['bronze', 'silver', 'gold'] as const).map((t) => (
            <View
              key={t}
              className={`flex-1 items-center overflow-hidden rounded-3xl p-3 ${
                tier === t ? 'bg-primary shadow-elevation-2' : 'bg-surface-container-lowest shadow-elevation-1'
              }`}
              style={{ elevation: tier === t ? 2 : 1 }}
            >
              <View className={`h-10 w-10 items-center justify-center rounded-2xl ${
                tier === t ? 'bg-white/10' : 'bg-surface-container'
              }`}>
                <Icon
                  name={t === 'gold' ? 'workspace_premium' : 'emoji_events'}
                  size={20}
                  color={tier === t ? (t === 'gold' ? '#e9c176' : '#ffffff') : t === 'gold' ? '#e9c176' : '#737973'}
                />
              </View>
              <Text
                className={`mt-2 font-body-semibold text-xs ${
                  tier === t ? 'text-on-primary' : 'text-on-surface'
                }`}
              >
                {TIER_LABELS[t]}
              </Text>
              <Text
                className={`font-body text-[10px] ${
                  tier === t ? 'text-on-primary-container' : 'text-on-surface-variant'
                }`}
              >
                {TIER_THRESHOLDS[t]}+ pts
              </Text>
            </View>
          ))}
        </View>

        {/* Redeemable rewards */}
        <SectionTitle title="Redeem Rewards" className="mt-2" />
        {rewards.map((reward) => (
          <View
            key={reward.id}
            className="mb-3 overflow-hidden rounded-3xl bg-surface-container-lowest shadow-elevation-1"
            style={{ elevation: 1 }}
          >
            <View className="h-1 bg-primary/20" />
            <View className="flex-row items-center gap-3 p-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container">
                <Icon name={reward.icon as any} size={22} color="#4d644b" />
              </View>
              <View className="flex-1">
                <Text className="font-body-semibold text-base text-on-surface">{reward.title}</Text>
                <Text className="font-body text-xs text-on-surface-variant">{reward.subtitle}</Text>
              </View>
              <Button
                label={`${reward.points} pts`}
                size="sm"
                variant={points >= reward.points ? 'default' : 'outline'}
                disabled={points < reward.points}
                loading={redeeming === reward.id}
                onPress={() => handleRedeem(reward)}
              />
            </View>
          </View>
        ))}

        {/* Transaction history */}
        <SectionTitle title="Points History" className="mt-2" />
        {transactions.length === 0 && (
          <View className="items-center rounded-3xl bg-surface-container-lowest py-10">
            <Icon name="history" size={32} color="#c3c8c1" />
            <Text className="mt-2 font-body text-sm text-on-surface-variant">
              No transactions yet
            </Text>
          </View>
        )}
        {transactions.map((tx) => (
          <View
            key={tx.id}
            className="mb-2 flex-row items-center justify-between rounded-2xl bg-surface-container-lowest px-4 py-3 shadow-elevation-1"
            style={{ elevation: 1 }}
          >
            <View className="flex-1">
              <Text className="font-body text-sm text-on-surface">
                {tx.reason === 'order_earned' && 'Order reward'}
                {tx.reason === 'signup_bonus' && 'Welcome bonus'}
                {tx.reason === 'redeemed_reward' && 'Reward redeemed'}
                {!['order_earned', 'signup_bonus', 'redeemed_reward'].includes(tx.reason) && tx.reason}
              </Text>
              <Text className="font-body text-xs text-on-surface-variant">
                {new Date(tx.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text
              className={`font-body-semibold text-sm ${
                tx.points > 0 ? 'text-primary' : 'text-error'
              }`}
            >
              {tx.points > 0 ? '+' : ''}{tx.points}
            </Text>
          </View>
        ))}

        <View className="mb-10 mt-4" />
      </ScrollView>
    </Screen>
  );
}
