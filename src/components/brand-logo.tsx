import { Image, View } from 'react-native';

import { Tile, type IconName } from '@/components/ui';
import type { OperatorId, VendorId } from '@/data';
import { useTheme } from '@/theme';

export type Brand = OperatorId | VendorId | 'lec' | 'voucher' | 'airtime';

type Logo = { source: number; label: string; bg: string };

const LOGOS: Partial<Record<Brand, Logo>> = {
  mtn: { source: require('@/assets/images/brands/lonestar-mtn.png'), label: 'Lonestar Cell MTN logo', bg: '#FFCB05' },
  orange: { source: require('@/assets/images/brands/orange.png'), label: 'Orange logo', bg: '#FFFFFF' },
  lec: { source: require('@/assets/images/lec.png'), label: 'LEC logo', bg: '#FFFFFF' },
  voucher: {
    source: require('@/assets/images/brands/stop-and-shop.png'),
    label: 'Stop & Shop logo',
    bg: '#FFFFFF',
  },
};

const FALLBACK_ICON: Partial<Record<Brand, IconName>> = {
  airtime: 'phone',
  voucher: 'voucher',
  lec: 'bolt',
};

/** A brand's logo in a rounded tile. Falls back to an icon tile when there is no logo. */
export function BrandLogo({ brand, size = 48 }: { brand?: Brand; size?: number }) {
  const c = useTheme();
  const logo = brand ? LOGOS[brand] : undefined;

  if (!logo) {
    return <Tile icon={(brand && FALLBACK_ICON[brand]) || 'send'} size={size} />;
  }

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