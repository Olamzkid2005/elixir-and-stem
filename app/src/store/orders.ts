import { create } from 'zustand';
import { api } from '@/api/client';
import type { Order } from '@/api/types';

interface OrdersState {
  orders: Order[];
  activeOrder: Order | null;
  loading: boolean;
  refresh: () => Promise<void>;
  placeOrder: (order: Partial<Order>) => Promise<Order>;
  advanceActiveStatus: () => void;
}

const STATUS_FLOW: Order['status'][] = [
  'placed',
  'confirmed',
  'out_for_delivery',
  'delivered',
];

export const useOrders = create<OrdersState>((set, get) => ({
  orders: [],
  activeOrder: null,
  loading: false,
  refresh: async () => {
    set({ loading: true });
    try {
      const orders = await api.listOrders();
      set({ orders });
    } finally {
      set({ loading: false });
    }
  },
  placeOrder: async (order) => {
    const created = await api.createOrder(order);
    set((s) => ({ activeOrder: created, orders: [created, ...s.orders] }));
    return created;
  },
  /** Demo helper: advance the active order one step (simulates push-driven updates). */
  advanceActiveStatus: () => {
    const o = get().activeOrder;
    if (!o) return;
    const idx = STATUS_FLOW.indexOf(o.status);
    if (idx < STATUS_FLOW.length - 1) {
      set({ activeOrder: { ...o, status: STATUS_FLOW[idx + 1] } });
    }
  },
}));
