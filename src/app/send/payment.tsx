import { ActivityIndicator, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Button, Card, Footer, KeyValue, NavBar, Screen, AppText } from '@/components/UiComponents';
import { WEBSITE_URL } from '@/config/api';
import { money } from '@/data';
import { usePaymentFlow } from '@/hooks/use-payment-flow';
import { fonts, useTheme } from '@/theme';

export default function PaymentScreen() {
  const theme = useTheme();
  const { order, isProcessing, error, handlePayment } = usePaymentFlow();

  const renderLegalLink = (label: string, path: string) => (
    <Text
      accessibilityRole="link"
      onPress={() => WebBrowser.openBrowserAsync(`${WEBSITE_URL}/${path}`)}
      style={{ color: theme.brandText, fontWeight: '600', textDecorationLine: 'underline' }}>
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
            label={isProcessing ? 'Opening secure checkout…' : `Continue to pay ${money(order.total)}`}
            disabled={isProcessing}
          onPress={() => void handlePayment()}
          />
        </Footer>
      }>
      <Card style={{ padding: 18, paddingTop: 16, paddingBottom: 6 }}>
        <AppText variant="display" style={{ marginBottom: 8 }} accessibilityRole="header">
          Order summary
        </AppText>
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
            borderTopColor: theme.fieldBorder,
          }}>
          <AppText variant="strong">Total amount</AppText>
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: theme.brandText }}>{money(order.total)}</Text>
        </View>
      </Card>

      <Card style={{ padding: 18, gap: 10 }}>
        <AppText variant="display" accessibilityRole="header">Secure checkout</AppText>
        <AppText variant="body" style={{ fontSize: 14.5, lineHeight: 21 }}>
          Choose a payment method and provide your billing name and address in Stripe’s secure sheet. Wleesend does not store your card details.
        </AppText>
        {isProcessing ? <ActivityIndicator color={theme.brandText} /> : null}
        {error ? <AppText variant="small" style={{ color: theme.accentText }} accessibilityLiveRegion="polite">{error}</AppText> : null}
      </Card>

      <AppText variant="small" style={{ fontSize: 12.5 }}>
        By placing your order, you agree to Wleesend&rsquo;s {renderLegalLink('privacy notice', 'privacy-policy')} and{' '}
        {renderLegalLink('terms and conditions of use', 'terms-and-conditions')}.
      </AppText>
    </Screen>
  );
}
