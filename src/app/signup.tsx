import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Field, Footer, Icon, NavBar, Screen, T, Tile } from '@/components/ui';
import { useStore, type User } from '@/store';
import { useTheme } from '@/theme';

type Form = User & { password: string; confirm: string };
type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = { firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' };
const MIN_PASSWORD = 8;

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.firstName.trim()) e.firstName = 'Enter your first name.';
  if (!f.lastName.trim()) e.lastName = 'Enter your last name.';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address, like name@example.com.';
  const digits = f.phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) e.phone = 'Enter a phone number with 7 to 15 digits.';
  if (f.password.length < MIN_PASSWORD) e.password = `Use at least ${MIN_PASSWORD} characters.`;
  if (f.confirm !== f.password || !f.confirm) e.confirm = 'The passwords don’t match.';
  return e;
}

/** Sign-up form, matching the website's Create Your Account page. */
export default function SignUpScreen() {
  const c = useTheme();
  const { signUp } = useStore();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (key: keyof Form) => (value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (submitted) setErrors(validate(next));
  };

  const create = () => {
    setSubmitted(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    signUp(
      {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      form.password,
    );
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  };

  const eye = (shown: boolean, toggle: () => void, what: string) => (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={shown ? `Hide ${what}` : `Show ${what}`}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={shown ? 'eyeOff' : 'eye'} size={20} color={c.muted} />
    </Pressable>
  );

  return (
    <Screen
      gap={18}
      header={<NavBar title="Sign up" />}
      footer={
        <Footer>
          <Button label="Create account" onPress={create} />
        </Footer>
      }>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <Tile icon="personAdd" size={64} />
        <T v="title" style={{ textAlign: 'center' }} accessibilityRole="header">
          Create your account
        </T>
        <T v="muted" style={{ textAlign: 'center' }}>
          Sign up to create your account and get started.
        </T>
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
          onChangeText={set('firstName')}
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
          onChangeText={set('lastName')}
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
          onChangeText={set('email')}
          error={errors.email}
        />
      </View>
      <View>
        <Field
          label="Phone number"
          required
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          value={form.phone}
          onChangeText={set('phone')}
          error={errors.phone}
        />
      </View>
      <View>
        <Field
          label="Password"
          required
          placeholder="Enter password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          value={form.password}
          onChangeText={set('password')}
          error={errors.password}
          right={eye(showPassword, () => setShowPassword((v) => !v), 'password')}
        />
      </View>
      <View>
        <Field
          label="Re-enter password"
          required
          placeholder="Re-enter your password"
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          value={form.confirm}
          onChangeText={set('confirm')}
          error={errors.confirm}
          right={eye(showConfirm, () => setShowConfirm((v) => !v), 'password')}
        />
      </View>
      <T v="small">
        <Text style={{ color: c.accentText }}>*</Text> Required fields
      </T>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <T v="muted">Already have an account? </T>
        <Pressable onPress={() => router.replace('/login')} accessibilityRole="link" hitSlop={8}>
          <Text style={{ color: c.brandText, fontSize: 15, fontWeight: '600' }}>Log in</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
