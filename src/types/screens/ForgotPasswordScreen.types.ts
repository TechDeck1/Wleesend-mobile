import type { Palette } from '@/theme';
import type { TextInputProps, StyleProp, ViewStyle } from 'react-native';

export type ForgotPasswordScreenProps = { onBack: () => void };
export type ForgotPasswordStep = 'email' | 'otp' | 'reset';
export type SuccessModalProps = {
  palette: Palette;
  isVisible: boolean;
  title: string;
  message: string;
  buttonLabel: string;
  onPress: () => void;
};
export type ForgotPasswordTextFieldProps = TextInputProps & {
  palette: Palette;
  hasError?: boolean;
};
export type ForgotPasswordPasswordFieldProps = ForgotPasswordTextFieldProps;
export type OtpInputProps = {
  palette: Palette;
  value: string;
  onChange: (otpValue: string) => void;
  hasError: boolean;
  disabled: boolean;
};
export type ErrorTextProps = { palette: Palette; message: string | null };
export type PrimaryButtonProps = {
  palette: Palette;
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
};
