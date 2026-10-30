import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import { Logo } from '@/components/logo';
import { Card, Icon, LinkRow, Screen, T, Tile, type IconName } from '@/components/ui';
import type { SendKind } from '@/data';
import { useStore } from '@/store';
import { fonts, useTheme } from '@/theme';

export default function HomeScreen() {
  const c = useTheme();
  const { startSend, user } = useStore();

  const send = (kind: SendKind) => {
    startSend(kind);
    router.push('/send');
  };

  const action = (kind: SendKind, icon: IconName, title: string, detail: string) => (
    <Pressable onPress={() => send(kind)} accessibilityRole="button" style={{ flex: 1 }}>
      <Card style={{ flex: 1, padding: 12, minHeight: 138, justifyContent: 'space-between', gap: 14 }}>
        <Tile icon={icon} tone="accent" size={42} />
        <View style={{ gap: 2 }}>
          <T v="display" style={{ fontSize: 14.5, lineHeight: 19 }}>
            {title}
          </T>
          <T v="small" style={{ fontSize: 12.5, lineHeight: 16 }}>
            {detail}
          </T>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ marginLeft: -6 }}>
          <Logo />
        </View>
        <Pressable
          onPress={() => router.navigate('/profile')}
          accessibilityRole="button"
          accessibilityLabel="My profile"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.brandTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {user ? (
            <Text style={{ fontFamily: fonts.display, fontSize: 15, color: c.brandText }}>
              {user.firstName[0]}
              {user.lastName[0]}
            </Text>
          ) : (
            <Icon name="user" size={20} color={c.brandText} />
          )}
        </Pressable>
      </View>

      <View
        style={{ backgroundColor: c.hero, borderRadius: 26, padding: 22, paddingTop: 24, paddingBottom: 26, gap: 14 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: c.heroSub }}>
          {user ? `Hello, ${user.firstName}` : 'Welcome to Wleesend'}
        </Text>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: fonts.displayMedium, fontSize: 25, lineHeight: 32, color: c.onBrand }}>
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

      <View style={{ gap: 12 }}>
        <T v="heading" accessibilityRole="header">
          Send credit
        </T>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {action('utility', 'bolt', 'Utility credit', 'LEC electricity')}
          {action('airtime', 'phone', 'Mobile airtime', 'MTN & Orange')}
          {action('voucher', 'voucher', 'Shopping voucher', 'Stop & Shop')}
        </View>
      </View>

      <Card>
        <LinkRow icon="list" label="Transactions history" onPress={() => router.navigate('/transactions')} />
        <LinkRow icon="user" label="My profile" onPress={() => router.navigate('/profile')} last />
      </Card>
    </Screen>
  );
}
