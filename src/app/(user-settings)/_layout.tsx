import { Redirect, Stack } from 'expo-router';

import { useStore } from '@/store';

export default function UserSettings() {
  const { user } = useStore();
  if (!user) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
