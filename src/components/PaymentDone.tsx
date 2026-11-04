import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import animation from '../../assets/animations/payment-done.json';
import { useTheme } from '@/theme';
import type { PaymentDoneProps } from '@/types/components/PaymentDone.types';

// Lottie stores the source blue as an RGBA string.
const SOURCE_BLUE = '[0.1607843137254902,0.3843137254901961,1,1]';
// Stop before the animation changes the checkmark back into an arrow.
const CHECK_FRAME = 88;

const toLottieColor = (hex: string) => {
  const colorValue = parseInt(hex.slice(1), 16);
  return `[${[(colorValue >> 16) & 255, (colorValue >> 8) & 255, colorValue & 255].map((channelValue) => +(channelValue / 255).toFixed(4)).join(',')},1]`;
};

export function PaymentDone({ size = 168 }: PaymentDoneProps) {
  const theme = useTheme();
  const ref = useRef<LottieView>(null);
  const source = useMemo(
    () => JSON.parse(JSON.stringify(animation).split(SOURCE_BLUE).join(toLottieColor(theme.brand))),
    [theme.brand],
  );

  useEffect(() => {
    ref.current?.play(0, CHECK_FRAME);
  }, [source]);

  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Payment complete">
      <LottieView ref={ref} source={source} loop={false} style={{ width: size, height: size }} />
    </View>
  );
}
