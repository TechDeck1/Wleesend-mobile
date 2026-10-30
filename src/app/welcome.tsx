import { router } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui';
import { fonts, useTheme } from '@/theme';

/** First screen when signed out, like the website's home page with Log in and Sign up. */
export default function WelcomeScreen() {
  const c = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.ground }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 28 }}>
        <View style={{ alignItems: 'center' }}>
          <Logo width={150} />
        </View>
        <View style={{ backgroundColor: c.hero, borderRadius: 26, padding: 22, gap: 14 }}>
          <Text
            accessibilityRole="header"
            style={{ fontFamily: fonts.displayMedium, fontSize: 23, lineHeight: 30, color: c.onBrand }}>
            Send data, utility and shopping voucher credit to friends and relatives around the world.
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
              backgroundColor: c.heroChip,
            }}>
            <Image
              source={require('@/assets/images/flag-liberia.png')}
              style={{ width: 22, height: 12, borderRadius: 2 }}
              accessibilityLabel="Flag of Liberia"
            />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: c.onBrand }}>
              Currently available in Liberia only
            </Text>
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 6 }}>
        <Button label="Create account" onPress={() => router.push('/signup')} />
        <Button variant="text" label="Log in" onPress={() => router.push('/login')} />
      </View>
    </SafeAreaView>
  );
}
