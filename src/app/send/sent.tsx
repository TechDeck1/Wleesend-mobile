import { router } from 'expo-router';
import Stack from 'expo-router/stack';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PaymentDone } from '@/components/PaymentDone';
import { Button, Card, KeyValue, AppText } from '@/components/UiComponents';
import { money } from '@/data';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

/** Confirmation after payment. */
export default function SentScreen() {
  const theme = useTheme();
  const { lastOrder } = useStore();

  const handleLeaveConfirmation = (to: '/' | '/transactions') => {
    router.dismissAll();
    router.navigate(to);
  };

  const message = !lastOrder
    ? ''
    : lastOrder.kind === 'airtime'
      ? `Payment received. ${lastOrder.receiver} will receive an SMS when the airtime recharge is processed.`
      : lastOrder.kind === 'utility'
        ? `Payment received. ${lastOrder.receiver} will receive an SMS when the LEC token is processed.`
        : `Payment received. Your ${lastOrder.provider} shopping voucher code will be sent to the email on your account.`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.ground }}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 28 }}>
        <PaymentDone />
        <AppText variant="title" accessibilityRole="header">
          Payment received
        </AppText>
        <AppText variant="muted" style={{ textAlign: 'center' }}>
          {message}
        </AppText>
        {lastOrder ? (
          <Card style={{ alignSelf: 'stretch', marginTop: 8, paddingHorizontal: 18, paddingVertical: 6 }}>
            <KeyValue label="Product" value={lastOrder.product} first />
            <KeyValue label="Total paid" value={money(lastOrder.total)} />
          </Card>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 6 }}>
        <Button label="Back to home" onPress={() => handleLeaveConfirmation('/')} />
        <Button variant="text" label="View transactions" onPress={() => handleLeaveConfirmation('/transactions')} />
      </View>
    </SafeAreaView>
  );
}
