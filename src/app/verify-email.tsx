import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Icon, Screen, T } from '@/components/ui';
import { resendVerificationEmail } from '@/services/accountService';
import { useTheme } from '@/theme';

export default function VerifyEmailScreen() {
  const c = useTheme();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = typeof emailParam === 'string' ? emailParam : '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const resend = async () => {
    if (resending || !email) return;

    setResending(true);
    setMessage('');
    setError('');
    try {
      setMessage(await resendVerificationEmail(email));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to resend the verification email. Please try again.',
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen gap={0} contentContainerStyle={{ justifyContent: 'center' }}>
      <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: '100%',
            maxWidth: 480,
            alignItems: 'center',
            paddingHorizontal: 28,
            paddingVertical: 36,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: c.lineSoft,
            backgroundColor: c.card,
            shadowColor: '#171B4D',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 4,
          }}>
          <View
            accessibilityLabel="Success"
            style={{
              width: 64,
              height: 64,
              marginBottom: 20,
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E8F5EC',
            }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#2E7D32',
              }}>
              <Icon name="check" size={25} color="#FFFFFF" />
            </View>
          </View>

          <T
            v="heading"
            accessibilityRole="header"
            style={{ color: c.brandText, fontSize: 24, lineHeight: 31, textAlign: 'center' }}>
            Check Your Email
          </T>
          <T style={{ marginTop: 12, textAlign: 'center' }}>
            We&apos;ve sent a verification link to{' '}
            <T style={{ fontWeight: '600' }}>{email || 'your email address'}</T>.
          </T>
          <T v="muted" style={{ marginTop: 4, textAlign: 'center' }}>
            Please check your inbox and click the verification link to activate your account.
          </T>

          <View
            style={{
              width: '100%',
              height: 1,
              marginTop: 24,
              marginBottom: 18,
              backgroundColor: c.lineSoft,
            }}
          />

          <T v="small" style={{ textAlign: 'center' }}>
            Didn&apos;t receive the email?
          </T>
          <Pressable
            onPress={() => void resend()}
            disabled={resending || !email}
            accessibilityRole="button"
            accessibilityState={{ disabled: resending || !email, busy: resending }}
            style={({ pressed }) => ({
              width: '100%',
              minHeight: 52,
              marginTop: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: c.brandText,
              borderRadius: 12,
              backgroundColor: c.card,
              opacity: resending || !email ? 0.6 : pressed ? 0.8 : 1,
            })}>
            {resending ? <ActivityIndicator size="small" color={c.brandText} /> : null}
            <T v="strong" style={{ color: c.brandText }}>
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </T>
          </Pressable>

          {message ? (
            <T
              accessibilityLiveRegion="polite"
              style={{ marginTop: 12, color: '#2E7D32', textAlign: 'center' }}>
              {message}
            </T>
          ) : null}
          {error ? (
            <T
              accessibilityLiveRegion="polite"
              style={{ marginTop: 12, color: c.accentText, textAlign: 'center' }}>
              {error}
            </T>
          ) : null}

          <Pressable
            onPress={() => router.replace('/login')}
            accessibilityRole="link"
            style={{ minHeight: 48, marginTop: 8, paddingHorizontal: 16, justifyContent: 'center' }}>
            <T v="strong" style={{ color: c.brandText }}>
              Go to Login
            </T>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
