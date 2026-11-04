import { BlurView } from 'expo-blur';
import type { ComponentRef, RefObject } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/UiComponents';
import { useTheme } from '@/theme';

type AuthLoadingOverlayProps = {
  blurTarget: RefObject<ComponentRef<typeof View> | null>;
  label: string;
};

export function AuthLoadingOverlay({ blurTarget, label }: AuthLoadingOverlayProps) {
  const theme = useTheme();

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.container]}
      pointerEvents="auto"
      accessibilityViewIsModal
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <BlurView
        blurTarget={blurTarget}
        blurMethod="dimezisBlurView"
        intensity={70}
        tint="default"
        style={StyleSheet.absoluteFill}
      />

      {/* No card/background: loader + message directly on the blur */}
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.brandText} />
        <AppText variant="strong">{label}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});