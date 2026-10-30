import { useColorScheme } from 'react-native';

const light = {
  ground: '#F4F5FA',
  card: '#FFFFFF',
  line: '#E3E5EF',
  lineSoft: '#EEF0F6',
  ink: '#171B4D',
  muted: '#5B6080',
  label: '#3A3F6B',
  brand: '#232870',
  brandText: '#232870',
  brandTint: '#ECEEF8',
  accent: '#CF3228',
  accentText: '#CF3228',
  accentTint: '#FCEBE9',
  accentTintText: '#B3271E',
  field: '#FFFFFF',
  fieldBorder: '#D6D9E6',
  hero: '#232870',
  heroChip: '#353B8A',
  heroSub: '#C9CCEC',
  logoBg: 'transparent',
  onBrand: '#FFFFFF',
};

export type Palette = Record<keyof typeof light, string>;

const dark: Palette = {
  ground: '#0D0F2B',
  card: '#171A42',
  line: '#2A2E63',
  lineSoft: '#23275A',
  ink: '#F1F2FB',
  muted: '#A6AACB',
  label: '#C3C6E4',
  brand: '#343BA0',
  brandText: '#B4B9F5',
  brandTint: '#232759',
  accent: '#D63A30',
  accentText: '#FF8A80',
  accentTint: '#3A1B24',
  accentTintText: '#FFA198',
  field: '#101335',
  fieldBorder: '#343972',
  hero: '#262C7E',
  heroChip: '#3A41A0',
  heroSub: '#C9CCEC',
  logoBg: '#FFFFFF',
  onBrand: '#FFFFFF',
};

/** Brand colors for the current light/dark setting. */
export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Lexend is loaded in src/app/_layout.tsx; body text uses the system font. */
export const fonts = {
  display: 'Lexend_600SemiBold',
  displayMedium: 'Lexend_500Medium',
};
