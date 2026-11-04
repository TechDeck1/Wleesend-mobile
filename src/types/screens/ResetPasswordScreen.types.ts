import type { Palette } from '@/theme';
import type { TextInputProps, TextStyle, ViewStyle } from 'react-native';

export type ResetPasswordFieldKey = 'oldPin' | 'newPin' | 'confirmPin';
export type ResetPasswordValues = Record<ResetPasswordFieldKey, string>;
export type ResetPasswordFieldErrors = Partial<Record<ResetPasswordFieldKey, string>>;

export type ResetPasswordPasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  theme: Palette;
  styles: {
    fieldWrap: ViewStyle;
    label: TextStyle;
    inputRow: ViewStyle;
    inputRowError: ViewStyle;
    input: TextStyle;
    toggleSymbol: ViewStyle;
    toggleIcon: ViewStyle;
    fieldError: TextStyle;
  };
} & Pick<TextInputProps, 'editable' | 'returnKeyType' | 'onSubmitEditing' | 'autoComplete'>;
