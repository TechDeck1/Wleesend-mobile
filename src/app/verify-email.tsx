import { ROUTES } from '@/constants/routes';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Icon, Screen, AppText } from '@/components/UiComponents';
import { resendVerificationEmail } from '@/services/accountService';
import { useTheme } from '@/theme';

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = typeof emailParam === 'string' ? emailParam : '';
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (isResending || !email) return;

    setIsResending(true);
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
      setIsResending(false);
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
            borderColor: theme.lineSoft,
            backgroundColor: theme.card,
            shadowColor: '#171B4D',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 4,
          }}
        >
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
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#2E7D32',
              }}
            >
              <Icon name="check" size={25} color="#FFFFFF" />
            </View>
          </View>

          <AppText
            variant="heading"
            accessibilityRole="header"
            style={{
              color: theme.brandText,
              fontSize: 24,
              lineHeight: 31,
              textAlign: 'center',
            }}
          >
            Check Your Email
          </AppText>
          <AppText style={{ marginTop: 12, textAlign: 'center' }}>
            We&apos;ve sent a verification link to{' '}
            <AppText style={{ fontWeight: '600' }}>{email || 'your email address'}</AppText>.
          </AppText>
          <AppText variant="muted" style={{ marginTop: 4, textAlign: 'center' }}>
            Please check your inbox and click the verification link to activate your account.
          </AppText>

          <View
            style={{
              width: '100%',
              height: 1,
              marginTop: 24,
              marginBottom: 18,
              backgroundColor: theme.lineSoft,
            }}
          />

          <AppText variant="small" style={{ textAlign: 'center' }}>
            Didn&apos;t receive the email?
          </AppText>
          <Pressable
            onPress={() => void handleResend()}
            disabled={isResending || !email}
            accessibilityRole="button"
            accessibilityState={{
              disabled: isResending || !email,
              busy: isResending,
            }}
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
              borderColor: theme.brandText,
              borderRadius: 12,
              backgroundColor: theme.card,
              opacity: isResending || !email ? 0.6 : pressed ? 0.8 : 1,
            })}
          >
            {isResending ? <ActivityIndicator size="small" color={theme.brandText} /> : null}
            <AppText variant="strong" style={{ color: theme.brandText }}>
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </AppText>
          </Pressable>

          {message ? (
            <AppText
              accessibilityLiveRegion="polite"
              style={{ marginTop: 12, color: '#2E7D32', textAlign: 'center' }}
            >
              {message}
            </AppText>
          ) : null}
          {error ? (
            <AppText
              accessibilityLiveRegion="polite"
              style={{
                marginTop: 12,
                color: theme.accentText,
                textAlign: 'center',
              }}
            >
              {error}
            </AppText>
          ) : null}

          <Pressable
            onPress={() => router.replace(ROUTES.LOGIN)}
            accessibilityRole="link"
            style={{
              minHeight: 48,
              marginTop: 8,
              paddingHorizontal: 16,
              justifyContent: 'center',
            }}
          >
            <AppText variant="strong" style={{ color: theme.brandText }}>
              Go to Login
            </AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
