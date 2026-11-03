import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { ApiError} from '@/api/client';
import { Button, Card, Field, Footer, NavBar, Screen, T, Tile } from '@/components/ui';
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
  const c = useTheme();
  const { user, changeEmail } = useStore();
  const firstOtpInput = useRef<TextInput>(null);
  const [newEmail, setNewEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [firstOtp, setFirstOtp] = useState('');
  const [secondOtp, setSecondOtp] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [busy, setBusy] = useState<'send' | 'resend' | 'verify' | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);
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
    if (step !== 2 || success) return;
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
  }, [expiresAt, step, success]);

  useEffect(() => {
    if (step !== 2) return;
    const focusTimer = setTimeout(() => firstOtpInput.current?.focus(), 100);
    return () => clearTimeout(focusTimer);
  }, [step]);

  if (!user) return null;

  const send = async (resend = false) => {
    const next = newEmail.trim();
    if (!resend) {
      if (!EMAIL_PATTERN.test(next)) {
        setEmailError('Enter a valid email address, like name@example.com.');
        return;
      }
      if (next.toLowerCase() === user.email.toLowerCase()) {
        setEmailError('That is already your email address.');
        return;
      }
    }
    if (busy !== null || (resend && resendSeconds > 0)) return;

    setEmailError('');
    setOtpError('');
    if (resend) {
      setFirstOtp('');
      setSecondOtp('');
    }
    setBusy(resend ? 'resend' : 'send');
    const generation = requestGeneration.current;
    const requestedAt = Date.now();
    if (resend) setResendAvailableAt(requestedAt + RESEND_COOLDOWN_MS);

    try {
      const response = await sendDualEmailOtp({
        firstEmail: user.email.trim(),
        secondEmail: next,
      });
      if (generation !== requestGeneration.current) return;
      if (!response.success) {
        const message = response.message || GENERIC_ERROR;
        if (resend) setOtpError(message);
        else setEmailError(message);
        return;
      }

      const sentAt = Date.now();
      setSentTo(next);
      setFirstOtp('');
      setSecondOtp('');
      setExpiresAt(sentAt + OTP_LIFETIME_MS);
      setResendAvailableAt(sentAt + RESEND_COOLDOWN_MS);
      setNow(sentAt);
      setStep(2);
    } catch (error) {
      if (generation !== requestGeneration.current) return;
      const message = requestError(error);
      if (resend) setOtpError(message);
      else setEmailError(message);
    } finally {
      if (generation === requestGeneration.current) setBusy(null);
    }
  };

  const verify = async () => {
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
      setSuccess(true);
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
        step === 2 && !success ? (
          <Footer>
            <Button
              label={busy === 'verify' ? 'Verifying…' : 'Verify and change email'}
              disabled={busy !== null || expirySeconds === 0}
              onPress={() => void verify()}
            />
          </Footer>
        ) : null
      }>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <Tile icon={success ? 'check' : 'mail'} size={64} />
        <T v="title" style={{ textAlign: 'center' }} accessibilityRole="header">
          {success ? 'Email changed' : 'Change your email'}
        </T>
        <T v="muted" style={{ textAlign: 'center' }}>
          {success
            ? 'Your email address has been updated.'
            : step === 1
              ? 'We’ll send a separate code to your current email and your new email.'
              : 'Enter both 6-digit codes to verify and update your email.'}
        </T>
      </View>

      {success ? (
        <Card style={{ padding: 18, alignItems: 'center', gap: 16 }}>
          <T v="strong" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
            Your email is now {sentTo}.
          </T>
          <Button label="Done" onPress={() => router.back()} />
        </Card>
      ) : step === 1 ? (
        <>
          <Card style={{ padding: 18, gap: 6 }}>
            <T v="small">Current email</T>
            <T v="strong">{user.email}</T>
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
            onPress={() => void send()}
          />
        </>
      ) : (
        <>
          <Card style={{ padding: 18, gap: 16 }}>
            <View style={{ gap: 4 }}>
              <T v="label">Current email</T>
              <T v="strong">{user.email}</T>
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
            <View style={{ height: 1, backgroundColor: c.lineSoft }} />
            <View style={{ gap: 4 }}>
              <T v="label">New email</T>
              <T v="strong">{sentTo}</T>
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

          <T v="small" accessibilityLiveRegion="polite">
            {expirySeconds > 0
              ? `Codes expire in ${formatCountdown(expirySeconds)}.`
              : 'Codes expired. Resend OTPs to continue.'}
          </T>
          {otpError ? (
            <T v="small" accessibilityLiveRegion="polite" style={{ color: c.accentText }}>
              {otpError}
            </T>
          ) : null}
          <Pressable
            onPress={() => void send(true)}
            disabled={busy !== null || resendSeconds > 0}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy !== null || resendSeconds > 0, busy: busy === 'resend' }}
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <T v="strong" style={{ color: resendSeconds > 0 ? c.muted : c.brandText }}>
              {busy === 'resend'
                ? 'Resending…'
                : resendSeconds > 0
                  ? `Resend OTP in ${resendSeconds}s`
                  : 'Resend OTP'}
            </T>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
