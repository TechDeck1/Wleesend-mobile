import { Button, Field, Footer, Icon, NavBar, Screen, AppText, Tile } from '@/components/UiComponents';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/store';
import { useState } from 'react';


export default function LogInScreen() {
  const theme = useTheme();
  const { logIn, authError } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async () => {
    if (isSubmitting) return;
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await logIn(email, password);
      if (router.canDismiss()) router.dismissAll();
      router.replace('/');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to log in. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }

  };

  const handleFieldChange = (setter: (fieldValue: string) => void) => (fieldValue: string) => {
    setter(fieldValue);
    setError('');
  };

  return (
    <Screen
      gap={18}
      header={<NavBar title="Log in" />}
      footer={
        <Footer>
          <Button label={isSubmitting ? 'Logging in...' : 'Log in'} onPress={() => void handleLoginSubmit()} />
        </Footer>
      }>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <Tile icon="user" size={64} />
        <AppText variant="title" style={{ textAlign: 'center' }} accessibilityRole="header">
          My account log in
        </AppText>
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
          onChangeText={handleFieldChange(setEmail)}
        />
      </View>
      <View>
        <Field
          label="Password"
          placeholder="Enter password"
          secureTextEntry={!isPasswordVisible}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          value={password}
          onChangeText={handleFieldChange(setPassword)}
          error={error || authError || undefined}
          right={
            <Pressable
              onPress={() => setIsPasswordVisible((isVisible) => !isVisible)}
              accessibilityRole="button"
              accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={isPasswordVisible ? 'eyeOff' : 'eye'} size={20} color={theme.muted} />
            </Pressable>
          }
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable
          onPress={() => router.push("/forget-password")}
          accessibilityRole="button"
          hitSlop={8}>
          <Text style={{ color: theme.brandText, fontSize: 15, fontWeight: '600' }}>Forgot password?</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/signup')} accessibilityRole="link" hitSlop={8}>
          <Text style={{ color: theme.brandText, fontSize: 15, fontWeight: '600' }}>Sign up</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
