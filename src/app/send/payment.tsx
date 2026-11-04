import {
  AddressCollectionMode,
  CollectionMode,
  useStripe,
} from '@stripe/stripe-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Button, Card, Footer, KeyValue, NavBar, Screen, T } from '@/components/ui';
import { STRIPE_PUBLISHABLE_KEY, WEBSITE_URL } from '@/config/api';
import { money } from '@/data';
import { createRechargePaymentIntent } from '@/services/checkoutService';
import { buildOrder, useStore } from '@/store';
import { fonts, useTheme } from '@/theme';

export default function PaymentScreen() {
  const c = useTheme();
  const { draft, setLastOrder, user } = useStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const order = buildOrder(draft);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const pay = async () => {
    if (processing) return;
    setProcessing(true);
    setError('');
    try {
      if (!/^pk_(test|live)_/.test(STRIPE_PUBLISHABLE_KEY)) {
        throw new Error('Secure payment is not configured. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to your Stripe publishable key, then rebuild the app.');
      }

      console.log("stripe api key", STRIPE_PUBLISHABLE_KEY);
      const intent = await createRechargePaymentIntent(draft, order);
      const initialized = await initPaymentSheet({
        merchantDisplayName: 'Wleesend',
        paymentIntentClientSecret: intent.clientSecret,
        allowsDelayedPaymentMethods: false,
        returnURL: 'wleesend://stripe-redirect',
        defaultBillingDetails: {
          name: [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim(),
          email: user?.email ?? undefined,
          phone: user?.phone ?? undefined,
        },
        billingDetailsCollectionConfiguration: {
          name: CollectionMode.ALWAYS,
          address: AddressCollectionMode.FULL,
          attachDefaultsToPaymentMethod: true,
        },
      });
      if (initialized.error) throw new Error(initialized.error.message);
      const presented = await presentPaymentSheet();
      if (presented.error) {
        if (presented.error.code !== 'Canceled') throw new Error(presented.error.message);
        return;
      }

      setLastOrder(order);
      router.replace('/send/sent');
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Could not start secure checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const link = (label: string, path: string) => (
    <Text
      accessibilityRole="link"
      onPress={() => WebBrowser.openBrowserAsync(`${WEBSITE_URL}/${path}`)}
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
            label={processing ? 'Opening secure checkout…' : `Continue to pay ${money(order.total)}`}
            disabled={processing}
            onPress={() => void pay()}
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

      <Card style={{ padding: 18, gap: 10 }}>
        <T v="display" accessibilityRole="header">Secure checkout</T>
        <T v="body" style={{ fontSize: 14.5, lineHeight: 21 }}>
          Choose a payment method and provide your billing name and address in Stripe’s secure sheet. Wleesend does not store your card details.
        </T>
        {processing ? <ActivityIndicator color={c.brandText} /> : null}
        {error ? <T v="small" style={{ color: c.accentText }} accessibilityLiveRegion="polite">{error}</T> : null}
      </Card>

      <T v="small" style={{ fontSize: 12.5 }}>
        By placing your order, you agree to Wleesend&rsquo;s {link('privacy notice', 'privacy-policy')} and{' '}
        {link('terms and conditions of use', 'terms-and-conditions')}.
      </T>
    </Screen>
  );
}
