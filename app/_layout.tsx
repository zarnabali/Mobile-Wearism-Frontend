import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores/authStore';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import VendorProvider from './contexts/VendorContext';
import { registerFcmToken, setupNotificationHandlers } from '../src/lib/notifications';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
});

function AuthGuard() {
  const { isSignedIn, isLoading, hydrate } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'index' || segments[0] === 'splash' || segments[0] === 'forgot-password' || segments[0] === 'reset-password';
    if (!isSignedIn && !inAuth) router.replace('/login');
    else if (isSignedIn && inAuth) router.replace('/home');
  }, [isSignedIn, isLoading, segments]);

  // Register FCM token and wire notification deep-links once signed in
  useEffect(() => {
    if (!isSignedIn) return;
    registerFcmToken();
    const cleanup = setupNotificationHandlers(router);
    return cleanup;
  }, [isSignedIn]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'HelveticaNeue': require('../assets/fonts/helvetica-neue-5/HelveticaNeueRoman.otf'),
    'HelveticaNeue-Bold': require('../assets/fonts/helvetica-neue-5/HelveticaNeueBold.otf'),
    'HelveticaNeue-Light': require('../assets/fonts/helvetica-neue-5/HelveticaNeueLight.otf'),
    'HelveticaNeue-Italic': require('../assets/fonts/helvetica-neue-5/HelveticaNeueItalic.ttf'),
    'HelveticaNeue-Medium': require('../assets/fonts/helvetica-neue-5/HelveticaNeueMedium.otf'),
    'HelveticaNeue-Thin': require('../assets/fonts/helvetica-neue-5/HelveticaNeueThin.otf'),
    'HelveticaNeue-UltraLight': require('../assets/fonts/helvetica-neue-5/HelveticaNeueUltraLight.otf'),
    'HelveticaNeue-Heavy': require('../assets/fonts/helvetica-neue-5/HelveticaNeueHeavy.otf'),
    'HelveticaNeue-Black': require('../assets/fonts/helvetica-neue-5/HelveticaNeueBlack.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <VendorProvider>
          <AuthGuard />
        </VendorProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}