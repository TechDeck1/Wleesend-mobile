import { Image, Text, View } from 'react-native';

import { fonts, useTheme } from '@/theme';
import type { LogoProps } from '@/types/components/LogoComponent.types';

const MARK_RATIO = 1650 / 640;

/** The Wleesend lockup: the arrow mark above the name and tagline. */
export function Logo({ width = 92 }: LogoProps) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Wleesend: Data, Utility, Voucher"
      style={{ alignItems: 'center', backgroundColor: theme.logoBg, borderRadius: 12, padding: 6, gap: 1 }}>
      <Image
        source={require('@/assets/images/wleesend-mark.png')}
        style={{ width: width * 0.62, height: (width * 0.62) / MARK_RATIO }}
        resizeMode="contain"
      />
      <Text style={{ fontFamily: fonts.display, fontSize: width * 0.21, lineHeight: width * 0.25, color: '#2B2980' }}>
        Wleesend
      </Text>
      <Text style={{ fontSize: width * 0.088, fontWeight: '700', color: '#EA2F2F', letterSpacing: 0.2 }}>
        Data, Utility, Voucher
      </Text>
    </View>
  );
}
