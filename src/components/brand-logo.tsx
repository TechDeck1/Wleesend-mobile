import { Image, View } from 'react-native';

import type { OperatorId, VendorId } from '@/data';
import { useTheme } from '@/theme';

export type Brand = OperatorId | VendorId | 'lec' | 'voucher' | 'airtime';

const LOGOS = {
  mtn: { source: require('@/assets/images/brands/lonestar-mtn.png'), label: 'Lonestar Cell MTN logo', bg: '#FFCB05' },
  orange: { source: require('@/assets/images/brands/orange.png'), label: 'Orange logo', bg: '#FFFFFF' },
  'stop-and-shop': {
    source: require('@/assets/images/brands/stop-and-shop.png'),
    label: 'Stop & Shop logo',
    bg: '#FFFFFF',
  },
  lec: { source: require('@/assets/images/lec.png'), label: 'LEC logo', bg: '#FFFFFF' },
} satisfies Record<Brand, { source: number; label: string; bg: string }>;

/** A brand's logo on its own colour, in a rounded tile the size of the app's icon tiles. */
export function BrandLogo({ brand, size = 48 }: { brand: Brand; size?: number }) {
  const c = useTheme();
  const logo = LOGOS[brand];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: logo.bg,
        borderWidth: 1,
        borderColor: c.line,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Image
        source={logo.source}
        style={{ width: size * (brand === 'lec' ? 0.86 : 1), height: size * (brand === 'lec' ? 0.86 : 1) }}
        resizeMode="contain"
        accessibilityLabel={logo.label}
      />
    </View>
  );
}
