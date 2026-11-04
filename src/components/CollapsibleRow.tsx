import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { CollapsibleRowProps } from '@/types/components/CollapsibleRow.types';

const DURATION_MS = 260;
export function CollapsibleRow({
  isVisible,
  height,
  gap = 0,
  children,
}: CollapsibleRowProps) {
  const progress = useSharedValue(isVisible ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(isVisible ? 1 : 0, { duration: DURATION_MS, easing: Easing.out(Easing.cubic) }));
  }, [isVisible, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: progress.get() * height,
    marginBottom: progress.get() * gap,
    opacity: progress.get(),
    transform: [{ scale: 0.96 + 0.04 * progress.get() }],
  }));

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      accessibilityElementsHidden={!isVisible}
      importantForAccessibility={isVisible ? 'auto' : 'no-hide-descendants'}
      style={[{ flexDirection: 'row', overflow: 'hidden' }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
