import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret';

export { prisma };

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: string;
  token: string;
}

export interface TestMerchant {
  userId: string;
  merchantId: string;
  token: string;
}

export interface TestProduct {
  id: string;
  merchantId: string;
}

let _customer: TestUser;
let _merchant: TestUser;
let _admin: TestUser;
let _merchantProfile: TestMerchant;
let _product: TestProduct;

export function getCustomer() { return _customer; }
export function getMerchant() { return _merchant; }
export function getAdmin() { return _admin; }
export function getMerchantProfile() { return _merchantProfile; }
export function getProduct() { return _product; }

import { signToken } from '../src/auth';

export async function setupTestData() {
  const password = await bcrypt.hash('password123', 10);

  // Clean slate
  await prisma.pushToken.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.loyaltyAccount.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'test-customer@example.com',
          'test-merchant@example.com',
          'test-admin@example.com',
          'test-new-merchant@example.com',
          'new-customer@example.com',
          'suspended@example.com',
          'pending-merchant@example.com',
          'fresh-loyalty@example.com',
          'poor-loyalty@example.com',
          'test-invalid-merchant@example.com',
        ],
      },
    },
  });

  // Customer
  const customer = await prisma.user.create({
    data: {
      email: 'test-customer@example.com',
      passwordHash: password,
      role: 'customer',
      ageVerified: true,
    },
  });
  _customer = {
    id: customer.id,
    email: customer.email,
    password: 'password123',
    role: 'customer',
    token: signToken({ id: customer.id, role: customer.role }),
  };

  // Merchant user
  const merchantUser = await prisma.user.create({
    data: {
      email: 'test-merchant@example.com',
      passwordHash: password,
      role: 'merchant',
      ageVerified: true,
    },
  });
  _merchant = {
    id: merchantUser.id,
    email: merchantUser.email,
    password: 'password123',
    role: 'merchant',
    token: signToken({ id: merchantUser.id, role: merchantUser.role }),
  };

  // Merchant profile (approved)
  const merchantProfile = await prisma.merchant.create({
    data: {
      userId: merchantUser.id,
      businessName: 'Test Dispensary',
      licenseNumber: 'NAFDAC-VR-TEST-001',
      status: 'approved',
      address: '123 Test St, Victoria Island, Lagos',
      lat: 6.4281,
      lng: 3.4219,
      stateCode: 'LA',
    },
  });
  _merchantProfile = {
    userId: merchantUser.id,
    merchantId: merchantProfile.id,
    token: signToken({ id: merchantUser.id, role: merchantUser.role }),
  };

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'test-admin@example.com',
      passwordHash: password,
      role: 'admin',
      ageVerified: true,
    },
  });
  _admin = {
    id: adminUser.id,
    email: adminUser.email,
    password: 'password123',
    role: 'admin',
    token: signToken({ id: adminUser.id, role: adminUser.role }),
  };

  // Product
  const product = await prisma.product.create({
    data: {
      merchantId: merchantProfile.id,
      name: 'Test Flower',
      brand: 'Test Brand',
      category: 'Flower',
      strainType: 'sativa',
      thcPct: 22,
      cbdPct: 0.5,
      description: 'A test product for unit tests.',
      price: 4500,
      weightOptions: [{ label: '3.5g', price: 4500 }, { label: '7g', price: 8500 }],
      stock: 50,
    },
  });
  _product = { id: product.id, merchantId: merchantProfile.id };

  return { customer: _customer, merchant: _merchant, admin: _admin, merchantProfile: _merchantProfile, product: _product };
}

export async function cleanupTestData() {
  await prisma.pushToken.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.loyaltyAccount.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'test-customer@example.com',
          'test-merchant@example.com',
          'test-admin@example.com',
          'test-new-merchant@example.com',
          'new-customer@example.com',
          'suspended@example.com',
          'pending-merchant@example.com',
          'fresh-loyalty@example.com',
          'poor-loyalty@example.com',
          'test-invalid-merchant@example.com',
        ],
      },
    },
  });
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
