import { router } from 'expo-router';
import { Alert, Text, View, useWindowDimensions } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { PackagePicker } from '@/components/package-picker';
import { Button, Card, Field, Footer, NavBar, Screen, Segment, T } from '@/components/ui';
import {
  COUNTRY_CODE,
  LEC_NAME,
  OPERATORS,
  TOP_UP,
  UTILITY_AMOUNTS,
  VOUCHER_AMOUNTS,
  VOUCHER_VENDORS,
  approxKw,
  money,
  type OperatorId,
} from '@/data';
import { buildOrder, useStore } from '@/store';
import { fonts, useTheme } from '@/theme';

const OPERATOR_IDS = Object.keys(OPERATORS) as OperatorId[];

const TITLES = {
  airtime: { nav: 'Mobile airtime', heading: 'Send mobile airtime credit' },
  utility: { nav: 'Utility credit', heading: 'Send utility credit' },
  voucher: { nav: 'Shopping voucher', heading: 'Send a shopping voucher' },
} as const;

/** Dollar amounts as a wrapping grid, four per row. */
function AmountGrid({ amounts, value, onChange }: { amounts: number[]; value: number; onChange: (n: number) => void }) {
  const { width } = useWindowDimensions();
  const chip = Math.floor((Math.min(width, 430) - 40 - 3 * 8) / 4);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {amounts.map((amount) => (
        <View key={amount} style={{ width: chip }}>
          <Segment label={`$${amount}`} selected={value === amount} onPress={() => onChange(amount)} />
        </View>
      ))}
    </View>
  );
}

/** Step 1 of 2: who receives the credit and what to send. */
export default function SendDetailsScreen() {
  const c = useTheme();
  const { draft, updateDraft } = useStore();
  const order = buildOrder(draft);
  const isAirtime = draft.kind === 'airtime';
  const operator = OPERATORS[draft.operator];

  const pickOperator = (id: OperatorId) =>
    updateDraft({
      operator: id,
      packageId: OPERATORS[id].defaultPackage,
      ...(draft.phoneEdited ? {} : { phone: OPERATORS[id].samplePhone }),
    });

  const next = () => {
    if (!draft.phone) {
      Alert.alert('Receiver phone', 'Enter the receiver phone number.');
      return;
    }
    if (isAirtime && draft.packageId === TOP_UP.id) {
      const amount = Number(draft.topUp);
      if (!(amount >= TOP_UP.min && amount <= TOP_UP.max)) {
        Alert.alert('Top-up amount', `Enter an amount from $${TOP_UP.min} to $${TOP_UP.max}.`);
        return;
      }
    }
    router.push('/send/payment');
  };

  const phoneField = (
    <View style={{ gap: 6 }}>
      <T v="label">Receiver phone</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View
          style={{
            height: 50,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: c.brandTint,
            justifyContent: 'center',
          }}>
          <Text style={{ color: c.brandText, fontSize: 16, fontWeight: '600' }}>{COUNTRY_CODE}</Text>
        </View>
        <Field
          accessibilityLabel="Receiver phone"
          placeholder="Phone number"
          keyboardType="number-pad"
          value={draft.phone}
          onChangeText={(text) => updateDraft({ phone: text.replace(/[^0-9]/g, ''), phoneEdited: true })}
        />
      </View>
    </View>
  );

  return (
    <Screen
      gap={22}
      header={<NavBar title={TITLES[draft.kind].nav} step={1} />}
      footer={
        <Footer row>
          <View style={{ flex: 1 }}>
            <T v="small" style={{ fontSize: 12.5 }}>
              Total, incl. {money(order.fee)} fee
            </T>
            <T style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 28 }}>{money(order.total)}</T>
            {draft.kind === 'utility' ? (
              <T v="small" style={{ fontSize: 12.5, fontWeight: '600', color: c.brandText }}>
                Approx. {approxKw(draft.amount)}
              </T>
            ) : null}
          </View>
          <Button label="Continue" onPress={next} />
        </Footer>
      }>
      <T v="title" style={{ fontSize: 26, lineHeight: 32 }} accessibilityRole="header">
        {TITLES[draft.kind].heading}
      </T>

      {isAirtime ? (
        <>
          <View style={{ gap: 8 }}>
            <T v="label">Operator</T>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {OPERATOR_IDS.map((id) => (
                <Segment
                  key={id}
                  label={OPERATORS[id].label}
                  leading={<BrandLogo brand={id} size={28} />}
                  selected={draft.operator === id}
                  onPress={() => pickOperator(id)}
                />
              ))}
            </View>
          </View>
          {phoneField}
          <View style={{ gap: 8 }}>
            <T v="label">Package</T>
            <PackagePicker
              packages={operator.packages}
              selectedId={draft.packageId}
              onSelect={(packageId) => updateDraft({ packageId })}
            />
            {draft.packageId === TOP_UP.id ? (
              <Field
                label="Top-up amount (USD)"
                placeholder={`${TOP_UP.min} to ${TOP_UP.max}`}
                keyboardType="number-pad"
                maxLength={3}
                value={draft.topUp}
                onChangeText={(text) => updateDraft({ topUp: text.replace(/[^0-9]/g, '') })}
              />
            ) : null}
          </View>
        </>
      ) : draft.kind === 'voucher' ? (
        <>
          <View style={{ gap: 8 }}>
            <T v="label">Vendor</T>
            {VOUCHER_VENDORS.map((v) => (
              <Card
                key={v.id}
                style={{ padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <BrandLogo brand={v.id} size={46} />
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="strong">{v.name}</T>
                  <T v="small" style={{ fontSize: 13.5 }}>
                    Shopping voucher code delivered by SMS
                  </T>
                </View>
              </Card>
            ))}
          </View>
          {phoneField}
          <View style={{ gap: 8 }}>
            <T v="label">Shopping voucher amount (USD)</T>
            <AmountGrid
              amounts={VOUCHER_AMOUNTS}
              value={draft.voucherAmount}
              onChange={(voucherAmount) => updateDraft({ voucherAmount })}
            />
          </View>
        </>
      ) : (
        <>
          <Card style={{ padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <BrandLogo brand="lec" size={46} />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="strong">{LEC_NAME}</T>
              <T v="small" style={{ fontSize: 13.5 }}>
                Credit token delivered by SMS
              </T>
            </View>
          </Card>
          <View>
            <Field
              label="Meter number"
              placeholder="Meter number"
              keyboardType="number-pad"
              value={draft.meter}
              onChangeText={(meter) => updateDraft({ meter })}
            />
          </View>
          {phoneField}
          <View style={{ gap: 8 }}>
            <T v="label">Amount (USD)</T>
            <AmountGrid amounts={UTILITY_AMOUNTS} value={draft.amount} onChange={(amount) => updateDraft({ amount })} />
            <T v="small" style={{ fontSize: 13.5 }}>
              You will receive approx. {approxKw(draft.amount)}
            </T>
          </View>
        </>
      )}
    </Screen>
  );
}
