import { View } from 'react-native';
import * as Linking from 'expo-linking';
import { Button, Card, NavBar, Screen, AppText, Tile } from '@/components/UiComponents';

const SUPPORT_EMAIL = 'support@wleepay.com';

export default function SupportScreen() {
  return (
    <Screen header={<NavBar title="Support" />}>
      <AppText variant="title" accessibilityRole="header">
        Wleesend Support
      </AppText>
      <Card style={{ padding: 18, paddingVertical: 22, gap: 16 }}>
        <Tile icon="mail" tone="soft" />
        <View style={{ gap: 4 }}>
          <AppText variant="heading" style={{ fontSize: 18 }}>
            Questions?
          </AppText>
          <AppText variant="muted">Please email us at</AppText>
          <AppText variant="strong" style={{ fontSize: 17, lineHeight: 22 }}>
            {SUPPORT_EMAIL}
          </AppText>
        </View>
        <Button
          label="Email support"
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
      </Card>
    </Screen>
  );
}
