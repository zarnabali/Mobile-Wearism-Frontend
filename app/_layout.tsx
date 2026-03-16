import '../global.css';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { VendorProvider } from './contexts/VendorContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <VendorProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="splash" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="feed" />
        <Stack.Screen name="wardrobe" />
        <Stack.Screen name="rate" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="conversation" />
        <Stack.Screen name="search" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="vendor-registration" />
        <Stack.Screen name="screens/vendor/dashboard" />
        <Stack.Screen name="screens/vendor/inventory" />
        <Stack.Screen name="screens/vendor/ads" />
        <Stack.Screen name="screens/vendor/analytics" />
      </Stack>
    </VendorProvider>
  );
}
