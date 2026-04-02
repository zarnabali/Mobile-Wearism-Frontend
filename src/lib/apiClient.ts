import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  // IMPORTANT: Do not force Content-Type globally.
  // Axios needs to manage multipart boundaries for FormData requests.
  // For JSON requests, we'll set Content-Type per-request in the interceptor.
});

// ─── Request interceptor — inject Bearer token ────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // SecureStore unavailable (simulator quirk) — proceed without token
  }

  // If request body is FormData, do not set JSON Content-Type.
  // Otherwise, ensure JSON requests send the correct header.
  const isFormData =
    typeof FormData !== 'undefined' && config.data instanceof FormData;

  if (!isFormData) {
    config.headers['Content-Type'] = config.headers['Content-Type'] ?? 'application/json';
  } else {
    // Let axios/browser/RN set the correct multipart boundary.
    if (config.headers?.['Content-Type'] === 'application/json') {
      delete config.headers['Content-Type'];
    }
  }

  return config;
});

// ─── Response interceptor — silent 401 refresh ───────────────────────────
let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only handle 401s that haven't already been retried
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    // Queue concurrent requests while refresh is in-flight
    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const refresh = await SecureStore.getItemAsync('refresh_token');
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refresh,
      });
      const { access_token, refresh_token } = data.session;

      await SecureStore.setItemAsync('access_token', access_token);
      await SecureStore.setItemAsync('refresh_token', refresh_token);

      // Replay all queued requests with new token
      queue.forEach((cb) => cb(access_token));
      queue = [];
      original.headers.Authorization = `Bearer ${access_token}`;
      return apiClient(original);
    } catch {
      // Refresh itself failed — clear auth and force re-login
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user');
      // Dynamic import avoids circular dependency authStore → apiClient → authStore
      const { useAuthStore } = await import('../stores/authStore');
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
