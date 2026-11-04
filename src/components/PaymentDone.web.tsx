import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { Icon } from '@/components/UiComponents';
import { useTheme } from '@/theme';
import type { PaymentDoneProps } from '@/types/components/PaymentDone.types';

/** Avoid the Lottie web player's CDN dependency in hosted previews. */
export function PaymentDone({ size = 168 }: PaymentDoneProps) {
  const theme = useTheme();
  const [scale] = useState(() => new Animated.Value(0.4));
  const circle = Math.round(size * 0.57);

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: false,
    }).start();
  }, [scale]);

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Payment complete"
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale }],
      }}
    >
      <Animated.View
        style={{
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: theme.brand,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="check" size={Math.round(circle * 0.45)} color={theme.onBrand} />
      </Animated.View>
    </Animated.View>
  );
}
