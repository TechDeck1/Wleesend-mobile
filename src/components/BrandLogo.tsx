import { Image, View } from 'react-native';

import { Tile } from '@/components/UiComponents';
import { useTheme } from '@/theme';
import type {
  Brand,
  BrandFallbackIcons,
  BrandLogoAsset,
  BrandLogoProps,
} from '@/types/components/BrandLogo.types';

const LOGOS: Partial<Record<Brand, BrandLogoAsset>> = {
  mtn: {
    source: require('@/assets/images/brands/lonestar-mtn.png'),
    label: 'Lonestar Cell MTN logo',
    bg: '#FFCB05',
  },
  orange: {
    source: require('@/assets/images/brands/orange.png'),
    label: 'Orange logo',
    bg: '#FFFFFF',
  },
  lec: {
    source: require('@/assets/images/lec.png'),
    label: 'LEC logo',
    bg: '#FFFFFF',
  },
  voucher: {
    source: require('@/assets/images/brands/stop-and-shop.png'),
    label: 'Stop & Shop logo',
    bg: '#FFFFFF',
  },
};

const FALLBACK_ICON: BrandFallbackIcons = {
  airtime: 'phone',
  voucher: 'voucher',
  lec: 'bolt',
};

export function BrandLogo({ brand, size = 48 }: BrandLogoProps) {
  const theme = useTheme();
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
        borderColor: theme.line,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={logo.source}
        style={{
          width: size * (brand === 'lec' ? 0.86 : 1),
          height: size * (brand === 'lec' ? 0.86 : 1),
        }}
        resizeMode="contain"
        accessibilityLabel={logo.label}
      />
    </View>
  );
}
