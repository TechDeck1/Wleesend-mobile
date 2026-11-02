import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import {
  ApiError,
  type SendDualEmailOtpPayload,
} from '@/api/client';
import { Button, Card, Field, NavBar, Screen, T, Tile } from '@/components/ui';
import { useTheme } from '@/theme';
import { sendDualEmailOtp, verifyDualEmailOtp } from '@/api/email-change';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const OTP_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const GENERIC_ERROR = 'Something went wrong. Please try again.';

type EmailErrors = Partial<Record<keyof SendDualEmailOtpPayload, string>>;
type OtpErrors = { firstOtp?: string; secondOtp?: string; form?: string };

function validateEmails(firstEmail: string, secondEmail: string): EmailErrors {
  const errors: EmailErrors = {};
  const first = firstEmail.trim();
  const second = secondEmail.trim();

  if (!first) {
    errors.firstEmail = 'Enter the first email address.';
  } else if (!EMAIL_PATTERN.test(first)) {
    errors.firstEmail = 'Enter a valid email address.';
  }

  if (!second) {
    errors.secondEmail = 'Enter the second email address.';
  } else if (!EMAIL_PATTERN.test(second)) {
    errors.secondEmail = 'Enter a valid email address.';
  }

  if (first && second && first.toLowerCase() === second.toLowerCase()) {
    errors.secondEmail = 'Enter a different email address.';
  }

  return errors;
}

function getRequestError(error: unknown): string {
  return error instanceof ApiError && error.status === 400 ? error.message : GENERIC_ERROR;
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export default function VerifyEmailsScreen() {
  const c = useTheme();
  const firstOtpInput = useRef<TextInput>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [firstEmail, setFirstEmail] = useState('');
  const [secondEmail, setSecondEmail] = useState('');
  const [emailErrors, setEmailErrors] = useState<EmailErrors>({});
  const [firstOtp, setFirstOtp] = useState('');
  const [secondOtp, setSecondOtp] = useState('');
  const [otpErrors, setOtpErrors] = useState<OtpErrors>({});
  const [busy, setBusy] = useState<'send' | 'resend' | 'verify' | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const expiredExpiry = useRef<number | null>(null);

  const expirySeconds = expiresAt === null ? 0 : Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const resendSeconds =
    resendAvailableAt === null ? 0 : Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));

  useEffect(() => {
    if (step !== 2 || success) return;
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (
        expiresAt !== null &&
        currentTime >= expiresAt &&
        expiredExpiry.current !== expiresAt
      ) {
        expiredExpiry.current = expiresAt;
        setFirstOtp('');
        setSecondOtp('');
        setOtpErrors({ form: 'These OTPs have expired. Resend OTPs to continue.' });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, step, success]);

  useEffect(() => {
    if (step === 2) {
      const focusTimer = setTimeout(() => firstOtpInput.current?.focus(), 100);
      return () => clearTimeout(focusTimer);
    }
  }, [step]);

  const send = async () => {
    const errors = validateEmails(firstEmail, secondEmail);
    setEmailErrors(errors);
    setOtpErrors({});
    if (Object.keys(errors).length > 0 || busy !== null) return;

    setBusy('send');
    const payload = {
      firstEmail: firstEmail.trim(),
      secondEmail: secondEmail.trim(),
    };
    try {
      const response = await sendDualEmailOtp(payload);
      if (!response.success) {
        setEmailErrors({ firstEmail: response.message || GENERIC_ERROR });
        return;
      }

      const sentAt = Date.now();
      setFirstEmail(payload.firstEmail);
      setSecondEmail(payload.secondEmail);
      setFirstOtp('');
      setSecondOtp('');
      setExpiresAt(sentAt + OTP_LIFETIME_MS);
      setResendAvailableAt(sentAt + RESEND_COOLDOWN_MS);
      setNow(sentAt);
      setSuccessMessage('');
      setStep(2);
    } catch (error) {
      setEmailErrors({ firstEmail: getRequestError(error) });
    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    if (busy !== null || resendSeconds > 0) return;

    setFirstOtp('');
    setSecondOtp('');
    setOtpErrors({});
    setBusy('resend');
    const requestedAt = Date.now();
    setResendAvailableAt(requestedAt + RESEND_COOLDOWN_MS);
    try {
      const response = await sendDualEmailOtp({
        firstEmail: firstEmail.trim(),
        secondEmail: secondEmail.trim(),
      });
      if (!response.success) {
        setOtpErrors({ form: response.message || GENERIC_ERROR });
        return;
      }
      const sentAt = Date.now();
      setExpiresAt(sentAt + OTP_LIFETIME_MS);
      setNow(sentAt);
    } catch (error) {
      setOtpErrors({ form: getRequestError(error) });
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    if (busy !== null) return;
    if (expirySeconds === 0) {
      setOtpErrors({ form: 'These OTPs have expired. Resend OTPs to continue.' });
      setFirstOtp('');
      setSecondOtp('');
      return;
    }

    const errors: OtpErrors = {};
    if (!/^\d{6}$/.test(firstOtp)) errors.firstOtp = 'Enter the 6-digit code.';
    if (!/^\d{6}$/.test(secondOtp)) errors.secondOtp = 'Enter the 6-digit code.';
    setOtpErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy('verify');
    try {
      const response = await verifyDualEmailOtp({
        firstEmail: firstEmail.trim(),
        firstOtp,
        secondEmail: secondEmail.trim(),
        secondOtp,
      });
      if (!response.success) {
        const message = response.message || GENERIC_ERROR;
        const requiresResend = /expired|too many (invalid )?attempts/i.test(message);
        setOtpErrors({
          form: requiresResend ? `${message} Please resend OTPs to continue.` : message,
        });
        if (requiresResend) {
          setFirstOtp('');
          setSecondOtp('');
        }
        return;
      }
      setSuccessMessage(response.message);
      setSuccess(true);
      setOtpErrors({});
    } catch (error) {
      const message = getRequestError(error);
      const requiresResend =
        error instanceof ApiError &&
        error.status === 400 &&
        /expired|too many (invalid )?attempts/i.test(error.message);
      setOtpErrors({
        form: requiresResend ? `${message} Please resend OTPs to continue.` : message,
      });
      if (requiresResend) {
        setFirstOtp('');
        setSecondOtp('');
      }
    } finally {
      setBusy(null);
    }
  };

  const changeEmails = () => {
    setStep(1);
    setSuccess(false);
    setSuccessMessage('');
    setFirstOtp('');
    setSecondOtp('');
    setOtpErrors({});
    setEmailErrors({});
    setExpiresAt(null);
    setResendAvailableAt(null);
  };

  return (
    <Screen gap={18} header={<NavBar title="Verify emails" />}>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <Tile icon={success ? 'check' : 'mail'} size={64} />
        <T v="title" style={{ textAlign: 'center' }} accessibilityRole="header">
          {success ? 'Both emails verified' : 'Verify two email addresses'}
        </T>
        <T v="muted" style={{ textAlign: 'center' }}>
          {success
            ? 'Both email addresses have been verified successfully.'
            : step === 1
              ? 'We’ll send a separate one-time code to each email address.'
              : 'Enter the 6-digit codes sent to each email address.'}
        </T>
      </View>

      {success ? (
        <Card style={{ padding: 18, alignItems: 'center', gap: 8 }}>
          <T v="strong" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
            {successMessage || 'Both emails verified successfully.'}
          </T>
          <T v="muted" style={{ textAlign: 'center' }}>
            You can continue to the next step.
          </T>
          {/* TODO: Navigate to the next account-verification step when that route is available. */}
        </Card>
      ) : step === 1 ? (
        <>
          <Card style={{ padding: 18, gap: 16 }}>
            <Field
              label="First email address"
              required
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={firstEmail}
              onChangeText={(value) => {
                setFirstEmail(value);
                setEmailErrors({});
              }}
              error={emailErrors.firstEmail}
            />
            <Field
              label="Second email address"
              required
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={secondEmail}
              onChangeText={(value) => {
                setSecondEmail(value);
                setEmailErrors({});
              }}
              error={emailErrors.secondEmail}
            />
          </Card>
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
              <T v="label">First email</T>
              <T v="strong">{firstEmail}</T>
            </View>
            <Field
              inputRef={firstOtpInput}
              label="First email OTP"
              required
              placeholder="6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              value={firstOtp}
              onChangeText={(value) => {
                setFirstOtp(value.replace(/\D/g, ''));
                setOtpErrors((current) => ({ ...current, firstOtp: undefined, form: undefined }));
              }}
              error={otpErrors.firstOtp}
            />
            <View style={{ height: 1, backgroundColor: c.lineSoft }} />
            <View style={{ gap: 4 }}>
              <T v="label">Second email</T>
              <T v="strong">{secondEmail}</T>
            </View>
            <Field
              label="Second email OTP"
              required
              placeholder="6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              value={secondOtp}
              onChangeText={(value) => {
                setSecondOtp(value.replace(/\D/g, ''));
                setOtpErrors((current) => ({ ...current, secondOtp: undefined, form: undefined }));
              }}
              error={otpErrors.secondOtp}
            />
          </Card>

          <T v="small" accessibilityLiveRegion="polite">
            {expirySeconds > 0
              ? `Codes expire in ${formatCountdown(expirySeconds)}.`
              : 'Codes expired. Resend OTPs to continue.'}
          </T>
          {otpErrors.form ? (
            <T v="small" accessibilityLiveRegion="polite" style={{ color: c.accentText }}>
              {otpErrors.form}
            </T>
          ) : null}

          <Button
            label={busy === 'verify' ? 'Verifying…' : 'Verify'}
            disabled={busy !== null || expirySeconds === 0}
            onPress={() => void verify()}
          />

          <Pressable
            onPress={() => void resend()}
            disabled={busy !== null || resendSeconds > 0}
            accessibilityRole="button"
            accessibilityState={{
              disabled: busy !== null || resendSeconds > 0,
              busy: busy === 'resend',
            }}
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <T v="strong" style={{ color: resendSeconds > 0 ? c.muted : c.brandText }}>
              {busy === 'resend'
                ? 'Resending…'
                : resendSeconds > 0
                  ? `Resend OTP in ${resendSeconds}s`
                  : 'Resend OTP'}
            </T>
          </Pressable>

          <Pressable
            onPress={changeEmails}
            accessibilityRole="link"
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <T v="strong" style={{ color: c.brandText }}>
              Change emails
            </T>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
