import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import '../global.css';
import { QueryProvider } from '../src/providers/QueryProvider';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'HelveticaNeue-UltraLight': require('../assets/fonts/helvetica-neue-5/HelveticaNeueUltraLight.otf'),
    'HelveticaNeue-Thin': require('../assets/fonts/helvetica-neue-5/HelveticaNeueThin.otf'),
    'HelveticaNeue-Light': require('../assets/fonts/helvetica-neue-5/HelveticaNeueLight.otf'),
    'HelveticaNeue-Roman': require('../assets/fonts/helvetica-neue-5/HelveticaNeueRoman.otf'),
    'HelveticaNeue-Medium': require('../assets/fonts/helvetica-neue-5/HelveticaNeueMedium.otf'),
    'HelveticaNeue-Heavy': require('../assets/fonts/helvetica-neue-5/HelveticaNeueHeavy.otf'),
    'HelveticaNeue-Bold': require('../assets/fonts/helvetica-neue-5/HelveticaNeueBold.otf'),
    'HelveticaNeue-Black': require('../assets/fonts/helvetica-neue-5/HelveticaNeueBlack.otf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="menu" options={{ headerShown: false }} />
        <Stack.Screen name="schema-management" options={{ headerShown: false }} />  
        <Stack.Screen name="schema-generator" options={{ headerShown: false }} />
        <Stack.Screen name="data-management" options={{ headerShown: false }} />
        <Stack.Screen name="audit-trail" options={{ headerShown: false }} />	
        <Stack.Screen name="queue-monitoring" options={{ headerShown: false }} />
        <Stack.Screen name="system-health" options={{ headerShown: false }} />
        <Stack.Screen name="tenant-management" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="schema-detail" options={{ headerShown: false }} />
        <Stack.Screen name="super-admin-menu" options={{ headerShown: false }} />
        <Stack.Screen name="action-controls" options={{ headerShown: false }} />
        <Stack.Screen name="view-management" options={{ headerShown: false }} />
      </Stack>
    </QueryProvider>
  );
}
