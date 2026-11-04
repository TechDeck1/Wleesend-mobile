import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Text, View, useWindowDimensions } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { PackagePicker, isAvailable } from '@/components/PackagePicker';
import { Button, Card, Field, Footer, NavBar, Screen, Segment, AppText } from '@/components/UiComponents';
import {
  COUNTRY_CODE,
  LEC_NAME,
  UTILITY_AMOUNTS,
  UTILITY_MIN_AMOUNT,
  approxKw,
  money,
  VOUCHER_VENDOR_ID,
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
import { CollapsibleRow } from '@/components/CollapsibleRow';
import { useVoucherCatalog } from '@/hooks/use-voucher-catalog';


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
          <Segment label={`$${amount}`} isSelected={value === amount} onPress={() => onChange(amount)} />
        </View>
      ))}
    </View>
  );
}

function CatalogNotice({ loadingMessage, error, onRetry }: { loadingMessage: string; error: string | null; onRetry: () => void }) {
  const theme = useTheme();
  if (!error) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <ActivityIndicator color={theme.brandText} />
        <AppText variant="small">{loadingMessage}</AppText>
      </View>
    );
  }
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: theme.accentText, fontSize: 13.5 }} accessibilityLiveRegion="polite">
        {error}
      </Text>
      <Button variant="text" label="Try again" onPress={onRetry} />
    </View>
  );
}

export default function SendDetailsScreen() {
  const theme = useTheme();
  const { draft, updateDraft } = useStore();
  const order = buildOrder(draft);
  const isAirtime = draft.kind === 'airtime';
  const catalog = useAirtimeCatalog(isAirtime ? draft.operatorId : null);
  const { operators, operatorsStatus, products, productsStatus } = catalog;
  const selectedAirtimeProduct = draft.product;

  const OPERATOR_ROW_HEIGHT = 52;
  const OPERATOR_ROW_GAP = 10;
  // A number's first digits fix its operator, so only that operator is offered once they are typed.
  const restricted = isAirtime ? findRestrictedOperator(digitsOnly(draft.phone), operators) : undefined;
  const phoneError = isAirtime ? getPhonePrefixError(digitsOnly(draft.phone)) : undefined;
  const isVoucher = draft.kind === 'voucher';
  const voucherCatalog = useVoucherCatalog(isVoucher);
  const voucherProduct = draft.voucherProduct;


  const handleSelectOperator = (operator: AirtimeOperator) =>
    updateDraft({
      operatorId: operator.id,
      operatorName: operator.name,
      operator: brandForOperatorName(operator.name) ?? draft.operator,
      product: null,
      topUp: '',
    });

  const handleSelectVoucherProduct = (productId: number) => {
    const selectedProduct = voucherCatalog.products.find((productOption) => productOption.id === productId);
    if (selectedProduct)
      updateDraft({
        voucherProduct: selectedProduct,
        voucherOperatorName: voucherCatalog.operatorName,
        topUp: selectedProduct.isRange ? String(selectedProduct.min) : '',
      });
  };

  // Once operators load: follow the number's operator, else keep the chosen one, else use the one
  // picked on the Products screen. Clear a choice that is no longer on offer.
  useEffect(() => {
    if (!isAirtime || operatorsStatus !== 'ready') return;
    const selectedOperator = operators.find((operator) => operator.id === draft.operatorId);
    if (restricted) {
      if (restricted.id !== draft.operatorId) handleSelectOperator(restricted);
    } else if (!selectedOperator) {
      const hinted = operators.find((operator) => brandForOperatorName(operator.name) === draft.operator);
      if (hinted) handleSelectOperator(hinted);
      else if (draft.operatorId !== null) updateDraft({ operatorId: null, operatorName: '', product: null, topUp: '' });
    }
    // handleSelectOperator only reads `draft.operator`, which is already listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAirtime, operatorsStatus, operators, restricted, draft.operatorId, draft.operator]);

  const handleSelectProduct = (productId: number) => {
    const selectedProduct = products.find((productOption) => productOption.id === productId);
    if (selectedProduct) updateDraft({ product: selectedProduct, topUp: selectedProduct.isRange ? String(selectedProduct.min) : '' });
  };

  const handleContinue = () => {
    if (draft.kind !== 'voucher' && !draft.phone) {
      Alert.alert('Receiver phone', 'Enter the receiver phone number.');
      return;
    }
    if (draft.kind === 'utility' && (!/^\d{9}$/.test(digitsOnly(draft.phone)) || digitsOnly(draft.phone).startsWith('0'))) {
      Alert.alert('Receiver phone', 'Enter a valid 9-digit Liberia number without the country code or leading zero.');
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
      if (!selectedAirtimeProduct) {
        Alert.alert('Package', 'Select a package.');
        return;
      }
      if (!isAvailable(selectedAirtimeProduct)) {
        Alert.alert('Package', 'This package has no price yet. Choose another one.');
        return;
      }
      if (selectedAirtimeProduct.isRange) {
        const amount = Number(draft.topUp);
        if (!(amount >= selectedAirtimeProduct.min && amount <= selectedAirtimeProduct.max)) {
          Alert.alert('Top-up amount', `Enter an amount from $${selectedAirtimeProduct.min} to $${selectedAirtimeProduct.max}.`);
          return;
        }
      }
    }

    if (isVoucher) {
      if (!voucherProduct) {
        Alert.alert('Voucher', 'Select a voucher.');
        return;
      }
      if (!isAvailable(voucherProduct)) {
        Alert.alert('Voucher', 'This voucher has no price yet. Choose another one.');
        return;
      }
      if (voucherProduct.isRange) {
        const amount = Number(draft.topUp);
        if (!(amount >= voucherProduct.min && amount <= voucherProduct.max)) {
          Alert.alert('Voucher amount', `Enter an amount from $${voucherProduct.min} to $${voucherProduct.max}.`);
          return;
        }
      }
    }

    if (draft.kind === 'utility') {
      if (!/^\d{10,12}$/.test(draft.meter.trim())) {
        Alert.alert('Meter number', 'Enter a valid 10 to 12 digit meter number.');
        return;
      }
      if (!(draft.amount >= UTILITY_MIN_AMOUNT)) {
        Alert.alert('Amount', `Enter an amount of at least $${UTILITY_MIN_AMOUNT}.`);
        return;
      }
    }

    router.push('/send/payment');
  };

  const phoneField = (
    <View style={{ gap: 6 }}>
      <AppText variant="label">Receiver phone</AppText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View
          style={{
            height: 50,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: theme.brandTint,
            justifyContent: 'center',
          }}>
          <Text style={{ color: theme.brandText, fontSize: 16, fontWeight: '600' }}>{COUNTRY_CODE}</Text>
        </View>
        <Field
          accessibilityLabel="Receiver phone"
          placeholder="Phone number"
          keyboardType="number-pad"
          maxLength={isAirtime ? 9 : undefined}
          error={phoneError}
          value={draft.phone}
          onChangeText={(phoneValue) => updateDraft({ phone: phoneValue.replace(/[^0-9]/g, ''), isPhoneEdited: true })}
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
            <AppText variant="small" style={{ fontSize: 12.5 }}>
              Total, incl. {money(order.fee)} fee
            </AppText>
            <AppText style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 28 }}>{money(order.total)}</AppText>
            {draft.kind === 'utility' ? (
              <AppText variant="small" style={{ fontSize: 12.5, fontWeight: '600', color: theme.brandText }}>
                Approx. {approxKw(draft.amount)}
              </AppText>
            ) : null}
          </View>
          <Button label="Continue" onPress={handleContinue} />
        </Footer>
      }>
      <AppText variant="title" style={{ fontSize: 26, lineHeight: 32 }} accessibilityRole="header">
        {TITLES[draft.kind].heading}
      </AppText>

      {isAirtime ? (
        <>
          <View style={{ gap: 8 }}>
            <AppText variant="label">Operator</AppText>
            {operatorsStatus === 'ready' ? (
              operators.length ? (
                <View style={{ marginBottom: -OPERATOR_ROW_GAP }}>
                  {operators.map((operator) => {
                    const brand = brandForOperatorName(operator.name);
                    return (
                      <CollapsibleRow
                        key={operator.id}
                        isVisible={!restricted || restricted.id === operator.id}
                        height={OPERATOR_ROW_HEIGHT}
                        gap={OPERATOR_ROW_GAP}>
                        <Segment
                          label={operator.name}
                          leading={brand ? <BrandLogo brand={brand} size={28} /> : undefined}
                          isSelected={draft.operatorId === operator.id}
                          onPress={() => handleSelectOperator(operator)}
                        />
                      </CollapsibleRow>
                    );
                  })}
                </View>
              ) : (
                <AppText variant="small">No operators are available right now.</AppText>
              )
            ) : (
              <CatalogNotice
                loadingMessage="Loading operators…"
                error={catalog.operatorsError}
                onRetry={catalog.reloadOperators}
              />
            )}
          </View>
          {phoneField}
          <View style={{ gap: 8 }}>
            <AppText variant="label">Package</AppText>
            {draft.operatorId === null ? (
              <AppText variant="small">{operatorsStatus === 'ready' ? 'Select an operator to see its packages.' : ' '}</AppText>
            ) : productsStatus === 'ready' ? (
              products.length ? (
                <PackagePicker packages={products} selectedId={selectedAirtimeProduct?.id ?? null} onSelect={handleSelectProduct} />
              ) : (
                <AppText variant="small">No packages are available for this operator.</AppText>
              )
            ) : (
              <CatalogNotice
                loadingMessage="Loading packages…"
                error={catalog.productsError}
                onRetry={catalog.reloadProducts}
              />
            )}
            {selectedAirtimeProduct?.isRange ? (
              <Field
                label="Top-up amount (USD)"
                placeholder={`${selectedAirtimeProduct.min} to ${selectedAirtimeProduct.max}`}
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
            <AppText variant="label">Vendor</AppText>
            <Card style={{ padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <BrandLogo brand={VOUCHER_VENDOR_ID} size={46} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="strong">{voucherCatalog.operatorName}</AppText>
                <AppText variant="small" style={{ fontSize: 13.5 }}>
                  Shopping voucher code sent to the checkout email
                </AppText>
              </View>
            </Card>
          </View>
          <View style={{ gap: 8 }}>
            <AppText variant="label">Shopping voucher</AppText>
            {voucherCatalog.status === 'ready' ? (
              voucherCatalog.products.length ? (
                <PackagePicker
                  packages={voucherCatalog.products}
                  selectedId={voucherProduct?.id ?? null}
                  onSelect={handleSelectVoucherProduct}
                />
              ) : (
                <AppText variant="small">No vouchers are available right now.</AppText>
              )
            ) : (
              <CatalogNotice loadingMessage="Loading vouchers…" error={voucherCatalog.error} onRetry={voucherCatalog.reload} />
            )}
            {voucherProduct?.isRange ? (
              <Field
                label="Voucher amount (USD)"
                placeholder={`${voucherProduct.min} to ${voucherProduct.max}`}
                keyboardType="decimal-pad"
                maxLength={7}
                value={draft.topUp}
                onChangeText={(text) => updateDraft({ topUp: text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') })}
              />
            ) : null}
          </View>
        </>
      ) : (
        <>
          <Card style={{ padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <BrandLogo brand="lec" size={46} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="strong">{LEC_NAME}</AppText>
              <AppText variant="small" style={{ fontSize: 13.5 }}>
                Credit token delivered by SMS
              </AppText>
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
            <AppText variant="label">Amount (USD)</AppText>
            <AmountGrid amounts={UTILITY_AMOUNTS} value={draft.amount} onChange={(amount) => updateDraft({ amount })} />
            <Field label="Custom amount (USD)" placeholder="Enter amount" keyboardType="decimal-pad" value={UTILITY_AMOUNTS.includes(draft.amount) ? '' : String(draft.amount)} onChangeText={(text) => { const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); updateDraft({ amount: cleaned ? Number(cleaned) : 0 }); }} />
            <AppText variant="small" style={{ fontSize: 13.5 }}>
              You will receive approx. {approxKw(draft.amount)}
            </AppText>
          </View>
        </>
      )}
    </Screen>
  );
}
