import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { Button, Card, Field, Footer, KeyValue, NavBar, Screen, Segment, T, Tile } from '@/components/ui';
import { WEBSITE_URL } from '@/config/api';
import { money } from '@/data';
import { buildOrder, useStore } from '@/store';
import { fonts, useTheme } from '@/theme';

type Method = 'Card' | 'Apple Pay' | 'Google Pay';

/** Each phone offers its own wallet; the web preview shows all three. */
const METHODS: Method[] = Platform.select({
  ios: ['Card', 'Apple Pay'],
  android: ['Card', 'Google Pay'],
  default: ['Card', 'Apple Pay', 'Google Pay'],
});

/**
 * Step 2 of 2: order summary and payment.
 *
 * The card fields and wallet buttons are a visual placeholder only. Before launch, replace
 * them with your payment provider's mobile SDK (its card sheet, Apple Pay and Google Pay)
 * so card numbers never pass through the app.
 */
export default function PaymentScreen() {
  const c = useTheme();
  const { draft, completeOrder } = useStore();
  const order = buildOrder(draft);
  const [method, setMethod] = useState<Method>('Card');
  const isCard = method === 'Card';

  const pay = () => {
    completeOrder(order);
    router.replace('/send/sent');
  };

  const link = (label: string) => (
    <Text
      accessibilityRole="link"
      onPress={() => Linking.openURL(WEBSITE_URL)}
      style={{ color: c.brandText, fontWeight: '600', textDecorationLine: 'underline' }}>
      {label}
    </Text>
  );

  return (
    <Screen
      gap={16}
      header={<NavBar title="Payment" step={2} />}
      footer={
        <Footer>
          <Button
            label={isCard ? `Pay ${money(order.total)}` : `Pay ${money(order.total)} with ${method}`}
            onPress={pay}
          />
        </Footer>
      }>
      <Card style={{ padding: 18, paddingTop: 16, paddingBottom: 6 }}>
        <T v="display" style={{ marginBottom: 8 }} accessibilityRole="header">
          Order summary
        </T>
        {order.rows.map(([label, value]) => (
          <KeyValue key={label} label={label} value={value} />
        ))}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            paddingTop: 12,
            paddingBottom: 10,
            borderTopWidth: 1,
            borderTopColor: c.fieldBorder,
          }}>
          <T v="strong">Total amount</T>
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: c.brandText }}>{money(order.total)}</Text>
        </View>
      </Card>

      <View style={{ gap: 8 }}>
        <T v="display" accessibilityRole="header">
          Payment method
        </T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {METHODS.map((m) => (
            <Segment key={m} label={m} selected={method === m} onPress={() => setMethod(m)} />
          ))}
        </View>
      </View>

      {isCard ? (
        <>
          <Card style={{ padding: 18, gap: 14 }}>
            <T v="display" accessibilityRole="header">
              Card details
            </T>
            <View>
              <Field label="Card number" placeholder="0000 0000 0000 0000" keyboardType="number-pad" />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Field label="Expiry" placeholder="MM/YY" keyboardType="numbers-and-punctuation" />
              <Field label="CVV" placeholder="123" keyboardType="number-pad" secureTextEntry />
            </View>
          </Card>

          <Card style={{ padding: 18, gap: 14 }}>
            <T v="display" accessibilityRole="header">
              Billing details
            </T>
            <View>
              <Field label="Name on card" placeholder="Name on card" autoCapitalize="words" />
            </View>
            <View>
              <Field label="Street address" placeholder="Street address" />
            </View>
            <View>
              <Field label="City / Town" placeholder="City / Town" />
            </View>
            <View>
              {/* Replace with a country picker when more billing countries are supported. */}
              <Field label="Country" value="United States of America" editable={false} />
            </View>
            <View>
              <Field label="Zip / Postal code" placeholder="Zip / Postal code" />
            </View>
          </Card>
        </>
      ) : (
        <Card style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Tile icon="wallet" size={46} />
          <T v="body" style={{ flex: 1, fontSize: 14.5, lineHeight: 20 }}>
            You&rsquo;ll confirm the payment with {method} after tapping Pay. No card details needed.
          </T>
        </Card>
      )}

      <T v="small" style={{ fontSize: 12.5 }}>
        By placing your order, you agree to Wleesend&rsquo;s {link('privacy notice')} and{' '}
        {link('terms and conditions of use')}.
      </T>
    </Screen>
  );
}
