import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View, type TextInputInstance } from 'react-native';

import { ApiError} from '@/api/client';
import { Button, Card, Field, Footer, NavBar, Screen, AppText, Tile } from '@/components/UiComponents';
import { useStore } from '@/store';
import { useTheme } from '@/theme';
import { sendDualEmailOtp, verifyDualEmailOtp } from '@/services/accountService';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const OTP_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const GENERIC_ERROR = 'Something went wrong. Please try again.';

function requestError(error: unknown): string {
  return error instanceof ApiError && error.status === 400 ? error.message : GENERIC_ERROR;
}

function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function ChangeEmailScreen() {
  const theme = useTheme();
  const { user, changeEmail } = useStore();
  const firstOtpInput = useRef<TextInputInstance>(null);
  const [newEmail, setNewEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [firstOtp, setFirstOtp] = useState('');
  const [secondOtp, setSecondOtp] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [busy, setBusy] = useState<'send' | 'resend' | 'verify' | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const expiredAt = useRef<number | null>(null);
  const requestGeneration = useRef(0);

  const resetForm = useCallback(() => {
    setNewEmail('');
    setSentTo('');
    setFirstOtp('');
    setSecondOtp('');
    setEmailError('');
    setOtpError('');
    setBusy(null);
    setStep(1);
    setIsSuccess(false);
    setExpiresAt(null);
    setResendAvailableAt(null);
    setNow(0);
    expiredAt.current = null;
  }, []);

  useFocusEffect(
    useCallback(() => {
      requestGeneration.current += 1;
      resetForm();
      return () => {
        requestGeneration.current += 1;
        resetForm();
      };
    }, [resetForm]),
  );

  const expirySeconds =
    expiresAt === null ? 0 : Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const resendSeconds =
    resendAvailableAt === null ? 0 : Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));

  useEffect(() => {
    if (step !== 2 || isSuccess) return;
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (expiresAt !== null && currentTime >= expiresAt && expiredAt.current !== expiresAt) {
        expiredAt.current = expiresAt;
        setFirstOtp('');
        setSecondOtp('');
        setOtpError('These OTPs have expired. Resend OTPs to continue.');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, step, isSuccess]);

  useEffect(() => {
    if (step !== 2) return;
    const focusTimer = setTimeout(() => firstOtpInput.current?.focus(), 100);
    return () => clearTimeout(focusTimer);
  }, [step]);

  if (!user) return null;

  const handleSendOtp = async (isResend = false) => {
    const trimmedEmail = newEmail.trim();
    if (!isResend) {
      if (!EMAIL_PATTERN.test(trimmedEmail)) {
        setEmailError('Enter a valid email address, like name@example.com.');
        return;
      }
      if (trimmedEmail.toLowerCase() === user.email.toLowerCase()) {
        setEmailError('That is already your email address.');
        return;
      }
    }
    if (busy !== null || (isResend && resendSeconds > 0)) return;

    setEmailError('');
    setOtpError('');
    if (isResend) {
      setFirstOtp('');
      setSecondOtp('');
    }
    setBusy(isResend ? 'resend' : 'send');
    const generation = requestGeneration.current;
    const requestedAt = Date.now();
    if (isResend) setResendAvailableAt(requestedAt + RESEND_COOLDOWN_MS);

    try {
      const response = await sendDualEmailOtp({
        firstEmail: user.email.trim(),
        secondEmail: trimmedEmail,
      });
      if (generation !== requestGeneration.current) return;
      if (!response.success) {
        const message = response.message || GENERIC_ERROR;
        if (isResend) setOtpError(message);
        else setEmailError(message);
        return;
      }

      const sentAt = Date.now();
      setSentTo(trimmedEmail);
      setFirstOtp('');
      setSecondOtp('');
      setExpiresAt(sentAt + OTP_LIFETIME_MS);
      setResendAvailableAt(sentAt + RESEND_COOLDOWN_MS);
      setNow(sentAt);
      setStep(2);
    } catch (error) {
      if (generation !== requestGeneration.current) return;
      const message = requestError(error);
      if (isResend) setOtpError(message);
      else setEmailError(message);
    } finally {
      if (generation === requestGeneration.current) setBusy(null);
    }
  };

  const handleVerify = async () => {
    if (busy !== null) return;
    if (expirySeconds === 0) {
      setFirstOtp('');
      setSecondOtp('');
      setOtpError('These OTPs have expired. Resend OTPs to continue.');
      return;
    }
    if (!/^\d{6}$/.test(firstOtp) || !/^\d{6}$/.test(secondOtp)) {
      setOtpError('Enter both 6-digit codes.');
      return;
    }

    setBusy('verify');
    setOtpError('');
    const generation = requestGeneration.current;
    try {
      const response = await verifyDualEmailOtp({
        firstEmail: user.email.trim(),
        firstOtp,
        secondEmail: sentTo,
        secondOtp,
      });
      if (generation !== requestGeneration.current) return;
      if (!response.success) {
        const message = response.message || GENERIC_ERROR;
        const requiresResend = /expired|too many (invalid )?attempts/i.test(message);
        setOtpError(
          requiresResend ? `${message} Please resend OTPs to continue.` : message,
        );
        if (requiresResend) {
          setFirstOtp('');
          setSecondOtp('');
        }
        return;
      }

      await changeEmail(sentTo);
      if (generation !== requestGeneration.current) return;
      setIsSuccess(true);
      setOtpError('');
    } catch (error) {
      if (generation !== requestGeneration.current) return;
      const message = requestError(error);
      const requiresResend =
        error instanceof ApiError &&
        error.status === 400 &&
        /expired|too many (invalid )?attempts/i.test(error.message);
      setOtpError(
        requiresResend ? `${message} Please resend OTPs to continue.` : message,
      );
      if (requiresResend) {
        setFirstOtp('');
        setSecondOtp('');
      }
    } finally {
      if (generation === requestGeneration.current) setBusy(null);
    }
  };


  return (
    <Screen
      gap={18}
      header={<NavBar title="Change email" />}
      footer={
        step === 2 && !isSuccess ? (
          <Footer>
            <Button
              label={busy === 'verify' ? 'Verifying…' : 'Verify and change email'}
              disabled={busy !== null || expirySeconds === 0}
              onPress={() => void handleVerify()}
            />
          </Footer>
        ) : null
      }>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <Tile icon={isSuccess ? 'check' : 'mail'} size={64} />
        <AppText variant="title" style={{ textAlign: 'center' }} accessibilityRole="header">
          {isSuccess ? 'Email changed' : 'Change your email'}
        </AppText>
        <AppText variant="muted" style={{ textAlign: 'center' }}>
          {isSuccess
            ? 'Your email address has been updated.'
            : step === 1
              ? 'We’ll send a separate code to your current email and your new email.'
              : 'Enter both 6-digit codes to verify and update your email.'}
        </AppText>
      </View>

      {isSuccess ? (
        <Card style={{ padding: 18, alignItems: 'center', gap: 16 }}>
          <AppText variant="strong" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
            Your email is now {sentTo}.
          </AppText>
          <Button label="Done" onPress={() => router.back()} />
        </Card>
      ) : step === 1 ? (
        <>
          <Card style={{ padding: 18, gap: 6 }}>
            <AppText variant="small">Current email</AppText>
            <AppText variant="strong">{user.email}</AppText>
          </Card>
          <Field
            label="New email address"
            required
            placeholder="Enter new email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            value={newEmail}
            onChangeText={(value) => {
              setNewEmail(value);
              setEmailError('');
            }}
            error={emailError || undefined}
          />
          <Button
            label={busy === 'send' ? 'Sending…' : 'Send OTP'}
            disabled={busy !== null}
            onPress={() => void handleSendOtp()}
          />
        </>
      ) : (
        <>
          <Card style={{ padding: 18, gap: 16 }}>
            <View style={{ gap: 4 }}>
              <AppText variant="label">Current email</AppText>
              <AppText variant="strong">{user.email}</AppText>
            </View>
            <Field
              inputRef={firstOtpInput}
              label="Current email OTP"
              required
              placeholder="6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              value={firstOtp}
              onChangeText={(value) => {
                setFirstOtp(value.replace(/\D/g, ''));
                setOtpError('');
              }}
            />
            <View style={{ height: 1, backgroundColor: theme.lineSoft }} />
            <View style={{ gap: 4 }}>
              <AppText variant="label">New email</AppText>
              <AppText variant="strong">{sentTo}</AppText>
            </View>
            <Field
              label="New email OTP"
              required
              placeholder="6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              value={secondOtp}
              onChangeText={(value) => {
                setSecondOtp(value.replace(/\D/g, ''));
                setOtpError('');
              }}
            />
          </Card>

          <AppText variant="small" accessibilityLiveRegion="polite">
            {expirySeconds > 0
              ? `Codes expire in ${formatCountdown(expirySeconds)}.`
              : 'Codes expired. Resend OTPs to continue.'}
          </AppText>
          {otpError ? (
            <AppText variant="small" accessibilityLiveRegion="polite" style={{ color: theme.accentText }}>
              {otpError}
            </AppText>
          ) : null}
          <Pressable
            onPress={() => void handleSendOtp(true)}
            disabled={busy !== null || resendSeconds > 0}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy !== null || resendSeconds > 0, busy: busy === 'resend' }}
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="strong" style={{ color: resendSeconds > 0 ? theme.muted : theme.brandText }}>
              {busy === 'resend'
                ? 'Resending…'
                : resendSeconds > 0
                  ? `Resend OTP in ${resendSeconds}s`
                  : 'Resend OTP'}
            </AppText>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
