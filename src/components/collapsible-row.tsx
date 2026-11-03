import { useEffect, type ReactNode } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const DURATION_MS = 260;
export function CollapsibleRow({
  visible,
  height,
  gap = 0,
  children,
}: {
  visible: boolean;
  height: number;
  gap?: number;
  children: ReactNode;
}) {
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(visible ? 1 : 0, { duration: DURATION_MS, easing: Easing.out(Easing.cubic) }));
  }, [visible, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: progress.get() * height,
    marginBottom: progress.get() * gap,
    opacity: progress.get(),
    transform: [{ scale: 0.96 + 0.04 * progress.get() }],
  }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[{ flexDirection: 'row', overflow: 'hidden' }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}