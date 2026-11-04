import type { SymbolViewProps } from 'expo-symbols';
import type { ReactNode, Ref } from 'react';
import type {
  StyleProp,
  TextInputInstance,
  TextInputProps,
  TextProps,
  ViewStyle,
} from 'react-native';

export type SymbolNames = Extract<SymbolViewProps['name'], object>;
export type IconName =
  | 'home'
  | 'send'
  | 'list'
  | 'user'
  | 'bolt'
  | 'phone'
  | 'voucher'
  | 'card'
  | 'wallet'
  | 'eye'
  | 'eyeOff'
  | 'resend'
  | 'personAdd'
  | 'right'
  | 'down'
  | 'up'
  | 'left'
  | 'check'
  | 'mail'
  | 'timer'
  | 'thumb'
  | 'shield'
  | 'info'
  | 'logout';

export type TextVariant = 'body' | 'muted' | 'small' | 'strong' | 'label' | 'title' | 'heading' | 'display';
export type IconProps = { name: IconName; size?: number; color: string };
export type AppTextProps = TextProps & { variant?: TextVariant };

export type ScreenProps = {
  children: ReactNode;
  /** Fixed content above the scroll area, e.g. <NavBar />. */
  header?: ReactNode;
  /** Fixed content below the scroll area, e.g. a total + button bar. */
  footer?: ReactNode;
  gap?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onScrollNearEnd?: () => void;
};

export type KeyboardDoneBarProps = { bottom: number };
export type FooterProps = { children: ReactNode; row?: boolean };
export type NavBarProps = { title: string; step?: 1 | 2; onBack?: () => void };
export type CardProps = { children: ReactNode; style?: StyleProp<ViewStyle> };
export type TileTone = 'brand' | 'accent' | 'soft';
export type TileProps = { icon: IconName; tone?: TileTone; size?: number };

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'text' | 'outline';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export type SegmentProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  shape?: 'block' | 'chip';
  /** Shown before the label, e.g. a brand logo. */
  leading?: ReactNode;
};

export type FieldProps = TextInputProps & {
  label?: string;
  /** Adds a red asterisk after the label. */
  required?: boolean;
  /** Shown under the field in red; also outlines the field. */
  error?: string;
  /** A control inside the field's right edge, e.g. a show-password button. */
  right?: ReactNode;
  inputRef?: Ref<TextInputInstance>;
};

export type LinkRowProps = { icon: IconName; label: string; onPress: () => void; last?: boolean };
export type KeyValueProps = { label: string; value: string; first?: boolean };
