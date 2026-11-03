import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Text, View, useWindowDimensions } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { PackagePicker, isAvailable } from '@/components/package-picker';
import { Button, Card, Field, Footer, NavBar, Screen, Segment, T } from '@/components/ui';
import {
  COUNTRY_CODE,
  LEC_NAME,
  UTILITY_AMOUNTS,
  VOUCHER_AMOUNTS,
  VOUCHER_VENDORS,
  approxKw,
  money,
} from '@/data';
import { useAirtimeCatalog } from '@/hooks/use-airtime-catalog';
import { buildOrder, useStore } from '@/store';
import { fonts, useTheme } from '@/theme';
import type { AirtimeOperator } from '@/types/airtime';
import {
  brandForOperatorName,
  digitsOnly,
  findRestrictedOperator,
  getPhonePrefixError,
  isValidLiberiaPhone,
} from '@/utils/airtime';
import { CollapsibleRow } from '@/components/collapsible-row';

const TITLES = {
  airtime: { nav: 'Mobile airtime', heading: 'Send mobile airtime credit' },
  utility: { nav: 'Utility credit', heading: 'Send utility credit' },
  voucher: { nav: 'Shopping voucher', heading: 'Send a shopping voucher' },
} as const;

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

/** A loading line, or the error with a retry button, for one of the live API lists. */
function CatalogNotice({ loading, error, onRetry }: { loading: string; error: string | null; onRetry: () => void }) {
  const c = useTheme();
  if (!error) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <ActivityIndicator color={c.brandText} />
        <T v="small">{loading}</T>
      </View>
    );
  }
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: c.accentText, fontSize: 13.5 }} accessibilityLiveRegion="polite">
        {error}
      </Text>
      <Button variant="text" label="Try again" onPress={onRetry} />
    </View>
  );
}

/** Step 1 of 2: who receives the credit and what to send. */
export default function SendDetailsScreen() {
  const c = useTheme();
  const { draft, updateDraft } = useStore();
  const order = buildOrder(draft);
  const isAirtime = draft.kind === 'airtime';
  const catalog = useAirtimeCatalog(isAirtime ? draft.operatorId : null);
  const { operators, operatorsStatus, products, productsStatus } = catalog;
  const product = draft.product;

  const OPERATOR_ROW_HEIGHT = 52;
  const OPERATOR_ROW_GAP = 10;
  // A number's first digits fix its operator, so only that operator is offered once they are typed.
  const restricted = isAirtime ? findRestrictedOperator(digitsOnly(draft.phone), operators) : undefined;
  const phoneError = isAirtime ? getPhonePrefixError(digitsOnly(draft.phone)) : undefined;

  const selectOperator = (op: AirtimeOperator) =>
    updateDraft({
      operatorId: op.id,
      operatorName: op.name,
      operator: brandForOperatorName(op.name) ?? draft.operator,
      product: null,
      topUp: '',
    });

  // Once operators load: follow the number's operator, else keep the chosen one, else use the one
  // picked on the Products screen. Clear a choice that is no longer on offer.
  useEffect(() => {
    if (!isAirtime || operatorsStatus !== 'ready') return;
    const chosen = operators.find((op) => op.id === draft.operatorId);
    if (restricted) {
      if (restricted.id !== draft.operatorId) selectOperator(restricted);
    } else if (!chosen) {
      const hinted = operators.find((op) => brandForOperatorName(op.name) === draft.operator);
      if (hinted) selectOperator(hinted);
      else if (draft.operatorId !== null) updateDraft({ operatorId: null, operatorName: '', product: null, topUp: '' });
    }
    // selectOperator only reads `draft.operator`, which is already listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAirtime, operatorsStatus, operators, restricted, draft.operatorId, draft.operator]);

  const selectProduct = (id: number) => {
    const chosen = products.find((p) => p.id === id);
    if (chosen) updateDraft({ product: chosen, topUp: chosen.isRange ? String(chosen.min) : '' });
  };

  const next = () => {
    if (!draft.phone) {
      Alert.alert('Receiver phone', 'Enter the receiver phone number.');
      return;
    }
    if (isAirtime) {
      if (!isValidLiberiaPhone(digitsOnly(draft.phone))) {
        Alert.alert('Receiver phone', 'Enter a valid 9-digit MTN or Orange number, without the country code.');
        return;
      }
      if (draft.operatorId === null) {
        Alert.alert('Operator', 'Select an operator.');
        return;
      }
      if (!product) {
        Alert.alert('Package', 'Select a package.');
        return;
      }
      if (!isAvailable(product)) {
        Alert.alert('Package', 'This package has no price yet. Choose another one.');
        return;
      }
      if (product.isRange) {
        const amount = Number(draft.topUp);
        if (!(amount >= product.min && amount <= product.max)) {
          Alert.alert('Top-up amount', `Enter an amount from $${product.min} to $${product.max}.`);
          return;
        }
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
          maxLength={isAirtime ? 9 : undefined}
          error={phoneError}
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
            {operatorsStatus === 'ready' ? (
              operators.length ? (
                <View style={{ marginBottom: -OPERATOR_ROW_GAP }}>
                  {operators.map((op) => {
                    const brand = brandForOperatorName(op.name);
                    return (
                      <CollapsibleRow
                        key={op.id}
                        visible={!restricted || restricted.id === op.id}
                        height={OPERATOR_ROW_HEIGHT}
                        gap={OPERATOR_ROW_GAP}>
                        <Segment
                          label={op.name}
                          leading={brand ? <BrandLogo brand={brand} size={28} /> : undefined}
                          selected={draft.operatorId === op.id}
                          onPress={() => selectOperator(op)}
                        />
                      </CollapsibleRow>
                    );
                  })}
                </View>
              ) : (
                <T v="small">No operators are available right now.</T>
              )
            ) : (
              <CatalogNotice
                loading="Loading operators…"
                error={catalog.operatorsError}
                onRetry={catalog.reloadOperators}
              />
            )}
          </View>
          {phoneField}
          <View style={{ gap: 8 }}>
            <T v="label">Package</T>
            {draft.operatorId === null ? (
              <T v="small">{operatorsStatus === 'ready' ? 'Select an operator to see its packages.' : ' '}</T>
            ) : productsStatus === 'ready' ? (
              products.length ? (
                <PackagePicker packages={products} selectedId={product?.id ?? null} onSelect={selectProduct} />
              ) : (
                <T v="small">No packages are available for this operator.</T>
              )
            ) : (
              <CatalogNotice
                loading="Loading packages…"
                error={catalog.productsError}
                onRetry={catalog.reloadProducts}
              />
            )}
            {product?.isRange ? (
              <Field
                label="Top-up amount (USD)"
                placeholder={`${product.min} to ${product.max}`}
                keyboardType="decimal-pad"
                maxLength={7}
                value={draft.topUp}
                onChangeText={(text) => updateDraft({ topUp: text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') })}
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
