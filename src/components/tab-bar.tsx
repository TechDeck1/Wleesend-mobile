import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui';
import { useTheme } from '@/theme';

const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  products: 'send',
  transactions: 'list',
  profile: 'user',
};

/** Bottom tab bar with the active tab marked by a filled pill. */
export function TabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: c.card,
        borderTopWidth: 1,
        borderTopColor: c.line,
        paddingTop: 8,
        paddingHorizontal: 10,
        paddingBottom: Math.max(insets.bottom, 12),
      }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const title = descriptors[route.key].options.title ?? route.name;
        const onPress = () => {
          if (!focused) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={title}
            style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <View
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? c.brand : 'transparent',
              }}>
              <Icon name={TAB_ICONS[route.name] ?? 'home'} size={21} color={focused ? c.onBrand : c.muted} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: focused ? '700' : '600', color: focused ? c.brandText : c.muted }}>
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
