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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { forgotPinRequest, updatePin, verifyCode } from '@/services/accountService';
import { fonts, useTheme, type Palette } from '../theme';

type Props = {
  onBack: () => void;
};

type Step = 'email' | 'otp' | 'reset';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;
const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseOtp(text: string): string {
  const exact = text.match(new RegExp(`\\b\\d{${OTP_LENGTH}}\\b`));
  if (exact) return exact[0];
  return text.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export default function ForgotPasswordScreen({ onBack }: Props) {
  const t = useTheme();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const run = async (task: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = () => {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError('Enter a valid email address.');
      return;
    }
    run(async () => {
      await forgotPinRequest({ email: value });
      setOtp('');
      setSecondsLeft(RESEND_SECONDS);
      setStep('otp');
    });
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    run(async () => {
      await forgotPinRequest({ email: email.trim() });
      setOtp('');
      setSecondsLeft(RESEND_SECONDS);
    });
  };

  const handleVerifyOtp = () => {
    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    run(async () => {
      await verifyCode({ email: email.trim(), code: otp });
      setPassword('');
      setConfirm('');
      setStep('reset');
    });
  };

  const handleResetPassword = () => {
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }
    if (password !== confirm) {
      setError('The passwords do not match.');
      return;
    }
    run(async () => {
      await updatePin({
        email: email.trim(),
        code: otp,
        newPin: password,
        confirmPin: confirm,
      });
      setSuccessVisible(true);
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
      body: 'Enter the email you signed up with and we will send you a 6-digit code.',
    },
    otp: {
      title: 'Enter the code',
      body: `We sent a ${OTP_LENGTH}-digit code to ${email.trim()}. It expires in a few minutes.`,
    },
    reset: {
      title: 'Choose a new password',
      body: `Use at least ${MIN_PASSWORD} characters.`,
    },
  }[step];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.ground }]}>
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
            <View style={[styles.backCircle, { backgroundColor: t.card, borderColor: t.line }]}>
              <View style={[styles.chevron, { borderColor: t.brandText }]} />
            </View>
            <Text style={[styles.backText, { color: t.brandText, fontFamily: fonts.displayMedium }]}>
              {step === 'otp' ? 'Change email' : 'Sign in'}
            </Text>
          </Pressable>

          <View style={[styles.card, { backgroundColor: t.card, borderColor: t.line }]}>
            <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>
              {copy.title}
            </Text>
            <Text style={[styles.body, { color: t.muted }]}>{copy.body}</Text>

            {step === 'email' && (
              <>
                <Text style={[styles.label, { color: t.label }]}>Email</Text>
                <TextField
                  t={t}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
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
                  editable={!loading}
                  hasError={!!error}
                />
                <ErrorText t={t} message={error} />
                <PrimaryButton t={t} label="Send code" loading={loading} onPress={handleSendOtp} />
              </>
            )}

            {step === 'otp' && (
              <>
                <OtpInput
                  t={t}
                  value={otp}
                  onChange={(v) => {
                    setOtp(v);
                    if (error) setError(null);
                  }}
                  hasError={!!error}
                  disabled={loading}
                />
                <ErrorText t={t} message={error} />
                <PrimaryButton t={t} label="Verify code" loading={loading} onPress={handleVerifyOtp} />

                <Pressable
                  onPress={handleResend}
                  disabled={secondsLeft > 0 || loading}
                  accessibilityRole="button"
                  style={styles.linkWrap}
                >
                  <Text style={[styles.link, { color: secondsLeft > 0 ? t.muted : t.brandText }]}>
                    {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
                  </Text>
                </Pressable>
              </>
            )}

            {step === 'reset' && (
              <>
                <Text style={[styles.label, { color: t.label }]}>New password</Text>
                <PasswordField
                  t={t}
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (error) setError(null);
                  }}
                  placeholder="New password"
                  returnKeyType="next"
                  editable={!loading}
                  hasError={!!error}
                />

                <Text style={[styles.label, styles.labelSpaced, { color: t.label }]}>
                  Confirm password
                </Text>
                <PasswordField
                  t={t}
                  value={confirm}
                  onChangeText={(v) => {
                    setConfirm(v);
                    if (error) setError(null);
                  }}
                  placeholder="Re-enter new password"
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                  editable={!loading}
                  hasError={!!error}
                />
                <ErrorText t={t} message={error} />
                <PrimaryButton
                  t={t}
                  label="Update password"
                  loading={loading}
                  onPress={handleResetPassword}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        t={t}
        visible={successVisible}
        title="Password updated"
        message="Your password has been changed. Sign in with your new password to continue."
        buttonLabel="Back to sign in"
        onPress={onBack}
      />
    </SafeAreaView>
  );
}

function SuccessModal({
  t,
  visible,
  title,
  message,
  buttonLabel,
  onPress,
}: {
  t: Palette;
  visible: boolean;
  title: string;
  message: string;
  buttonLabel: string;
  onPress: () => void;
}) {
  const [scale] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, [visible, scale]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onPress}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: t.card, borderColor: t.line }]}>
          <Animated.View
            style={[styles.tickRing, { backgroundColor: t.brandTint, transform: [{ scale }] }]}
          >
            <View style={[styles.tickCircle, { backgroundColor: t.brand }]}>
              <View style={[styles.tick, { borderColor: t.onBrand }]} />
            </View>
          </Animated.View>

          <Text style={[styles.modalTitle, { color: t.ink, fontFamily: fonts.display }]}>
            {title}
          </Text>
          <Text style={[styles.modalBody, { color: t.muted }]}>{message}</Text>

          <PrimaryButton t={t} label={buttonLabel} onPress={onPress} style={styles.modalButton} />
        </View>
      </View>
    </Modal>
  );
}

type TextFieldProps = React.ComponentProps<typeof TextInput> & {
  t: Palette;
  hasError?: boolean;
};

function TextField({ t, hasError, style, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...rest}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      placeholderTextColor={t.muted}
      style={[
        styles.input,
        {
          backgroundColor: t.field,
          color: t.ink,
          borderColor: hasError ? t.accent : focused ? t.brand : t.fieldBorder,
        },
        style,
      ]}
    />
  );
}

function PasswordField(props: TextFieldProps) {
  const [visible, setVisible] = useState(false);
  const { t } = props;
  return (
    <View>
      <TextField
        {...props}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        style={{ paddingRight: 64 }}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        hitSlop={8}
        style={styles.eye}
      >
        <Text style={[styles.eyeText, { color: t.brandText }]}>{visible ? 'Hide' : 'Show'}</Text>
      </Pressable>
    </View>
  );
}

function OtpInput({
  t,
  value,
  onChange,
  hasError,
  disabled,
}: {
  t: Palette;
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
  disabled: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, []);

  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel="One-time code">
      <View style={styles.otpRow}>
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const isActive = focused && i === activeIndex;
          return (
            <View
              key={i}
              style={[
                styles.otpBox,
                {
                  backgroundColor: t.field,
                  borderColor: hasError ? t.accent : isActive ? t.brand : t.fieldBorder,
                },
              ]}
            >
              <Text style={[styles.otpDigit, { color: t.ink, fontFamily: fonts.display }]}>
                {value[i] ?? ''}
              </Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(v) => onChange(parseOtp(v))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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

function ErrorText({ t, message }: { t: Palette; message: string | null }) {
  if (!message) return null;
  return (
    <Text accessibilityLiveRegion="polite" style={[styles.error, { color: t.accentText }]}>
      {message}
    </Text>
  );
}

function PrimaryButton({
  t,
  label,
  onPress,
  loading,
  style,
}: {
  t: Palette;
  label: string;
  onPress: () => void;
  loading?: boolean;
  style?: React.ComponentProps<typeof View>['style'];
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: t.brand, opacity: pressed || loading ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.onBrand} />
      ) : (
        <Text style={[styles.buttonText, { color: t.onBrand, fontFamily: fonts.displayMedium }]}>
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