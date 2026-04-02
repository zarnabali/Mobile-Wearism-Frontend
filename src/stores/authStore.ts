import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../lib/apiClient';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthStore {
  user: User | null;
  isSignedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isSignedIn: false,
  isLoading: true,

  // ─── Hydrate from SecureStore on app start ──────────────────────────────
  hydrate: async () => {
    try {
      const [token, userRaw] = await Promise.all([
        SecureStore.getItemAsync('access_token'),
        SecureStore.getItemAsync('user'),
      ]);
      if (token && userRaw) {
        set({ isSignedIn: true, user: JSON.parse(userRaw), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  // ─── Login ──────────────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    await Promise.all([
      SecureStore.setItemAsync('access_token', data.session.access_token),
      SecureStore.setItemAsync('refresh_token', data.session.refresh_token),
      SecureStore.setItemAsync('user', JSON.stringify(data.user)),
    ]);
    set({ isSignedIn: true, user: data.user });
  },

  // ─── Signup ─────────────────────────────────────────────────────────────
  signup: async (email: string, password: string, fullName: string) => {
    await apiClient.post('/auth/signup', {
      email,
      password,
      full_name: fullName,
      gdpr_consent: true,
    });
    // Do NOT log in — user must verify email first
  },

  // ─── Logout ─────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Best-effort — always clear local state regardless
    }
    await Promise.all([
      SecureStore.deleteItemAsync('access_token'),
      SecureStore.deleteItemAsync('refresh_token'),
      SecureStore.deleteItemAsync('user'),
    ]);
    set({ isSignedIn: false, user: null });
  },

  // ─── clearAuth — called by apiClient interceptor on refresh failure ─────
  clearAuth: () => set({ isSignedIn: false, user: null }),
}));
