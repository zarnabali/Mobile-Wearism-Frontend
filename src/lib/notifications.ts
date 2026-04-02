import { NativeModules } from 'react-native';
import { apiClient } from './apiClient';

// RNFBAppModule is only present in a native build (EAS Build / expo run:ios|android).
// In Expo Go the native module is absent — skip all Firebase calls to avoid errors.
const FIREBASE_AVAILABLE = !!NativeModules.RNFBAppModule;

export async function registerFcmToken() {
  if (!FIREBASE_AVAILABLE) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const messaging = require('@react-native-firebase/messaging').default;
    const instance = messaging();

    const status = await instance.requestPermission();
    const ok = status === messaging.AuthorizationStatus.AUTHORIZED
            || status === messaging.AuthorizationStatus.PROVISIONAL;
    if (!ok) return;

    const token = await instance.getToken();
    if (!token) return;

    await apiClient.post('/notifications/token', { token });
  } catch (err) {
    console.warn('[FCM] registerFcmToken:', err);
  }
}

export function setupNotificationHandlers(router: any): () => void {
  if (!FIREBASE_AVAILABLE) return () => {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const messaging = require('@react-native-firebase/messaging').default;
    const instance = messaging();

    const unsubForeground = instance.onMessage(async () => {
      // Show in-app toast/banner for foreground notifications
    });
    const unsubOpened = instance.onNotificationOpenedApp((msg: any) => {
      const { type, postId } = msg.data || {};
      if (type === 'follow' || type === 'like' || type === 'comment') router.push(`/social/post/${postId}`);
      if (type === 'order') router.push('/orders');
    });
    return () => {
      unsubForeground();
      unsubOpened();
    };
  } catch (err) {
    console.warn('[FCM] setupNotificationHandlers:', err);
    return () => {};
  }
}
