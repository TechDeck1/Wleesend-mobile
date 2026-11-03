import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import type { TextInputProps } from 'react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts, useTheme, type Palette } from '@/theme';
import { ApiError, ApiTimeoutError } from '@/api/request';
import { resetPassword } from '@/services/accountService';
import { SymbolView } from 'expo-symbols';

const MIN_PASSWORD_LENGTH = 8;

type FieldKey = 'oldPin' | 'newPin' | 'confirmPin';
type Values = Record<FieldKey, string>;
type FieldErrors = Partial<Record<FieldKey, string>>;

const EMPTY: Values = { oldPin: '', newPin: '', confirmPin: '' };


function getPasswordRuleError(password: string): string | null {
  const missing: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) missing.push(`at least ${MIN_PASSWORD_LENGTH} characters`);
  if (!/^[A-Z]/.test(password)) missing.push('a capital letter as the first character');
  if (!/\d/.test(password)) missing.push('a number');
  if (!/[^A-Za-z0-9\s]/.test(password)) missing.push('a symbol (e.g. @ # $ !)');

  return missing.length > 0 ? `Password needs ${missing.join(', ')}.` : null;
}

function validate(values: Values): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.oldPin) errors.oldPin = 'Enter your current password.';

  if (!values.newPin) errors.newPin = 'Enter a new password.';
  else {
    const ruleError = getPasswordRuleError(values.newPin);
    if (ruleError) errors.newPin = ruleError;
    else if (values.newPin === values.oldPin)
      errors.newPin = 'Choose a password different from your current one.';
  }

  if (!values.confirmPin) errors.confirmPin = 'Confirm your new password.';
  else if (values.confirmPin !== values.newPin) errors.confirmPin = 'Passwords do not match.';

  return errors;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiTimeoutError) {
    return 'The request timed out. Check your connection and try again.';
  }
  if ((error as { status?: number })?.status === 401) {
    return 'Your session has expired. Log in again to reset your password.';
  }
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const [values, setValues] = useState<Values>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const runIdRef = useRef(0);

  const resetScreen = useCallback(() => {
    runIdRef.current += 1;
    setValues(EMPTY);
    setFieldErrors({});
    setFormError(null);
    setSubmitting(false);
    setSuccessMessage(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return resetScreen;
    }, [resetScreen]),
  );

  const setField = (key: FieldKey) => (text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    if (formError) setFormError(null);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const onSubmit = async () => {
    if (submitting) return;

    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const runId = runIdRef.current;
    setSubmitting(true);
    setFormError(null);
    try {
      const message = await resetPassword({
        oldPin: values.oldPin,
        newPin: values.newPin,
        confirmPin: values.confirmPin,
      });
      if (runId !== runIdRef.current) return; 
      setValues(EMPTY); 
      setSuccessMessage(message);
    } catch (error) {
      if (runId !== runIdRef.current) return;
      setFormError(getErrorMessage(error));
    } finally {
      if (runId === runIdRef.current) setSubmitting(false);
    }
  };

  if (successMessage !== null) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.successWrap}>
          <View style={styles.successBadge} accessibilityElementsHidden>
            <Text style={styles.successTick}>✓</Text>
          </View>
          <Text style={styles.title} accessibilityRole="header">
            Password reset
          </Text>
          <Text style={[styles.subtitle, styles.centerText]}>
            Your password was changed successfully. Use the new password the next time you log in.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={goBack}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title} accessibilityRole="header">
            Reset password
          </Text>
          <Text style={styles.subtitle}>
            Enter your current password, then choose a new one. It needs at least 8 characters,
            starting with a capital letter, and must include a number and a symbol.
          </Text>

          {formError ? (
            <View style={styles.errorBanner} accessibilityLiveRegion="polite" accessibilityRole="alert">
              <Text style={styles.errorBannerText}>{formError}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <PasswordField
              label="Current password"
              value={values.oldPin}
              onChangeText={setField('oldPin')}
              error={fieldErrors.oldPin}
              theme={theme}
              styles={styles}
              editable={!submitting}
              returnKeyType="next"
              onSubmitEditing={() => newRef.current?.focus()}
              autoComplete="current-password"
            />
            <PasswordField
              ref={newRef}
              label="New password"
              value={values.newPin}
              onChangeText={setField('newPin')}
              error={fieldErrors.newPin}
              theme={theme}
              styles={styles}
              editable={!submitting}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              autoComplete="new-password"
            />
            <PasswordField
              ref={confirmRef}
              label="Confirm new password"
              value={values.confirmPin}
              onChangeText={setField('confirmPin')}
              error={fieldErrors.confirmPin}
              theme={theme}
              styles={styles}
              editable={!submitting}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              autoComplete="new-password"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              submitting && styles.buttonDisabled,
            ]}
            onPress={onSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting, busy: submitting }}
          >
            {submitting ? (
              <ActivityIndicator color={theme.onBrand} />
            ) : (
              <Text style={styles.buttonText}>Reset password</Text>
            )}
          </Pressable>

          <Pressable onPress={goBack} disabled={submitting} style={styles.linkButton} accessibilityRole="button">
            <Text style={styles.linkText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  theme: Palette;
  styles: ReturnType<typeof createStyles>;
} & Pick<TextInputProps, 'editable' | 'returnKeyType' | 'onSubmitEditing' | 'autoComplete'>;

const PasswordField = forwardRef<TextInput, PasswordFieldProps>(function PasswordField(
  { label, value, onChangeText, error, theme, styles, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <TextInput
          ref={ref}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={theme.muted}
          accessibilityLabel={label}
          {...rest}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          <SymbolView
            name={visible ? 'eye.slash' : 'eye'}
            size={22}
            tintColor={theme.muted}
            style={styles.toggleSymbol}
            fallback={
              <Ionicons
                name={visible ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={theme.muted}
                style={styles.toggleIcon}
              />
            }
          />
        </Pressable>
      </View>
      {error ? (
        <Text style={styles.fieldError} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

function createStyles(t: Palette) {
  return StyleSheet.create({
    flex: { flex: 1 },
    screen: { flex: 1, backgroundColor: t.ground },
    content: { padding: 20, paddingBottom: 40 },
    title: {
      fontFamily: fonts.display,
      fontSize: 26,
      color: t.ink,
      marginBottom: 6,
    },
    subtitle: { fontSize: 15, lineHeight: 22, color: t.muted, marginBottom: 20 },
    centerText: { textAlign: 'center' },

    card: {
      backgroundColor: t.card,
      borderColor: t.line,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
    },
    fieldWrap: { marginBottom: 16 },
    label: { fontSize: 14, color: t.label, marginBottom: 6, fontWeight: '500' },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.field,
      borderColor: t.fieldBorder,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
    },
    inputRowError: { borderColor: t.accent },
    input: { flex: 1, fontSize: 16, color: t.ink, paddingVertical: 13 },
    toggleIcon: { marginLeft: 12 },
    toggleSymbol: { width: 22, height: 22, marginLeft: 12 },
    fieldError: { marginTop: 6, fontSize: 13, color: t.accentText },

    errorBanner: {
      backgroundColor: t.accentTint,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
    },
    errorBannerText: { color: t.accentTintText, fontSize: 14, lineHeight: 20 },

    button: {
      backgroundColor: t.brand,
      borderRadius: 14,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      alignSelf: 'stretch',
    },
    buttonPressed: { opacity: 0.88 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { fontFamily: fonts.displayMedium, fontSize: 16, color: t.onBrand },
    linkButton: { alignItems: 'center', paddingVertical: 16 },
    linkText: { fontSize: 15, color: t.brandText, fontWeight: '600' },

    successWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    successBadge: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: t.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    successTick: { fontSize: 38, color: t.onBrand, fontWeight: '700' },
  });
}