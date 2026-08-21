import * as SecureStore from 'expo-secure-store';
import { mockMerchants, mockPastOrders, mockProducts, mockRewards, mockReviews, mockLoyalty } from './mock';
import type { Merchant, Order, Product, Reward, Review, LoyaltyAccount, User } from './types';

/**
 * Thin API layer. If EXPO_PUBLIC_API_URL is configured (see app/.env.example),
 * requests go to the Express/Prisma backend. Otherwise the app runs entirely
 * on the bundled seed data so it is demoable out of the box.
 * (EXPO_PUBLIC_* vars are inlined by Expo at bundle time — no app.json wiring needed.)
 */
const API_URL: string = process.env.EXPO_PUBLIC_API_URL ?? '';

const TOKEN_KEY = 'es.jwt';

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // SecureStore unavailable (e.g. web preview) — ignore in mock mode
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const useMock = API_URL.length === 0;

export const api = {
  async signIn(email: string, password: string, role: 'customer' | 'merchant') {
    if (useMock) {
      return {
        token: 'mock-token',
        user: {
          id: role === 'merchant' ? 'u-m1' : 'u-c1',
          email,
          name: role === 'merchant' ? 'Elixir & Stem Downtown' : 'Julian Reed',
          role,
          ageVerified: true,
        } as User,
      };
    }
    const data = await request<{ token: string; user: User }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    await setToken(data.token);
    return data;
  },

  async signUp(payload: { email: string; password: string; role: 'customer' | 'merchant' }) {
    if (useMock) return this.signIn(payload.email, payload.password, payload.role);
    const data = await request<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await setToken(data.token);
    return data;
  },

  async registerMerchant(payload: {
    businessName: string;
    licenseNumber: string;
    licenseDocUrl?: string;
    address: string;
  }) {
    if (useMock) return { status: 'pending' as const };
    return request<{ status: 'pending' }>('/merchants', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listMerchants(): Promise<Merchant[]> {
    if (useMock) return mockMerchants;
    return request<Merchant[]>('/merchants');
  },

  async listProducts(merchantId?: string): Promise<Product[]> {
    if (useMock) {
      return merchantId ? mockProducts.filter((p) => p.merchantId === merchantId) : mockProducts;
    }
    return request<Product[]>(merchantId ? `/products?merchantId=${merchantId}` : '/products');
  },

  async searchProducts(query: string, category?: string): Promise<Product[]> {
    if (useMock) {
      const q = query.toLowerCase();
      return mockProducts.filter(
        (p) =>
          (!category || p.category === category) &&
          (!q ||
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            (p.strainType ?? '').toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.terpenes.some((t) => t.toLowerCase().includes(q)))
      );
    }
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    const qs = params.toString();
    return request<Product[]>(`/products/search${qs ? `?${qs}` : ''}`);
  },

  async listOrders(): Promise<Order[]> {
    if (useMock) return mockPastOrders;
    return request<Order[]>('/orders');
  },

  async createOrder(order: Partial<Order>): Promise<Order> {
    if (useMock) {
      return {
        id: `ES-${Math.floor(10000 + Math.random() * 89999)}`,
        customerId: 'u-c1',
        merchantId: order.merchantId ?? 'm1',
        merchantName: order.merchantName ?? 'Elixir & Stem Downtown',
        status: 'placed',
        paymentMethod: 'pay_on_delivery',
        deliveryAddress: order.deliveryAddress ?? '',
        notes: order.notes,
        scheduledFor: order.scheduledFor,
        items: order.items ?? [],
        subtotal: order.subtotal ?? 0,
        tax: order.tax ?? 0,
        deliveryFee: order.deliveryFee ?? 0,
        total: order.total ?? 0,
        createdAt: new Date().toISOString(),
        driver: { name: 'Marcus', rating: 4.9 },
        etaMins: [15, 25],
        timeline: [
          { status: 'placed', label: 'Order Received', at: 'now' },
          { status: 'confirmed', label: 'Preparing Order' },
          { status: 'out_for_delivery', label: 'Out for Delivery' },
          { status: 'delivered', label: 'Arrived' },
        ],
      };
    }
    return request<Order>('/orders', { method: 'POST', body: JSON.stringify(order) });
  },

  async updateOrderStatus(orderId: string, status: Order['status']) {
    if (useMock) return { ok: true };
    return request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // ── Favorites ──────────────────────────────────────────

  async toggleFavorite(productId: string): Promise<{ favorited: boolean }> {
    if (useMock) return { favorited: true };
    return request<{ favorited: boolean }>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  async listFavorites(): Promise<Product[]> {
    if (useMock) return mockProducts.slice(0, 3);
    return request<Product[]>('/favorites');
  },

  async removeFavorite(productId: string) {
    if (useMock) return { ok: true };
    return request(`/favorites/${productId}`, { method: 'DELETE' });
  },

  // ── Reviews ────────────────────────────────────────────

  async listProductReviews(productId: string): Promise<Review[]> {
    if (useMock) return mockReviews.filter((r) => r.productId === productId);
    return request<Review[]>(`/reviews/product/${productId}`);
  },

  async submitReview(orderItemId: string, rating: number, comment?: string): Promise<Review> {
    if (useMock) {
      return {
        id: `rev-${Date.now()}`,
        productId: 'p1',
        customerId: 'u-c1',
        customerEmail: 'julian@example.com',
        orderItemId,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };
    }
    return request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify({ orderItemId, rating, comment }),
    });
  },

  // ── Loyalty ────────────────────────────────────────────

  async getLoyaltyAccount(): Promise<LoyaltyAccount> {
    if (useMock) return mockLoyalty;
    return request<LoyaltyAccount>('/loyalty/me');
  },

  async redeemReward(rewardId: string, points: number, discountCents: number) {
    if (useMock) return { ok: true, remainingPoints: mockLoyalty.points - points };
    return request('/loyalty/redeem', {
      method: 'POST',
      body: JSON.stringify({ rewardId, points, discountCents }),
    });
  },

  async listRewards(): Promise<Reward[]> {
    if (useMock) return mockRewards;
    return request<Reward[]>('/loyalty/rewards');
  },

  // ── Push Notifications ─────────────────────────────────

  async registerPushToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    if (useMock) return;
    await request('/push-tokens', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  },

  async unregisterPushToken(): Promise<void> {
    if (useMock) return;
    await request('/push-tokens', { method: 'DELETE' });
  },

  async sendTestNotification(): Promise<{ ok: boolean; message: string }> {
    if (useMock) return { ok: true, message: 'Test notification sent (mock mode).' };
    return request<{ ok: boolean; message: string }>('/push-tokens/test', { method: 'POST' });
  },
};
