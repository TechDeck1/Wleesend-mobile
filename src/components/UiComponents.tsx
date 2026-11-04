import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextInputInstance,
  type TextProps,
  type ViewStyle,
  type ViewInstance,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, useTheme } from '@/theme';

/* ---------- Icons: SF Symbols on iOS, Material Symbols on Android ---------- */

type SymbolNames = Extract<SymbolViewProps['name'], object>;

const ICONS = {
  home: { ios: 'house', android: 'home' },
  send: { ios: 'paperplane', android: 'send' },
  list: { ios: 'doc.text', android: 'receipt_long' },
  user: { ios: 'person', android: 'person' },
  bolt: { ios: 'bolt', android: 'bolt' },
  phone: { ios: 'iphone', android: 'smartphone' },
  voucher: { ios: 'ticket', android: 'confirmation_number' },
  card: { ios: 'creditcard', android: 'credit_card' },
  wallet: { ios: 'wallet.pass', android: 'account_balance_wallet' },
  eye: { ios: 'eye', android: 'visibility' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off' },
  resend: { ios: 'arrow.clockwise', android: 'refresh' },
  personAdd: { ios: 'person.badge.plus', android: 'person_add' },
  right: { ios: 'chevron.right', android: 'chevron_right' },
  down: { ios: 'chevron.down', android: 'expand_more' },
  up: { ios: 'chevron.up', android: 'expand_less' },
  left: { ios: 'chevron.left', android: 'arrow_back' },
  check: { ios: 'checkmark', android: 'check' },
  mail: { ios: 'envelope', android: 'mail' },
  timer: { ios: 'timer', android: 'timer' },
  thumb: { ios: 'hand.thumbsup', android: 'thumb_up' },
  shield: { ios: 'checkmark.shield', android: 'verified_user' },
  info: { ios: 'info.circle', android: 'info' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
} satisfies Record<string, SymbolNames>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color: string }) {
  const symbol = ICONS[name];
  return (
    <SymbolView
      name={{ ios: symbol.ios, android: symbol.android, web: symbol.android }}
      size={size}
      tintColor={color}
    />
  );
}

/* ---------- Text ---------- */

type TextVariant = 'body' | 'muted' | 'small' | 'strong' | 'label' | 'title' | 'heading' | 'display';

export function AppText({ variant = 'body', style, ...rest }: TextProps & { variant?: TextVariant }) {
  const theme = useTheme();
  const variants = {
    body: { fontSize: 15, lineHeight: 22, color: theme.ink },
    muted: { fontSize: 15, lineHeight: 22, color: theme.muted },
    small: { fontSize: 13, lineHeight: 18, color: theme.muted },
    strong: { fontSize: 15, lineHeight: 20, color: theme.ink, fontWeight: '600' },
    label: { fontSize: 13, lineHeight: 18, color: theme.label, fontWeight: '600' },
    title: { fontSize: 28, lineHeight: 34, color: theme.ink, fontFamily: fonts.display },
    heading: { fontSize: 17, lineHeight: 22, color: theme.ink, fontFamily: fonts.display },
    display: { fontSize: 16, lineHeight: 21, color: theme.ink, fontFamily: fonts.display },
  } as const;
  return <Text {...rest} style={[variants[variant], style]} />;
}

/* ---------- Layout ---------- */

type ScreenProps = {
  children: ReactNode;
  /** Fixed content above the scroll area, e.g. <NavBar />. */
  header?: ReactNode;
  /** Fixed content below the scroll area, e.g. a total + button bar. */
  footer?: ReactNode;
  gap?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onScrollNearEnd?: () => void;
};

/**
 * iOS number pads have no return key, so a Done bar rides on top of the keyboard.
 * (React Native's InputAccessoryView doesn't render on this RN version, so the bar
 * follows the keyboard's position itself.)
 */
/** Height of the Done bar, so the active field can be kept clear of it. */
const DONE_BAR_HEIGHT = 46;
/** Breathing room between the active field and the Done bar. */
const FIELD_CLEARANCE = 16;

/** Lets a field ask its screen to scroll it into view once it gains focus. */
const RevealContext = createContext<() => void>(() => {});

function KeyboardDoneBar({ bottom }: { bottom: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom,
        height: DONE_BAR_HEIGHT,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderTopWidth: 1,
        borderTopColor: theme.line,
        paddingHorizontal: 20,
      }}>
      <Pressable onPress={Keyboard.dismiss} accessibilityRole="button" hitSlop={10}>
        <Text style={{ color: theme.brandText, fontSize: 16, fontWeight: '600' }}>Done</Text>
      </Pressable>
    </View>
  );
}

export function Screen({ children, header, footer, gap = 20, contentContainerStyle, onScrollNearEnd }: ScreenProps) {
  const theme = useTheme();
  const root = useRef<ViewInstance>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  // iOS only: how far the Done bar sits above the screen's bottom edge, or null when hidden.
  const [barBottom, setBarBottom] = useState<number | null>(null);

  // Scrolls the focused field so it sits above the keyboard and the Done bar.
  const reveal = useCallback(() => {
    const field = TextInput.State.currentlyFocusedInput();
    const top = keyboardTop.current;
    if (!field || top === null) return;
    field.measureInWindow((_x, y, _w, h) => {
      const limit = top - (Platform.OS === 'ios' ? DONE_BAR_HEIGHT : 0) - FIELD_CLEARANCE;
      const overlap = y + h - limit;
      if (overlap > 0) scroll.current?.scrollTo({ y: scrollY.current + overlap, animated: true });
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (keyboardEvent) => {
      keyboardTop.current = keyboardEvent.endCoordinates.screenY;
      if (Platform.OS === 'ios') {
        root.current?.measureInWindow((_x, y, _w, height) => setBarBottom(y + height - keyboardEvent.endCoordinates.screenY));
      }
      // Wait for the keyboard to finish sliding in and the inset to apply.
      setTimeout(reveal, Platform.OS === 'ios' ? 320 : 60);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardTop.current = null;
      setBarBottom(null);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [reveal]);

  const isBarShown = barBottom !== null && barBottom > 0;
  return (
    <RevealContext.Provider value={reveal}>
      <SafeAreaView ref={root} edges={['top']} style={{ flex: 1, backgroundColor: theme.ground }}>
        {header}
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={[
            {
              flexGrow: 1,
              padding: 20,
              paddingTop: header ? 20 : 12,
              paddingBottom: 20 + (isBarShown ? DONE_BAR_HEIGHT + FIELD_CLEARANCE : 0),
              gap,
            },
            contentContainerStyle,
          ]}
          onScroll={(scrollEvent) => {
            scrollY.current = scrollEvent.nativeEvent.contentOffset.y;
            const { contentOffset, contentSize, layoutMeasurement } = scrollEvent.nativeEvent;
            if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 240) onScrollNearEnd?.();
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {footer}
        {isBarShown ? <KeyboardDoneBar bottom={barBottom} /> : null}
      </SafeAreaView>
    </RevealContext.Provider>
  );
}

export function Footer({ children, row }: { children: ReactNode; row?: boolean }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderTopWidth: 1,
        borderTopColor: theme.line,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: Math.max(insets.bottom, 16),
        flexDirection: row ? 'row' : 'column',
        alignItems: row ? 'center' : 'stretch',
        gap: 16,
      }}>
      {children}
    </View>
  );
}

export function NavBar({ title, step, onBack }: { title: string; step?: 1 | 2; onBack?: () => void }) {
  const theme = useTheme();
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 2 }}>
        <Pressable
          onPress={onBack ?? (() => router.back())}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="left" size={22} color={theme.ink} />
        </Pressable>
        <AppText variant="heading" style={{ flex: 1 }}>
          {title}
        </AppText>
        {step ? (
          <AppText variant="small" style={{ fontWeight: '600', paddingRight: 12 }}>
            Step {step} of 2
          </AppText>
        ) : null}
      </View>
      {step ? (
        <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingTop: 8 }}>
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: theme.brandText }} />
          <View
            style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: step === 2 ? theme.brandText : theme.fieldBorder }}
          />
        </View>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, borderRadius: 20 }, style]}>
      {children}
    </View>
  );
}

type TileTone = 'brand' | 'accent' | 'soft';

export function Tile({ icon, tone = 'brand', size = 48 }: { icon: IconName; tone?: TileTone; size?: number }) {
  const theme = useTheme();
  const tones = {
    brand: [theme.brandTint, theme.brandText],
    accent: [theme.accent, theme.onBrand],
    soft: [theme.accentTint, theme.accentTintText],
  } as const;
  const [background, foreground] = tones[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={icon} size={Math.round(size * 0.5)} color={foreground} />
    </View>
  );
}

/* ---------- Controls ---------- */

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'text' | 'outline';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, style, disabled }: ButtonProps) {
  const theme = useTheme();
  const look = {
    primary: { background: theme.accent, color: theme.onBrand, border: theme.accent, height: 54 },
    text: { background: 'transparent', color: theme.brandText, border: 'transparent', height: 50 },
    outline: { background: theme.card, color: theme.accentText, border: theme.line, height: 52 },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          height: look.height,
          paddingHorizontal: 28,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: look.border,
          backgroundColor: look.background,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {icon ? <Icon name={icon} size={20} color={look.color} /> : null}
      <Text style={{ color: look.color, fontSize: 16, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

type SegmentProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  shape?: 'block' | 'chip';
  /** Shown before the label, e.g. a brand logo. */
  leading?: ReactNode;
};

/** A selectable option: operator, amount or filter. */
export function Segment({ label, isSelected, onPress, shape = 'block', leading }: SegmentProps) {
  const theme = useTheme();
  const chip = shape === 'chip';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={{
        flex: chip ? undefined : 1,
        height: chip ? 44 : 52,
        paddingHorizontal: chip ? 18 : 8,
        borderRadius: chip ? 22 : 14,
        borderWidth: 1,
        borderColor: isSelected ? theme.brand : theme.fieldBorder,
        backgroundColor: isSelected ? theme.brand : theme.field,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {leading}
      <Text style={{ color: isSelected ? theme.onBrand : theme.ink, fontSize: chip ? 14 : 15, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label?: string;
  /** Adds a red asterisk after the label. */
  required?: boolean;
  /** Shown under the field in red; also outlines the field. */
  error?: string;
  /** A control inside the field's right edge, e.g. a show-password button. */
  right?: ReactNode;
  inputRef?: Ref<TextInputInstance>;
};

export function Field({ label, required, error, right, inputRef, style, onFocus, ...input }: FieldProps) {
  const theme = useTheme();
  const reveal = useContext(RevealContext);
  return (
    <View style={{ gap: 6, flex: 1 }}>
      {label ? (
        <AppText variant="label">
          {label}
          {required ? <Text style={{ color: theme.accentText }}> *</Text> : null}
        </AppText>
      ) : null}
      <View style={{ justifyContent: 'center' }}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          placeholderTextColor={theme.muted}
          {...input}
          onFocus={(focusEvent) => {
            onFocus?.(focusEvent);
            // When the keyboard is already up, moving to another field fires no keyboard event.
            setTimeout(reveal, 50);
          }}
          style={[
            {
              height: 50,
              paddingHorizontal: 14,
              paddingRight: right ? 48 : 14,
              borderWidth: 1,
              borderColor: error ? theme.accentText : theme.fieldBorder,
              borderRadius: 12,
              backgroundColor: theme.field,
              color: theme.ink,
              fontSize: 16,
            },
            style,
          ]}
        />
        {right ? <View style={{ position: 'absolute', right: 4 }}>{right}</View> : null}
      </View>
      {error ? (
        <Text style={{ color: theme.accentText, fontSize: 13 }} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function LinkRow({ icon, label, onPress, last }: { icon: IconName; label: string; onPress: () => void; last?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 60,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.lineSoft,
      }}>
      <Tile icon={icon} size={36} />
      <AppText variant="strong" style={{ flex: 1 }}>
        {label}
      </AppText>
      <Icon name="right" size={18} color={theme.muted} />
    </Pressable>
  );
}

/** Label/value line used in the order summary and profile. */
export function KeyValue({ label, value, first }: { label: string; value: string; first?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        paddingVertical: 10,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: theme.lineSoft,
      }}>
      <AppText variant="small" style={{ fontSize: 14 }}>
        {label}
      </AppText>
      <AppText variant="strong" style={{ fontSize: 14, flexShrink: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}
