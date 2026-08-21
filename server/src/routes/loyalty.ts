import { Router } from 'express';
import { z } from 'zod';
import { prisma, requireAuth } from '../auth';

export const loyaltyRouter = Router();

// Tier thresholds
const TIER_THRESHOLDS = { bronze: 0, silver: 500, gold: 2000 };

function computeTier(points: number): string {
  if (points >= TIER_THRESHOLDS.gold) return 'gold';
  if (points >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

/** Award points for an order (called from order status transition) */
export async function awardOrderPoints(orderId: string, customerId: string, totalCents: number) {
  // 1 point per dollar spent
  const pointsEarned = Math.floor(totalCents / 100);
  if (pointsEarned <= 0) return;

  // Upsert loyalty account
  const account = await prisma.loyaltyAccount.upsert({
    where: { userId: customerId },
    update: { points: { increment: pointsEarned } },
    create: { userId: customerId, points: pointsEarned },
  });

  // Recompute tier
  const newTier = computeTier(account.points);
  if (newTier !== account.tier) {
    await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { tier: newTier },
    });
  }

  // Log transaction
  await prisma.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      orderId,
      points: pointsEarned,
      reason: 'order_earned',
    },
  });
}

// All loyalty routes require authentication
loyaltyRouter.use(requireAuth);

/** GET /loyalty/me — balance, tier, recent transactions */
loyaltyRouter.get('/me', async (req, res) => {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { userId: req.user!.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!account) {
    return res.json({ points: 0, tier: 'bronze', transactions: [] });
  }

  res.json({
    points: account.points,
    tier: account.tier,
    transactions: account.transactions,
  });
});

/** POST /loyalty/redeem — redeem a reward */
const redeemInput = z.object({
  rewardId: z.string(),
  points: z.number().int().positive(),
  discountCents: z.number().int().positive(),
});

// Predefined rewards catalog (can be moved to DB later)
const REWARDS_CATALOG = [
  { id: 'free_delivery', title: 'Free Delivery', points: 100, discountCents: 500 },
  { id: '10_off_flower', title: '10% Off Flower', points: 150, discountCents: 0 },
  { id: '5_off', title: '$5 Off Next Order', points: 200, discountCents: 500 },
];

loyaltyRouter.post('/redeem', async (req, res) => {
  const parsed = redeemInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid redemption payload.' });

  const { rewardId, points, discountCents } = parsed.data;

  // Validate reward exists
  const reward = REWARDS_CATALOG.find((r) => r.id === rewardId);
  if (!reward) return res.status(404).json({ error: 'Reward not found.' });
  if (reward.points !== points) {
    return res.status(400).json({ error: 'Points mismatch for this reward.' });
  }

  const account = await prisma.loyaltyAccount.findUnique({
    where: { userId: req.user!.id },
  });

  if (!account || account.points < points) {
    return res.status(400).json({ error: 'Insufficient points.' });
  }

  // Deduct points
  const updated = await prisma.loyaltyAccount.update({
    where: { id: account.id },
    data: { points: { decrement: points } },
  });

  // Log redemption
  await prisma.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      points: -points,
      reason: 'redeemed_reward',
    },
  });

  // Recompute tier
  const newTier = computeTier(updated.points);
  if (newTier !== updated.tier) {
    await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { tier: newTier },
    });
  }

  res.json({ ok: true, remainingPoints: updated.points, reward: reward.title, discountCents });
});

/** GET /loyalty/rewards — available rewards catalog */
loyaltyRouter.get('/rewards', (_req, res) => {
  res.json(REWARDS_CATALOG);
});
