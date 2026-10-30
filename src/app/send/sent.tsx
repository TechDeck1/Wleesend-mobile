import { router } from 'expo-router';
import Stack from 'expo-router/stack';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PaymentDone } from '@/components/payment-done';
import { Button, Card, KeyValue, T } from '@/components/ui';
import { money } from '@/data';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

/** Confirmation after payment. */
export default function SentScreen() {
  const c = useTheme();
  const { lastOrder } = useStore();

  const leave = (to: '/' | '/transactions') => {
    router.dismissAll();
    router.navigate(to);
  };

  const message = !lastOrder
    ? ''
    : lastOrder.kind === 'airtime'
      ? `${lastOrder.receiver} will receive an SMS with the token to top up their phone.`
      : lastOrder.kind === 'utility'
        ? `${lastOrder.receiver} will receive an SMS with the LEC token to top up their electricity meter.`
        : `${lastOrder.receiver} will receive an SMS with their ${lastOrder.provider} shopping voucher code.`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.ground }}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 28 }}>
        <PaymentDone />
        <T v="title" accessibilityRole="header">
          Credit sent
        </T>
        <T v="muted" style={{ textAlign: 'center' }}>
          {message}
        </T>
        {lastOrder ? (
          <Card style={{ alignSelf: 'stretch', marginTop: 8, paddingHorizontal: 18, paddingVertical: 6 }}>
            <KeyValue label="Product" value={lastOrder.product} first />
            <KeyValue label="Total paid" value={money(lastOrder.total)} />
          </Card>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 6 }}>
        <Button label="Back to home" onPress={() => leave('/')} />
        <Button variant="text" label="View transactions" onPress={() => leave('/transactions')} />
      </View>
    </SafeAreaView>
  );
}
