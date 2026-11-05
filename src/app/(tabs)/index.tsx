import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { Logo } from '@/components/LogoComponent';
import { Card, Icon, LinkRow, Screen, AppText, Tile } from '@/components/UiComponents';
import type { SendKind } from '@/data';
import { useStore } from '@/store';
import { fonts, useTheme } from '@/theme';
import type { IconName } from '@/types/components/UiComponents.types';
import { getInitials, resolveProfileImage } from '@/utils';


export default function HomeScreen() {
  const theme = useTheme();
  const { startSend, user } = useStore();
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const avatarUrl = resolveProfileImage(user?.profilePic);

  const handleStartSend = (kind: SendKind) => {
    startSend(kind);
    router.push(ROUTES.SEND);
  };

  const renderSendAction = (kind: SendKind, icon: IconName, title: string, detail: string) => (
    <Pressable onPress={() => handleStartSend(kind)} accessibilityRole="button" style={{ flex: 1 }}>
      <Card
        style={{
          flex: 1,
          padding: 12,
          minHeight: 138,
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <Tile icon={icon} tone="accent" size={42} />
        <View style={{ gap: 2 }}>
          <AppText variant="display" style={{ fontSize: 14.5, lineHeight: 19 }}>
            {title}
          </AppText>
          <AppText variant="small" style={{ fontSize: 12.5, lineHeight: 16 }}>
            {detail}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ marginLeft: -6 }}>
          <Logo />
        </View>
        <Pressable
          onPress={() => router.navigate(ROUTES.PROFILE)}
          accessibilityRole="button"
          accessibilityLabel="My profile"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.brandTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {user && avatarUrl && !avatarLoadFailed ? (
            <Image
              source={{ uri: avatarUrl }}
              onError={() => setAvatarLoadFailed(true)}
              onLoad={() => setAvatarLoadFailed(false)}
              style={{ width: 44, height: 44, borderRadius: 22 }}
              accessibilityLabel="Profile photo"
            />
          ) : user ? (
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 15,
                color: theme.brandText,
              }}
            >
              {getInitials(user.firstName, user.lastName)}
            </Text>
          ) : (
            <Icon name="user" size={20} color={theme.brandText} />
          )}
        </Pressable>
      </View>

      <View
        style={{
          backgroundColor: theme.hero,
          borderRadius: 26,
          padding: 22,
          paddingTop: 24,
          paddingBottom: 26,
          gap: 14,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.heroSub }}>
          {user ? `Hello, ${user.firstName}` : 'Welcome to Wleesend'}
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: fonts.displayMedium,
            fontSize: 25,
            lineHeight: 32,
            color: theme.onBrand,
          }}
        >
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
            backgroundColor: theme.heroChip,
          }}
        >
          <Image
            source={require('@/assets/images/flag-liberia.png')}
            style={{ width: 22, height: 12, borderRadius: 2 }}
            accessibilityLabel="Flag of Liberia"
          />
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: theme.onBrand }}>
            Currently available in Liberia only
          </Text>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <AppText variant="heading" accessibilityRole="header">
          Send credit
        </AppText>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {renderSendAction('utility', 'bolt', 'Utility credit', 'LEC electricity')}
          {renderSendAction('airtime', 'phone', 'Mobile airtime', 'MTN & Orange')}
          {renderSendAction('voucher', 'voucher', 'Shopping voucher', 'Stop & Shop')}
        </View>
      </View>

      <Card>
        <LinkRow
          icon="list"
          label="Transactions history"
          onPress={() => router.navigate(ROUTES.TRANSACTIONS)}
        />
        <LinkRow
          icon="user"
          label="My profile"
          onPress={() => router.navigate(ROUTES.PROFILE)}
          last
        />
      </Card>
    </Screen>
  );
}