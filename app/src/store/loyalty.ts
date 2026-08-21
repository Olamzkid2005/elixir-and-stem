import { create } from 'zustand';
import { api } from '@/api/client';
import type { LoyaltyAccount, LoyaltyTier, Reward } from '@/api/types';

interface LoyaltyState {
  points: number;
  tier: LoyaltyTier;
  transactions: LoyaltyAccount['transactions'];
  rewards: Reward[];
  loading: boolean;
  initialized: boolean;
  refresh: () => Promise<void>;
  loadRewards: () => Promise<void>;
  redeem: (reward: Reward) => Promise<{ ok: boolean; message?: string }>;
}

export const useLoyalty = create<LoyaltyState>((set, get) => ({
  points: 0,
  tier: 'bronze',
  transactions: [],
  rewards: [],
  loading: false,
  initialized: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const account = await api.getLoyaltyAccount();
      set({
        points: account.points,
        tier: account.tier,
        transactions: account.transactions,
        initialized: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  loadRewards: async () => {
    const rewards = await api.listRewards();
    set({ rewards });
  },

  redeem: async (reward: Reward) => {
    const { points } = get();
    if (points < reward.points) {
      return { ok: false, message: 'Insufficient points.' };
    }
    try {
      const result = await api.redeemReward(reward.id, reward.points, 0);
      if ((result as any).ok) {
        set({ points: (result as any).remainingPoints ?? points - reward.points });
        return { ok: true };
      }
      return { ok: false, message: 'Redemption failed.' };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Redemption failed.' };
    }
  },
}));

/** Tier thresholds and helpers */
export const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  bronze: 0,
  silver: 500,
  gold: 2000,
};

export const TIER_LABELS: Record<LoyaltyTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

export function getPointsToNextTier(tier: LoyaltyTier): number | null {
  if (tier === 'gold') return null;
  const next = tier === 'bronze' ? 'silver' : 'gold';
  return TIER_THRESHOLDS[next];
}

export function getTierProgress(points: number, tier: LoyaltyTier): number {
  const next = getPointsToNextTier(tier);
  if (!next) return 1;
  const current = TIER_THRESHOLDS[tier];
  return Math.min(1, (points - current) / (next - current));
}
