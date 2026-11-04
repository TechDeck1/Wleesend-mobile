import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/LogoComponent';
import { Button } from '@/components/UiComponents';
import { fonts, useTheme } from '@/theme';

export default function WelcomeScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.ground }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          gap: 28,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Logo width={150} />
        </View>
        <View
          style={{
            backgroundColor: theme.hero,
            borderRadius: 26,
            padding: 22,
            gap: 14,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: fonts.displayMedium,
              fontSize: 23,
              lineHeight: 30,
              color: theme.onBrand,
            }}
          >
            Send data, utility and shopping voucher credit to friends and relatives around the
            world.
          </Text>
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingLeft: 8,
              paddingRight: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: theme.heroChip,
            }}
          >
            <Image
              source={require('@/assets/images/flag-liberia.png')}
              style={{ width: 22, height: 12, borderRadius: 2 }}
              accessibilityLabel="Flag of Liberia"
            />
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: '600',
                color: theme.onBrand,
              }}
            >
              Currently available in Liberia only
            </Text>
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 6 }}>
        <Button label="Create account" onPress={() => router.push(ROUTES.SIGNUP)} />
        <Button variant="text" label="Log in" onPress={() => router.push(ROUTES.LOGIN)} />
      </View>
    </SafeAreaView>
  );
}
