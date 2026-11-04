import { Lexend_500Medium, Lexend_600SemiBold, useFonts } from '@expo-google-fonts/lexend';
import Stack from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';

import { StoreProvider } from '@/store';
import { STRIPE_PUBLISHABLE_KEY } from '@/config/api';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useTheme();
  const [isFontsLoaded, fontError] = useFonts({ Lexend_500Medium, Lexend_600SemiBold });
  const isReady = isFontsLoaded || fontError != null;

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} urlScheme="wleesend">
        <StoreProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.ground } }} />
        </StoreProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
