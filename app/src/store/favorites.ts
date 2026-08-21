import { create } from 'zustand';
import { api } from '@/api/client';
import type { Product } from '@/api/types';

interface FavoritesState {
  favoriteIds: Set<string>;
  favorites: Product[];
  loading: boolean;
  initialized: boolean;
  refresh: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  favoriteIds: new Set(),
  favorites: [],
  loading: false,
  initialized: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const favorites = await api.listFavorites();
      set({
        favorites,
        favoriteIds: new Set(favorites.map((p) => p.id)),
        initialized: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  toggle: async (productId: string) => {
    const { favoriteIds, favorites } = get();
    const wasFavorite = favoriteIds.has(productId);

    // Optimistic update
    const nextIds = new Set(favoriteIds);
    if (wasFavorite) {
      nextIds.delete(productId);
    } else {
      nextIds.add(productId);
    }
    set({ favoriteIds: nextIds });

    try {
      const result = await api.toggleFavorite(productId);
      if (!result.favorited && wasFavorite) {
        set({ favorites: favorites.filter((p) => p.id !== productId) });
      } else if (result.favorited && !wasFavorite) {
        // Re-fetch to get full product data
        await get().refresh();
      }
    } catch {
      // Revert on failure
      set({ favoriteIds, favorites });
    }
  },

  isFavorite: (productId: string) => get().favoriteIds.has(productId),
}));
