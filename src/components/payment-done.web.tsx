import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { Icon } from '@/components/ui';
import { useTheme } from '@/theme';

/**
 * Web stand-in for the Lottie animation: its web player downloads its engine
 * from a CDN at runtime, which hosted previews block. Same end frame, scaled in.
 */
export function PaymentDone({ size = 168 }: { size?: number }) {
  const c = useTheme();
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
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ scale }] }}>
      <Animated.View
        style={{
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: c.brand,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name="check" size={Math.round(circle * 0.45)} color={c.onBrand} />
      </Animated.View>
    </Animated.View>
  );
}
