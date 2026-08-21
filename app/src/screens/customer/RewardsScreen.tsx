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

        {/* Points balance card */}
        <View className="mt-4 rounded-2xl bg-primary p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-body text-xs uppercase tracking-widest text-on-primary-container">
                Points Balance
              </Text>
              <Text className="mt-1 font-headline text-4xl text-on-primary">{points}</Text>
            </View>
            <View className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-container">
                <Icon
                  name={tier === 'gold' ? 'workspace_premium' : 'emoji_events'}
                  size={28}
                  color={tier === 'gold' ? '#e9c176' : '#d0e9d4'}
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
              <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-primary-container">
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

        {/* Tier thresholds */}
        <SectionTitle title="Tier Benefits" className="mt-2" />
        <View className="flex-row gap-3">
          {(['bronze', 'silver', 'gold'] as const).map((t) => (
            <View
              key={t}
              className={`flex-1 items-center rounded-2xl p-3 ${
                tier === t ? 'bg-primary' : 'bg-surface-container-lowest'
              }`}
            >
              <Icon
                name={t === 'gold' ? 'workspace_premium' : 'emoji_events'}
                size={20}
                color={tier === t ? '#ffffff' : t === 'gold' ? '#e9c176' : '#737973'}
              />
              <Text
                className={`mt-1 font-body-semibold text-xs ${
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
            className="mb-3 flex-row items-center gap-3 rounded-2xl bg-surface-container-lowest p-4"
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary-container">
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
        ))}

        {/* Transaction history */}
        <SectionTitle title="Points History" className="mt-2" />
        {transactions.length === 0 && (
          <Text className="py-4 text-center font-body text-sm text-on-surface-variant">
            No transactions yet
          </Text>
        )}
        {transactions.map((tx) => (
          <View
            key={tx.id}
            className="mb-2 flex-row items-center justify-between rounded-xl bg-surface-container-lowest px-4 py-3"
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
