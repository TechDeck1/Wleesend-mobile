import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button, Card, LinkRow, Screen, AppText, Tile } from '@/components/UiComponents';
import { useStore } from '@/store';
import { fonts, useTheme } from '@/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user: userProfile, signOut } = useStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace(ROUTES.WELCOME);
  };

  const accountLinks = (
    <Card>
      <LinkRow icon="info" label="About Wleesend" onPress={() => router.push(ROUTES.ABOUT)} />
      <LinkRow icon="mail" label="Support" onPress={() => router.push(ROUTES.SUPPORT)} last />
    </Card>
  );

  if (!userProfile) {
    return (
      <Screen gap={18}>
        <AppText variant="title" accessibilityRole="header">
          My profile
        </AppText>
        <Card style={{ padding: 20, alignItems: 'center', gap: 10 }}>
          <Tile icon="personAdd" size={56} />
          <AppText variant="heading" style={{ fontSize: 18 }}>
            You&rsquo;re signed out
          </AppText>
          <AppText variant="muted" style={{ textAlign: 'center' }}>
            Create an account to send credit and see your transactions.
          </AppText>
          <Button
            label="Create account"
            onPress={() => router.push(ROUTES.SIGNUP)}
            style={{ alignSelf: 'stretch', marginTop: 6 }}
          />
        </Card>
        {accountLinks}
      </Screen>
    );
  }

  const renderProfileDetail = (label: string, value: string) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 54,
        borderBottomWidth: 1,
        borderBottomColor: theme.lineSoft,
      }}
    >
      <AppText variant="muted">{label}</AppText>
      <AppText variant="strong">{value}</AppText>
    </View>
  );

  return (
    <Screen gap={18}>
      <AppText variant="title" accessibilityRole="header">
        My profile
      </AppText>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 19,
              color: theme.onBrand,
            }}
          >
            {userProfile.firstName[0]}
            {userProfile.lastName[0]}
          </Text>
        </View>
        <View>
          <AppText variant="heading" style={{ fontSize: 18 }}>
            {userProfile.firstName} {userProfile.lastName}
          </AppText>
          <AppText variant="small" style={{ fontSize: 14 }}>
            {userProfile.email}
          </AppText>
        </View>
      </View>

      <Card style={{ paddingHorizontal: 16 }}>
        {renderProfileDetail('First name', userProfile.firstName)}
        {renderProfileDetail('Last name', userProfile.lastName)}
        {userProfile.phone ? renderProfileDetail('Phone', userProfile.phone) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: theme.lineSoft,
          }}
        >
          <AppText variant="muted">Email</AppText>
          <View style={{ alignItems: 'flex-end', paddingTop: 10 }}>
            <AppText variant="strong">{userProfile.email}</AppText>
            <Pressable
              onPress={() => router.push(ROUTES.CHANGE_EMAIL)}
              accessibilityRole="button"
              style={{ height: 44, justifyContent: 'center', marginTop: -6 }}
            >
              <Text
                style={{
                  color: theme.accentText,
                  fontSize: 14,
                  fontWeight: '600',
                }}
              >
                Change email
              </Text>
            </Pressable>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 68,
          }}
        >
          <AppText variant="muted">Password</AppText>
          <Pressable
            onPress={() => router.push(ROUTES.RESET_PASSWORD)}
            accessibilityRole="button"
            style={{
              height: 44,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: theme.accentTint,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: theme.accentTintText,
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              Reset password
            </Text>
          </Pressable>
        </View>
      </Card>

      {accountLinks}

      <Button variant="outline" icon="logout" label="Log out" onPress={handleSignOut} />
    </Screen>
  );
}
