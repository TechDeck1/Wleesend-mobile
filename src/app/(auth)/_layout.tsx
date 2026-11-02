import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { session } = useAuth();
  if (session) return <Redirect href="/home" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}