export type Role = 'customer' | 'merchant';
export type MerchantStatus = 'pending' | 'approved' | 'rejected';
export type StrainType = 'sativa' | 'indica' | 'hybrid';
export type Category =
  | 'Flower'
  | 'Edibles'
  | 'Vapes'
  | 'Concentrates'
  | 'Tinctures'
  | 'Topicals';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'out_for_delivery'
  | 'delivered'
  | 'rejected';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  role: Role;
  ageVerified: boolean;
}

export interface Merchant {
  id: string;
  userId: string;
  businessName: string;
  licenseNumber: string;
  licenseDocUrl?: string;
  status: MerchantStatus;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  deliveryEtaMins: [number, number];
  distanceMiles?: number;
}

export interface WeightOption {
  label: string; // e.g. "3.5g"
  price: number; // cents
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  brand: string;
  category: Category;
  strainType?: StrainType;
  thcPct?: number;
  cbdPct?: number;
  description: string;
  terpenes: string[];
  effects: { icon: string; label: string }[];
  weightOptions: WeightOption[];
  stock: number;
  imageColor: string; // placeholder art color (swap for imageUrl from S3)
  rating: number;
  reviews: number;
}

export interface CartItem {
  product: Product;
  weight: WeightOption;
  quantity: number;
}

export interface OrderItem {
  id?: string; // needed for review linking
  productId: string;
  name: string;
  weightLabel: string;
  quantity: number;
  priceAtPurchase: number; // cents
}

export interface Order {
  id: string;
  customerId: string;
  merchantId: string;
  merchantName: string;
  status: OrderStatus;
  paymentMethod: 'pay_on_delivery';
  deliveryAddress: string;
  notes?: string;
  scheduledFor?: string; // ISO, when "schedule for later" is chosen
  items: OrderItem[];
  subtotal: number; // cents
  tax: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  driver?: { name: string; rating: number };
  etaMins?: [number, number];
  timeline: { status: OrderStatus; label: string; detail?: string; at?: string }[];
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerEmail?: string;
  orderItemId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  accountId: string;
  orderId?: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface LoyaltyAccount {
  points: number;
  tier: LoyaltyTier;
  transactions: LoyaltyTransaction[];
}

export interface Reward {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  points: number;
}

export const CATEGORY_LIST: Category[] = [
  'Flower', 'Edibles', 'Vapes', 'Concentrates', 'Tinctures', 'Topicals',
];

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
