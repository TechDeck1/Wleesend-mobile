import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  Button,
  Field,
  Footer,
  Icon,
  NavBar,
  Screen,
  AppText,
  Tile,
} from '@/components/UiComponents';
import { useStore } from '@/store';
import { useTheme } from '@/theme';
import type { SignUpErrors, SignUpForm } from '@/types/screens/SignUpScreen.types';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/constants/auth';

const EMPTY: SignUpForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
};

function validate(form: SignUpForm): SignUpErrors {
  const fieldErrors: SignUpErrors = {};
  if (!form.firstName.trim()) fieldErrors.firstName = 'Enter your first name.';
  if (!form.lastName.trim()) fieldErrors.lastName = 'Enter your last name.';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
    fieldErrors.email = 'Enter a valid email address, like name@example.com.';
  const phoneDigits = form.phone.replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15)
    fieldErrors.phone = 'Enter a phone number with 7 to 15 digits.';
  if (form.password.length < MIN_PASSWORD_LENGTH)
    fieldErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (form.confirm !== form.password || !form.confirm)
    fieldErrors.confirm = 'The passwords don’t match.';
  return fieldErrors;
}

export default function SignUpScreen() {
  const theme = useTheme();
  const { signUp } = useStore();
  const [form, setForm] = useState<SignUpForm>(EMPTY);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleFieldChange = (key: keyof SignUpForm) => (value: string) => {
    const updatedForm = { ...form, [key]: value };
    setForm(updatedForm);
    setServerError('');
    if (hasSubmitted) setErrors(validate(updatedForm));
  };

  const handleCreateAccount = async () => {
    if (isSubmitting) return;
    setHasSubmitted(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSubmitting(true);
    try {
      await signUp(
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        form.password,
        form.confirm,
      );
      router.replace({
        pathname: ROUTES.VERIFY_EMAIL,
        params: { email: form.email.trim() },
      });
    } catch (requestError) {
      setServerError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to create your account. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPasswordVisibilityToggle = (
    isVisible: boolean,
    onToggle: () => void,
    fieldLabel: string,
  ) => (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={isVisible ? `Hide ${fieldLabel}` : `Show ${fieldLabel}`}
      style={{
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={isVisible ? 'eyeOff' : 'eye'} size={20} color={theme.muted} />
    </Pressable>
  );

  return (
    <Screen
      gap={18}
      header={<NavBar title="Sign up" />}
      footer={
        <Footer>
          <Button
            label={isSubmitting ? 'Creating account...' : 'Create account'}
            onPress={() => void handleCreateAccount()}
          />
        </Footer>
      }
    >
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <Tile icon="personAdd" size={64} />
        <AppText variant="title" style={{ textAlign: 'center' }} accessibilityRole="header">
          Create your account
        </AppText>
        <AppText variant="muted" style={{ textAlign: 'center' }}>
          Sign up to create your account and get started.
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field
          label="First name"
          required
          placeholder="Enter first name"
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          value={form.firstName}
          onChangeText={handleFieldChange('firstName')}
          error={errors.firstName}
        />
        <Field
          label="Last name"
          required
          placeholder="Enter last name"
          autoCapitalize="words"
          autoComplete="family-name"
          textContentType="familyName"
          value={form.lastName}
          onChangeText={handleFieldChange('lastName')}
          error={errors.lastName}
        />
      </View>
      <View>
        <Field
          label="Email address"
          required
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          value={form.email}
          onChangeText={handleFieldChange('email')}
          error={errors.email}
        />
      </View>
      <View>
        <Field
          label="Phone number"
          required
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          maxLength={15}
          autoComplete="tel"
          textContentType="telephoneNumber"
          value={form.phone}
          onChangeText={(phone) => handleFieldChange('phone')(phone.replace(/\D/g, ''))}
          error={errors.phone}
        />
      </View>
      <View>
        <Field
          label="Password"
          required
          placeholder="Enter password"
          maxLength={MAX_PASSWORD_LENGTH}
          secureTextEntry={!isPasswordVisible}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          value={form.password}
          onChangeText={handleFieldChange('password')}
          error={errors.password}
          right={renderPasswordVisibilityToggle(
            isPasswordVisible,
            () => setIsPasswordVisible((isVisible) => !isVisible),
            'password',
          )}
        />
      </View>
      <View>
        <Field
          label="Re-enter password"
          required
          placeholder="Re-enter your password"
          maxLength={MAX_PASSWORD_LENGTH}
          secureTextEntry={!isConfirmPasswordVisible}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          value={form.confirm}
          onChangeText={handleFieldChange('confirm')}
          error={errors.confirm}
          right={renderPasswordVisibilityToggle(
            isConfirmPasswordVisible,
            () => setIsConfirmPasswordVisible((isVisible) => !isVisible),
            'password',
          )}
        />
      </View>
      {serverError ? <AppText style={{ color: theme.accentText }}>{serverError}</AppText> : null}
      <AppText variant="small">
        <Text style={{ color: theme.accentText }}>*</Text> Required fields
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <AppText variant="muted">Already have an account? </AppText>
        <Pressable onPress={() => router.push(ROUTES.LOGIN)} accessibilityRole="link" hitSlop={8}>
          <Text style={{ color: theme.brandText, fontSize: 15, fontWeight: '600' }}>Log in</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
