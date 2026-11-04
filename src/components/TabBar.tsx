import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/UiComponents';
import type { IconName } from '@/types/components/UiComponents.types';
import { useTheme } from '@/theme';

const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  products: 'send',
  transactions: 'list',
  profile: 'user',
};

/** Bottom tab bar with the active tab marked by a filled pill. */
export function TabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.card,
        borderTopWidth: 1,
        borderTopColor: theme.line,
        paddingTop: 8,
        paddingHorizontal: 10,
        paddingBottom: Math.max(insets.bottom, 12),
      }}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const title = descriptors[route.key].options.title ?? route.name;
        const onPress = () => {
          if (!isFocused) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={title}
            style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <View
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFocused ? theme.brand : 'transparent',
              }}>
              <Icon name={TAB_ICONS[route.name] ?? 'home'} size={21} color={isFocused ? theme.onBrand : theme.muted} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: isFocused ? '700' : '600', color: isFocused ? theme.brandText : theme.muted }}>
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
