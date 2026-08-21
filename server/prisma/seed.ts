import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const effectsByStrain: Record<string, { icon: string; label: string }[]> = {
  sativa: [{ icon: 'mood', label: 'Energetic' }, { icon: 'spa', label: 'Focused' }],
  indica: [{ icon: 'spa', label: 'Relaxing' }, { icon: 'bedtime', label: 'Sleepy' }],
  hybrid: [{ icon: 'spa', label: 'Relaxing' }, { icon: 'mood', label: 'Uplifted' }],
};

const effectsByCategory: Record<string, { icon: string; label: string }[]> = {
  Edibles: [{ icon: 'spa', label: 'Relaxing' }, { icon: 'bedtime', label: 'Sleepy' }],
  Tinctures: [{ icon: 'spa', label: 'Calm' }],
  Vapes: [{ icon: 'mood', label: 'Energetic' }],
};

function getEffects(strainType?: string | null, category?: string) {
  if (strainType) return effectsByStrain[strainType] ?? effectsByCategory[category ?? ''] ?? [];
  return effectsByCategory[category ?? ''] ?? [];
}

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@elixirandstem.com' },
    update: {},
    create: { email: 'admin@elixirandstem.com', passwordHash: password, role: 'admin', ageVerified: true },
  });

  const merchantUser = await prisma.user.upsert({
    where: { email: 'shop@elixirandstem.com' },
    update: {},
    create: { email: 'shop@elixirandstem.com', passwordHash: password, role: 'merchant', ageVerified: true },
  });

  const merchant = await prisma.merchant.upsert({
    where: { userId: merchantUser.id },
    update: {},
    create: {
      userId: merchantUser.id,
      businessName: 'Elixir & Stem Downtown',
      licenseNumber: 'CA-C10-0001234-LIC',
      status: 'approved',
      address: '412 Olive St, Los Angeles, CA',
      lat: 34.0522,
      lng: -118.2437,
      stateCode: 'CA',
      deliveryEtaMin: 45,
      deliveryEtaMax: 60,
    },
  });

  const pendingUser = await prisma.user.upsert({
    where: { email: 'newshop@example.com' },
    update: {},
    create: { email: 'newshop@example.com', passwordHash: password, role: 'merchant', ageVerified: true },
  });
  await prisma.merchant.upsert({
    where: { userId: pendingUser.id },
    update: {},
    create: {
      userId: pendingUser.id,
      businessName: 'Verdant Remedies',
      licenseNumber: 'CA-C10-0009871-LIC',
      status: 'pending',
      address: '88 Market St, San Francisco, CA',
      lat: 37.7749,
      lng: -122.4194,
      stateCode: 'CA',
      deliveryEtaMin: 30,
      deliveryEtaMax: 50,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: { email: 'customer@example.com', passwordHash: password, role: 'customer', ageVerified: true },
  });

  const products = [
    {
      name: 'Blue Dream', brand: 'Elixir Reserve', category: 'Flower', strainType: 'sativa',
      thcPct: 24, cbdPct: 0.1, price: 4500,
      weightOptions: [{ label: '3.5g', price: 4500 }, { label: '7g', price: 8500 }, { label: '14g', price: 16000 }],
      stock: 42, description: 'A bright, berry-forward sativa with gentle cerebral lift.',
      terpenes: ['Myrcene', 'Pinene', 'Caryophyllene'], imageColor: '#cfeaca',
    },
    {
      name: 'Granddaddy Purple', brand: 'Elixir Reserve', category: 'Flower', strainType: 'indica',
      thcPct: 21, cbdPct: 0.5, price: 5000,
      weightOptions: [{ label: '3.5g', price: 5000 }, { label: '7g', price: 9500 }, { label: '14g', price: 18000 }],
      stock: 28, description: 'Deep grape and berry notes with a heavy, settling body feel.',
      terpenes: ['Myrcene', 'Linalool', 'Caryophyllene'], imageColor: '#e4e2dd',
    },
    {
      name: 'Lush Orchard', brand: 'Orchard Line', category: 'Flower', strainType: 'indica',
      thcPct: 22, cbdPct: 1.2, price: 4500,
      weightOptions: [{ label: '3.5g', price: 4500 }, { label: '7g', price: 8600 }, { label: '14g', price: 16200 }],
      stock: 35, description: 'A sweet, earthy profile with notes of ripe fruit and pine.',
      terpenes: ['Myrcene', 'Limonene', 'Caryophyllene'], imageColor: '#d0e9d4',
    },
    {
      name: 'Wedding Cake', brand: 'House Cultivar', category: 'Flower', strainType: 'hybrid',
      thcPct: 26, cbdPct: 0.2, price: 5500,
      weightOptions: [{ label: '3.5g', price: 5500 }, { label: '7g', price: 10500 }, { label: '14g', price: 20000 }],
      stock: 19, description: 'Rich vanilla and pepper over a calm, balanced hybrid base.',
      terpenes: ['Limonene', 'Caryophyllene', 'Linalool'], imageColor: '#f0eee9',
    },
    {
      name: 'Sour Diesel', brand: 'House Cultivar', category: 'Flower', strainType: 'sativa',
      thcPct: 22, cbdPct: 0.1, price: 4000,
      weightOptions: [{ label: '3.5g', price: 4000 }, { label: '7g', price: 7600 }, { label: '14g', price: 14400 }],
      stock: 51, description: 'Pungent citrus-fuel sativa with a fast, energizing onset.',
      terpenes: ['Limonene', 'Myrcene', 'Pinene'], imageColor: '#cfeaca',
    },
    {
      name: 'Clarity Drops', brand: 'Stem Apothecary', category: 'Tinctures',
      thcPct: 2, cbdPct: 20, price: 8500,
      weightOptions: [{ label: '30ml', price: 8500 }],
      stock: 24, description: 'CBD-rich sublingual tincture, 30ml bottle with measured dropper.',
      terpenes: [], imageColor: '#ffdea5',
    },
    {
      name: 'Soothe Confections', brand: 'Stem Apothecary', category: 'Edibles',
      price: 3500,
      weightOptions: [{ label: '20 pack', price: 3500 }],
      stock: 60, description: '20 pieces, 10mg THC each. Slow-baked fruit confections.',
      terpenes: [], imageColor: '#e9c176',
    },
  ];

  const createdProducts: any[] = [];
  for (const p of products) {
    const found = await prisma.product.findFirst({ where: { name: p.name, merchantId: merchant.id } });
    if (found) {
      createdProducts.push(found);
    } else {
      const effects = getEffects(p.strainType, p.category);
      const created = await prisma.product.create({
        data: { ...p, effects, merchantId: merchant.id },
      });
      createdProducts.push(created);
    }
  }

  // ── Delivered orders ──────────────────────────────────────────────────

  const order1 = await prisma.order.upsert({
    where: { id: 'seed-order-1' },
    update: {},
    create: {
      id: 'seed-order-1',
      customerId: customer.id,
      merchantId: merchant.id,
      status: 'delivered',
      deliveryAddress: '500 S Grand Ave, Los Angeles, CA',
      subtotal: 13000,
      tax: 1235,
      deliveryFee: 500,
      total: 14735,
      items: {
        create: [
          { productId: createdProducts[0].id, quantity: 1, weightLabel: '7g', priceAtPurchase: 8500 },
          { productId: createdProducts[5].id, quantity: 1, weightLabel: '30ml', priceAtPurchase: 8500 },
        ],
      },
    },
  });

  const order2 = await prisma.order.upsert({
    where: { id: 'seed-order-2' },
    update: {},
    create: {
      id: 'seed-order-2',
      customerId: customer.id,
      merchantId: merchant.id,
      status: 'delivered',
      deliveryAddress: '500 S Grand Ave, Los Angeles, CA',
      subtotal: 4500,
      tax: 428,
      deliveryFee: 500,
      total: 5428,
      items: {
        create: [
          { productId: createdProducts[2].id, quantity: 1, weightLabel: '3.5g', priceAtPurchase: 4500 },
        ],
      },
    },
  });

  // ── Sample reviews ─────────────────────────────────────────────────────

  const order1Items = await prisma.orderItem.findMany({ where: { orderId: 'seed-order-1' } });
  const blueDreamItem = order1Items.find((i) => i.productId === createdProducts[0].id);

  if (blueDreamItem) {
    await prisma.review.upsert({
      where: { orderItemId: blueDreamItem.id },
      update: {},
      create: {
        productId: createdProducts[0].id,
        customerId: customer.id,
        orderItemId: blueDreamItem.id,
        rating: 5,
        comment: 'Absolutely love this strain! Perfect for daytime use.',
      },
    });
  }

  // ── Favorites ──────────────────────────────────────────────────────────

  await prisma.favorite.upsert({
    where: { userId_productId: { userId: customer.id, productId: createdProducts[0].id } },
    update: {},
    create: { userId: customer.id, productId: createdProducts[0].id },
  });
  await prisma.favorite.upsert({
    where: { userId_productId: { userId: customer.id, productId: createdProducts[2].id } },
    update: {},
    create: { userId: customer.id, productId: createdProducts[2].id },
  });

  // ── Loyalty ────────────────────────────────────────────────────────────

  const loyaltyAccount = await prisma.loyaltyAccount.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id, points: 200, tier: 'bronze' },
  });

  await prisma.loyaltyTransaction.upsert({
    where: { id: 'seed-lt-1' },
    update: {},
    create: { id: 'seed-lt-1', accountId: loyaltyAccount.id, orderId: 'seed-order-1', points: 147, reason: 'order_earned' },
  });
  await prisma.loyaltyTransaction.upsert({
    where: { id: 'seed-lt-2' },
    update: {},
    create: { id: 'seed-lt-2', accountId: loyaltyAccount.id, orderId: 'seed-order-2', points: 54, reason: 'order_earned' },
  });

  console.log('Seeded:', { admin: admin.email, merchant: merchant.businessName, products: createdProducts.length });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
