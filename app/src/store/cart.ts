import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartItem, Order, Product, WeightOption } from '@/api/types';
import { mockProducts } from '@/api/mock';

export const VAT_RATE = 0.075; // Nigerian VAT (7.5%)
export const DEFAULT_STATE_LEVY = 0.025; // Default state levy (2.5%)
export const BASE_DELIVERY_FEE = 500; // Minimum delivery fee in kobo
export const DELIVERY_FEE = BASE_DELIVERY_FEE; // For backwards compatibility in UI

interface CartState {
  items: CartItem[];
  deliveryMode: 'asap' | 'scheduled';
  scheduledFor?: string;
  notes: string;
  add: (product: Product, weight: WeightOption, quantity?: number) => void;
  remove: (productId: string, weightLabel: string) => void;
  setQuantity: (productId: string, weightLabel: string, quantity: number) => void;
  setDeliveryMode: (m: 'asap' | 'scheduled', scheduledFor?: string) => void;
  setNotes: (n: string) => void;
  clear: () => void;
  reorderFromOrder: (order: Order) => { added: number; unavailable: string[] };
  subtotal: () => number;
  tax: () => number;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryMode: 'asap',
      notes: '',
      add: (product, weight, quantity = 1) =>
        set((s) => {
          const existing = s.items.find(
            (i) => i.product.id === product.id && i.weight.label === weight.label
          );
          if (existing) {
            return {
              items: s.items.map((i) =>
                i === existing ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...s.items, { product, weight, quantity }] };
        }),
      remove: (productId, weightLabel) =>
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.product.id === productId && i.weight.label === weightLabel)
          ),
        })),
      setQuantity: (productId, weightLabel, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter(
                  (i) => !(i.product.id === productId && i.weight.label === weightLabel)
                )
              : s.items.map((i) =>
                  i.product.id === productId && i.weight.label === weightLabel
                    ? { ...i, quantity }
                    : i
                ),
        })),
      setDeliveryMode: (m, scheduledFor) => set({ deliveryMode: m, scheduledFor }),
      setNotes: (n) => set({ notes: n }),
      clear: () => set({ items: [], notes: '', scheduledFor: undefined, deliveryMode: 'asap' }),

      reorderFromOrder: (order: Order) => {
        const unavailable: string[] = [];
        let added = 0;

        const newItems: CartItem[] = [];
        for (const orderItem of order.items) {
          // Find product in mock data or current cart
          const product = mockProducts.find((p) => p.id === orderItem.productId);
          if (!product) {
            unavailable.push(orderItem.name);
            continue;
          }
          if (product.stock <= 0) {
            unavailable.push(`${orderItem.name} (out of stock)`);
            continue;
          }

          const weight = product.weightOptions.find((w) => w.label === orderItem.weightLabel);
          if (!weight) {
            unavailable.push(`${orderItem.name} (${orderItem.weightLabel} unavailable)`);
            continue;
          }

          // Check if already in cart
          const existing = newItems.find(
            (i) => i.product.id === product.id && i.weight.label === weight.label
          );
          if (existing) {
            existing.quantity += orderItem.quantity;
          } else {
            newItems.push({ product, weight, quantity: orderItem.quantity });
          }
          added++;
        }

        set((s) => ({
          items: [...s.items, ...newItems],
          deliveryMode: 'asap',
        }));

        return { added, unavailable };
      },

      subtotal: () => get().items.reduce((sum, i) => sum + i.weight.price * i.quantity, 0),
      tax: () => {
        const sub = get().subtotal();
        const vat = Math.round(sub * VAT_RATE);
        const levy = Math.round(sub * DEFAULT_STATE_LEVY);
        return vat + levy;
      },
      total: () => {
        const s = get();
        return s.subtotal() + s.tax() + (s.items.length ? DELIVERY_FEE : 0);
      },
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'es.cart', storage: createJSONStorage(() => AsyncStorage) }
  )
);
