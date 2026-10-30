import { Lexend_500Medium, Lexend_600SemiBold, useFonts } from '@expo-google-fonts/lexend';
import Stack from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider } from '@/store';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const c = useTheme();
  const [fontsLoaded, fontError] = useFonts({ Lexend_500Medium, Lexend_600SemiBold });
  const ready = fontsLoaded || fontError != null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.ground } }} />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
