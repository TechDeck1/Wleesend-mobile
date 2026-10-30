import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button, Card, LinkRow, Screen, T, Tile } from '@/components/ui';
import { useStore } from '@/store';
import { fonts, useTheme } from '@/theme';

const notConnected = (what: string) => Alert.alert(what, 'This action is not connected yet.');

export default function ProfileScreen() {
  const c = useTheme();
  const { user: USER, signOut } = useStore();

  const links = (
    <Card>
      <LinkRow icon="info" label="About Wleesend" onPress={() => router.push('/about')} />
      <LinkRow icon="mail" label="Support" onPress={() => router.push('/support')} last />
    </Card>
  );

  if (!USER) {
    return (
      <Screen gap={18}>
        <T v="title" accessibilityRole="header">
          My profile
        </T>
        <Card style={{ padding: 20, alignItems: 'center', gap: 10 }}>
          <Tile icon="personAdd" size={56} />
          <T v="heading" style={{ fontSize: 18 }}>
            You&rsquo;re signed out
          </T>
          <T v="muted" style={{ textAlign: 'center' }}>
            Create an account to send credit and see your transactions.
          </T>
          <Button
            label="Create account"
            onPress={() => router.push('/signup')}
            style={{ alignSelf: 'stretch', marginTop: 6 }}
          />
        </Card>
        {links}
      </Screen>
    );
  }

  const detail = (label: string, value: string) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 54,
        borderBottomWidth: 1,
        borderBottomColor: c.lineSoft,
      }}>
      <T v="muted">{label}</T>
      <T v="strong">{value}</T>
    </View>
  );

  return (
    <Screen gap={18}>
      <T v="title" accessibilityRole="header">
        My profile
      </T>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: c.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 19, color: c.onBrand }}>
            {USER.firstName[0]}
            {USER.lastName[0]}
          </Text>
        </View>
        <View>
          <T v="heading" style={{ fontSize: 18 }}>
            {USER.firstName} {USER.lastName}
          </T>
          <T v="small" style={{ fontSize: 14 }}>
            {USER.email}
          </T>
        </View>
      </View>

      <Card style={{ paddingHorizontal: 16 }}>
        {detail('First name', USER.firstName)}
        {detail('Last name', USER.lastName)}
        {USER.phone ? detail('Phone', USER.phone) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: c.lineSoft,
          }}>
          <T v="muted">Email</T>
          <View style={{ alignItems: 'flex-end', paddingTop: 10 }}>
            <T v="strong">{USER.email}</T>
            <Pressable
              onPress={() => notConnected('Change email')}
              accessibilityRole="button"
              style={{ height: 44, justifyContent: 'center', marginTop: -6 }}>
              <Text style={{ color: c.accentText, fontSize: 14, fontWeight: '600' }}>Change email</Text>
            </Pressable>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 68 }}>
          <T v="muted">Password</T>
          <Pressable
            onPress={() => notConnected('Reset password')}
            accessibilityRole="button"
            style={{
              height: 44,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: c.accentTint,
              justifyContent: 'center',
            }}>
            <Text style={{ color: c.accentTintText, fontSize: 14, fontWeight: '600' }}>Reset password</Text>
          </Pressable>
        </View>
      </Card>

      {links}

      <Button variant="outline" icon="logout" label="Log out" onPress={signOut} />
    </Screen>
  );
}
