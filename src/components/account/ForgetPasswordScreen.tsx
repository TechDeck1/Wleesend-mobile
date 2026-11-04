import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { forgotPinRequest, updatePin, verifyCode } from '@/services/accountService';
import { fonts, useTheme } from '@/theme';
import type {
  ErrorTextProps,
  ForgotPasswordPasswordFieldProps,
  ForgotPasswordScreenProps,
  ForgotPasswordStep,
  ForgotPasswordTextFieldProps,
  OtpInputProps,
  PrimaryButtonProps,
  SuccessModalProps,
} from '@/types/screens/ForgotPasswordScreen.types';
import { MIN_PASSWORD_LENGTH, OTP_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from '@/constants/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseOtp(text: string): string {
  const exact = text.match(new RegExp(`\\b\\d{${OTP_LENGTH}}\\b`));
  if (exact) return exact[0];
  return text.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export default function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const palette = useTheme();

  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timeoutId = setTimeout(() => setSecondsLeft((secondsRemaining) => secondsRemaining - 1), 1000);
    return () => clearTimeout(timeoutId);
  }, [secondsLeft]);

  const runAsyncTask = async (task: () => Promise<void>) => {
    setError(null);
    setIsLoading(true);
    try {
      await task();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = () => {
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    runAsyncTask(async () => {
      await forgotPinRequest({ email: trimmedEmail });
      setOtp('');
      setSecondsLeft(OTP_RESEND_COOLDOWN_SECONDS);
      setStep('otp');
    });
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    runAsyncTask(async () => {
      await forgotPinRequest({ email: email.trim() });
      setOtp('');
      setSecondsLeft(OTP_RESEND_COOLDOWN_SECONDS);
    });
  };

  const handleVerifyOtp = () => {
    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    runAsyncTask(async () => {
      await verifyCode({ email: email.trim(), code: otp });
      setPassword('');
      setConfirm('');
      setStep('reset');
    });
  };

  const handleResetPassword = () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
      return;
    }
    if (password !== confirm) {
      setError('The passwords do not match.');
      return;
    }
    runAsyncTask(async () => {
      await updatePin({
        email: email.trim(),
        code: otp,
        newPin: password,
        confirmPin: confirm,
      });
      setIsSuccessModalVisible(true);
    });
  };

  const handleBack = () => {
    setError(null);
    if (step === 'otp') setStep('email');
    else onBack();
  };

  const copy = {
    email: {
      title: 'Reset your password',
      body: `Enter the email you signed up with and we will send you a ${OTP_LENGTH}-digit code.`,
    },
    otp: {
      title: 'Enter the code',
      body: `We sent a ${OTP_LENGTH}-digit code to ${email.trim()}. It expires in a few minutes.`,
    },
    reset: {
      title: 'Choose a new password',
      body: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    },
  }[step];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.ground }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={step === 'otp' ? 'Change email' : 'Back to sign in'}
            hitSlop={12}
            style={styles.back}
          >
            <View style={[styles.backCircle, { backgroundColor: palette.card, borderColor: palette.line }]}>
              <View style={[styles.chevron, { borderColor: palette.brandText }]} />
            </View>
            <Text style={[styles.backText, { color: palette.brandText, fontFamily: fonts.displayMedium }]}>
              {step === 'otp' ? 'Change email' : 'Sign in'}
            </Text>
          </Pressable>

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <Text style={[styles.title, { color: palette.ink, fontFamily: fonts.display }]}>
              {copy.title}
            </Text>
            <Text style={[styles.body, { color: palette.muted }]}>{copy.body}</Text>

            {step === 'email' && (
              <>
                <Text style={[styles.label, { color: palette.label }]}>Email</Text>
                <TextField
                  palette={palette}
                  value={email}
                  onChangeText={(emailValue) => {
                    setEmail(emailValue);
                    if (error) setError(null);
                  }}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={handleSendOtp}
                  editable={!isLoading}
                  hasError={!!error}
                />
                <ErrorText palette={palette} message={error} />
                <PrimaryButton palette={palette} label="Send code" isLoading={isLoading} onPress={handleSendOtp} />
              </>
            )}

            {step === 'otp' && (
              <>
                <OtpInput
                  palette={palette}
                  value={otp}
                  onChange={(otpValue) => {
                    setOtp(otpValue);
                    if (error) setError(null);
                  }}
                  hasError={!!error}
                  disabled={isLoading}
                />
                <ErrorText palette={palette} message={error} />
                <PrimaryButton palette={palette} label="Verify code" isLoading={isLoading} onPress={handleVerifyOtp} />

                <Pressable
                  onPress={handleResend}
                  disabled={secondsLeft > 0 || isLoading}
                  accessibilityRole="button"
                  style={styles.linkWrap}
                >
                  <Text style={[styles.link, { color: secondsLeft > 0 ? palette.muted : palette.brandText }]}>
                    {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
                  </Text>
                </Pressable>
              </>
            )}

            {step === 'reset' && (
              <>
                <Text style={[styles.label, { color: palette.label }]}>New password</Text>
                <PasswordField
                  palette={palette}
                  value={password}
                  onChangeText={(passwordValue) => {
                    setPassword(passwordValue);
                    if (error) setError(null);
                  }}
                  placeholder="New password"
                  returnKeyType="next"
                  editable={!isLoading}
                  hasError={!!error}
                />

                <Text style={[styles.label, styles.labelSpaced, { color: palette.label }]}>
                  Confirm password
                </Text>
                <PasswordField
                  palette={palette}
                  value={confirm}
                  onChangeText={(confirmValue) => {
                    setConfirm(confirmValue);
                    if (error) setError(null);
                  }}
                  placeholder="Re-enter new password"
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                  editable={!isLoading}
                  hasError={!!error}
                />
                <ErrorText palette={palette} message={error} />
                <PrimaryButton
                  palette={palette}
                  label="Update password"
                  isLoading={isLoading}
                  onPress={handleResetPassword}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        palette={palette}
        isVisible={isSuccessModalVisible}
        title="Password updated"
        message="Your password has been changed. Sign in with your new password to continue."
        buttonLabel="Back to sign in"
        onPress={onBack}
      />
    </SafeAreaView>
  );
}

function SuccessModal({
  palette,
  isVisible,
  title,
  message,
  buttonLabel,
  onPress,
}: SuccessModalProps) {
  const [scale] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    if (!isVisible) return;
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, [isVisible, scale]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onPress}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
          <Animated.View
            style={[styles.tickRing, { backgroundColor: palette.brandTint, transform: [{ scale }] }]}
          >
            <View style={[styles.tickCircle, { backgroundColor: palette.brand }]}>
              <View style={[styles.tick, { borderColor: palette.onBrand }]} />
            </View>
          </Animated.View>

          <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: fonts.display }]}>
            {title}
          </Text>
          <Text style={[styles.modalBody, { color: palette.muted }]}>{message}</Text>

          <PrimaryButton palette={palette} label={buttonLabel} onPress={onPress} style={styles.modalButton} />
        </View>
      </View>
    </Modal>
  );
}

function TextField({ palette, hasError, style, ...rest }: ForgotPasswordTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <TextInput
      {...rest}
      onFocus={(focusEvent) => {
        setIsFocused(true);
        rest.onFocus?.(focusEvent);
      }}
      onBlur={(blurEvent) => {
        setIsFocused(false);
        rest.onBlur?.(blurEvent);
      }}
      placeholderTextColor={palette.muted}
      style={[
        styles.input,
        {
          backgroundColor: palette.field,
          color: palette.ink,
          borderColor: hasError ? palette.accent : isFocused ? palette.brand : palette.fieldBorder,
        },
        style,
      ]}
    />
  );
}

function PasswordField(props: ForgotPasswordPasswordFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { palette } = props;
  return (
    <View>
      <TextField
        {...props}
        secureTextEntry={!isPasswordVisible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        style={{ paddingRight: 64 }}
      />
      <Pressable
        onPress={() => setIsPasswordVisible((isVisible) => !isVisible)}
        accessibilityRole="button"
        accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
        hitSlop={8}
        style={styles.eye}
      >
        <Text style={[styles.eyeText, { color: palette.brandText }]}>{isPasswordVisible ? 'Hide' : 'Show'}</Text>
      </Pressable>
    </View>
  );
}

function OtpInput({
  palette,
  value,
  onChange,
  hasError,
  disabled,
}: OtpInputProps) {
  const inputRef = useRef<TextInputInstance>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, []);

  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel="One-time code">
      <View style={styles.otpRow}>
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const isActive = isFocused && i === activeIndex;
          return (
            <View
              key={i}
              style={[
                styles.otpBox,
                {
                  backgroundColor: palette.field,
                  borderColor: hasError ? palette.accent : isActive ? palette.brand : palette.fieldBorder,
                },
              ]}
            >
              <Text style={[styles.otpDigit, { color: palette.ink, fontFamily: fonts.display }]}>
                {value[i] ?? ''}
              </Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(otpValue) => onChange(parseOtp(otpValue))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        editable={!disabled}
        caretHidden
        style={styles.otpHidden}
      />
    </Pressable>
  );
}

function ErrorText({ palette, message }: ErrorTextProps) {
  if (!message) return null;
  return (
    <Text accessibilityLiveRegion="polite" style={[styles.error, { color: palette.accentText }]}>
      {message}
    </Text>
  );
}

function PrimaryButton({
  palette,
  label,
  onPress,
  isLoading,
  style,
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.brand, opacity: pressed || isLoading ? 0.85 : 1 },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={palette.onBrand} />
      ) : (
        <Text style={[styles.buttonText, { color: palette.onBrand, fontFamily: fonts.displayMedium }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  content: { flexGrow: 1, padding: 20 },
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    transform: [{ rotate: '45deg' }],
    marginLeft: 3,
  },
  backText: { fontSize: 16 },
  card: { borderWidth: 1, borderRadius: 16, padding: 24 },
  title: { fontSize: 24, lineHeight: 30, marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  labelSpaced: { marginTop: 16 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 16,
  },
  eye: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeText: { fontSize: 14, fontWeight: '600' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: { fontSize: 22 },
  otpHidden: { ...StyleSheet.absoluteFill, opacity: 0 },
  error: { fontSize: 13, marginTop: 10 },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonText: { fontSize: 16 },
  linkWrap: { alignItems: 'center', paddingVertical: 14 },
  link: { fontSize: 15, fontWeight: '500' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 15, 43, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  tickRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  tickCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 14,
    height: 26,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    transform: [{ rotate: '45deg' }, { translateY: -2 }],
  },
  modalTitle: { fontSize: 22, lineHeight: 28, textAlign: 'center', marginBottom: 8 },
  modalBody: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  modalButton: { alignSelf: 'stretch', marginTop: 28 },
});
