import * as Linking from 'expo-linking';
import { View } from 'react-native';

import { Button, Card, NavBar, Screen, T, Tile } from '@/components/ui';

const SUPPORT_EMAIL = 'support@wleepay.com';

export default function SupportScreen() {
  return (
    <Screen header={<NavBar title="Support" />}>
      <T v="title" accessibilityRole="header">
        Wleesend Support
      </T>
      <Card style={{ padding: 18, paddingVertical: 22, gap: 16 }}>
        <Tile icon="mail" tone="soft" />
        <View style={{ gap: 4 }}>
          <T v="heading" style={{ fontSize: 18 }}>
            Questions?
          </T>
          <T v="muted">Please email us at</T>
          <T v="strong" style={{ fontSize: 17, lineHeight: 22 }}>
            {SUPPORT_EMAIL}
          </T>
        </View>
        <Button label="Email support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
      </Card>
    </Screen>
  );
}
