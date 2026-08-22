import { create } from 'zustand';
import { api, setToken } from '@/api/client';
import type { Role, User } from '@/api/types';

interface AuthState {
  ageVerified: boolean;
  role: Role | null;
  user: User | null;
  setAgeVerified: (v: boolean) => void;
  setRole: (r: Role) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple', email: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  ageVerified: false,
  role: null,
  user: null,
  setAgeVerified: (v) => set({ ageVerified: v }),
  setRole: (r) => set({ role: r }),
  signIn: async (email, password) => {
    const role = get().role ?? 'customer';
    const { user } = await api.signIn(email, password, role);
    set({ user });
  },
  signInWithOAuth: async (provider, email, name) => {
    const role = get().role ?? 'customer';
    const { user } = await api.oauthSignIn(provider, email, name, role);
    set({ user });
  },
  signOut: async () => {
    await setToken(null);
    set({ user: null, role: null });
  },
}));
