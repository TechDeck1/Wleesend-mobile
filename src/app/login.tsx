import { Button, Field, Footer, Icon, NavBar, Screen, T, Tile } from '@/components/ui';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/store';
import { useState } from 'react';


/** Log-in form, matching the website's My Account Login page. */
export default function LogInScreen() {
  const c = useTheme();
  const { logIn } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (!logIn(email, password)) {
      setError('That email and password don’t match an account. Check them, or create an account.');
      return;
    }
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  };

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setError('');
  };

  return (
    <Screen
      gap={18}
      header={<NavBar title="Log in" />}
      footer={
        <Footer>
          <Button label="Log in" onPress={submit} />
        </Footer>
      }>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <Tile icon="user" size={64} />
        <T v="title" style={{ textAlign: 'center' }} accessibilityRole="header">
          My account log in
        </T>
      </View>

      <View>
        <Field
          label="Email address"
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          value={email}
          onChangeText={edit(setEmail)}
        />
      </View>
      <View>
        <Field
          label="Password"
          placeholder="Enter password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          value={password}
          onChangeText={edit(setPassword)}
          error={error || undefined}
          right={
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} color={c.muted} />
            </Pressable>
          }
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable
          onPress={() => Alert.alert('Forgot password', 'Password reset isn’t connected yet.')}
          accessibilityRole="button"
          hitSlop={8}>
          <Text style={{ color: c.brandText, fontSize: 15, fontWeight: '600' }}>Forgot password?</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/signup')} accessibilityRole="link" hitSlop={8}>
          <Text style={{ color: c.brandText, fontSize: 15, fontWeight: '600' }}>Sign up</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
