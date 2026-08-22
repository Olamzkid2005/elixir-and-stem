import { Router } from 'express';
import { z } from 'zod';
import { prisma, requireAuth } from '../auth';

export const reviewsRouter = Router();

// All reviews routes require authentication
reviewsRouter.use(requireAuth);

/** POST /reviews — submit a review (verified purchase only) */
const reviewInput = z.object({
  orderItemId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

reviewsRouter.post('/', async (req, res) => {
  const parsed = reviewInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid review payload.' });

  const { orderItemId, rating, comment } = parsed.data;

  // Verify the order item belongs to this user and the order is delivered
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: true, product: true },
  });

  if (!orderItem) return res.status(404).json({ error: 'Order item not found.' });
  if (orderItem.order.customerId !== req.user!.id) {
    return res.status(403).json({ error: 'This order item does not belong to you.' });
  }
  if (orderItem.order.status !== 'delivered') {
    return res.status(400).json({ error: 'You can only review items from delivered orders.' });
  }

  // Check if a review already exists for this order item
  const existingReview = await prisma.review.findUnique({ where: { orderItemId } });
  if (existingReview) {
    return res.status(409).json({ error: 'You have already reviewed this item.' });
  }

  // Wrap review creation + denormalized rating updates in a transaction
  const review = await prisma.$transaction(async (tx) => {
    const newReview = await tx.review.create({
      data: {
        productId: orderItem.productId,
        customerId: req.user!.id,
        orderItemId,
        rating,
        comment,
      },
      include: { customer: { select: { id: true, email: true } } },
    });

    // Update denormalized product rating
    const productReviews = await tx.review.findMany({
      where: { productId: orderItem.productId },
      select: { rating: true },
    });
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    await tx.product.update({
      where: { id: orderItem.productId },
      data: { rating: Math.round(avgRating * 10) / 10, reviewCount: productReviews.length },
    });

    // Update denormalized merchant rating (average of all product ratings)
    const merchantProducts = await tx.product.findMany({
      where: { merchantId: orderItem.product.merchantId },
      select: { rating: true },
    });
    const merchantAvg =
      merchantProducts.reduce((sum, p) => sum + (p.rating ?? 0), 0) / merchantProducts.length;
    await tx.merchant.update({
      where: { id: orderItem.product.merchantId },
      data: { rating: Math.round(merchantAvg * 10) / 10 },
    });

    return newReview;
  });

  res.status(201).json(review);
});

/** GET /reviews/product/:id — list reviews for a product */
reviewsRouter.get('/product/:id', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { productId: req.params.id },
    include: { customer: { select: { id: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(reviews);
});

/** GET /reviews/merchant/:id — list reviews for all of a merchant's products */
reviewsRouter.get('/merchant/:id', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { product: { merchantId: req.params.id } },
    include: {
      customer: { select: { id: true, email: true } },
      product: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(reviews);
});
