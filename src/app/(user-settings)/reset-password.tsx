import { ROUTES } from '@/constants/routes';
import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts, useTheme, type Palette } from '@/theme';
import { ApiError, ApiTimeoutError } from '@/api/request';
import { resetPassword } from '@/services/accountService';
import { SymbolView } from 'expo-symbols';
import type {
  ResetPasswordFieldErrors,
  ResetPasswordFieldKey,
  ResetPasswordPasswordFieldProps,
  ResetPasswordValues,
} from '@/types/screens/ResetPasswordScreen.types';
import { MIN_PASSWORD_LENGTH } from '@/constants/auth';

const EMPTY: ResetPasswordValues = { oldPin: '', newPin: '', confirmPin: '' };

function getPasswordRuleError(password: string): string | null {
  const missing: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH)
    missing.push(`at least ${MIN_PASSWORD_LENGTH} characters`);
  if (!/^[A-Z]/.test(password)) missing.push('a capital letter as the first character');
  if (!/\d/.test(password)) missing.push('a number');
  if (!/[^A-Za-z0-9\s]/.test(password)) missing.push('a symbol (e.g. @ # $ !)');

  return missing.length > 0 ? `Password needs ${missing.join(', ')}.` : null;
}

function validate(values: ResetPasswordValues): ResetPasswordFieldErrors {
  const errors: ResetPasswordFieldErrors = {};

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

  const [values, setValues] = useState<ResetPasswordValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const newRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const runIdRef = useRef(0);

  const resetScreen = useCallback(() => {
    runIdRef.current += 1;
    setValues(EMPTY);
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(false);
    setSuccessMessage(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return resetScreen;
    }, [resetScreen]),
  );

  const handleFieldChange = (key: ResetPasswordFieldKey) => (text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    if (formError) setFormError(null);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.HOME);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const runId = runIdRef.current;
    setIsSubmitting(true);
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
      if (runId === runIdRef.current) setIsSubmitting(false);
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
            onPress={handleGoBack}
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
            <View
              style={styles.errorBanner}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              <Text style={styles.errorBannerText}>{formError}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <PasswordField
              label="Current password"
              value={values.oldPin}
              onChangeText={handleFieldChange('oldPin')}
              error={fieldErrors.oldPin}
              theme={theme}
              styles={styles}
              editable={!isSubmitting}
              returnKeyType="next"
              onSubmitEditing={() => newRef.current?.focus()}
              autoComplete="current-password"
            />
            <PasswordField
              ref={newRef}
              label="New password"
              value={values.newPin}
              onChangeText={handleFieldChange('newPin')}
              error={fieldErrors.newPin}
              theme={theme}
              styles={styles}
              editable={!isSubmitting}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              autoComplete="new-password"
            />
            <PasswordField
              ref={confirmRef}
              label="Confirm new password"
              value={values.confirmPin}
              onChangeText={handleFieldChange('confirmPin')}
              error={fieldErrors.confirmPin}
              theme={theme}
              styles={styles}
              editable={!isSubmitting}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              autoComplete="new-password"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.onBrand} />
            ) : (
              <Text style={styles.buttonText}>Reset password</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleGoBack}
            disabled={isSubmitting}
            style={styles.linkButton}
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PasswordField = forwardRef<TextInputInstance, ResetPasswordPasswordFieldProps>(
  function PasswordField({ label, value, onChangeText, error, theme, styles, ...rest }, ref) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
          <TextInput
            ref={ref}
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!isPasswordVisible}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={theme.muted}
            accessibilityLabel={label}
            {...rest}
          />
          <Pressable
            onPress={() => setIsPasswordVisible((isVisible) => !isVisible)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              isPasswordVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`
            }
          >
            <SymbolView
              name={isPasswordVisible ? 'eye.slash' : 'eye'}
              size={22}
              tintColor={theme.muted}
              style={styles.toggleSymbol}
              fallback={
                <Ionicons
                  name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
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
  },
);

function createStyles(theme: Palette) {
  return StyleSheet.create({
    flex: { flex: 1 },
    screen: { flex: 1, backgroundColor: theme.ground },
    content: { padding: 20, paddingBottom: 40 },
    title: {
      fontFamily: fonts.display,
      fontSize: 26,
      color: theme.ink,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.muted,
      marginBottom: 20,
    },
    centerText: { textAlign: 'center' },

    card: {
      backgroundColor: theme.card,
      borderColor: theme.line,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
    },
    fieldWrap: { marginBottom: 16 },
    label: {
      fontSize: 14,
      color: theme.label,
      marginBottom: 6,
      fontWeight: '500',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.field,
      borderColor: theme.fieldBorder,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
    },
    inputRowError: { borderColor: theme.accent },
    input: { flex: 1, fontSize: 16, color: theme.ink, paddingVertical: 13 },
    toggleIcon: { marginLeft: 12 },
    toggleSymbol: { width: 22, height: 22, marginLeft: 12 },
    fieldError: { marginTop: 6, fontSize: 13, color: theme.accentText },

    errorBanner: {
      backgroundColor: theme.accentTint,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
    },
    errorBannerText: {
      color: theme.accentTintText,
      fontSize: 14,
      lineHeight: 20,
    },

    button: {
      backgroundColor: theme.brand,
      borderRadius: 14,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      alignSelf: 'stretch',
    },
    buttonPressed: { opacity: 0.88 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: {
      fontFamily: fonts.displayMedium,
      fontSize: 16,
      color: theme.onBrand,
    },
    linkButton: { alignItems: 'center', paddingVertical: 16 },
    linkText: { fontSize: 15, color: theme.brandText, fontWeight: '600' },

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
      backgroundColor: theme.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    successTick: { fontSize: 38, color: theme.onBrand, fontWeight: '700' },
  });
}
