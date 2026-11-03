import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { Button, KeyValue, T } from '@/components/ui';
import { money, type SendKind } from '@/data';
import { brandForTransaction } from '@/services/transactionService';
import type { Transaction } from '@/store';
import { fonts, useTheme } from '@/theme';
import { roundToTwoDecimals } from '@/utils/airtime';

const KIND_LABEL: Record<SendKind, string> = {
  airtime: 'Airtime',
  utility: 'Utility credit',
  voucher: 'Shopping voucher',
};

type Props = {
  transaction: Transaction | null;
  onClose: () => void;
  onResend: (transaction: Transaction) => void;
};

/** Bottom sheet with the full details of one transaction. Shown while `transaction` is not null. */
export function TransactionDetailsModal({ transaction, onClose, onResend }: Props) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const t = transaction;

  return (
    <Modal visible={t !== null} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(13, 15, 43, 0.6)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close transaction details" />

        {t ? (
          <View
            style={{
              maxHeight: '85%',
              backgroundColor: c.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: c.line,
              paddingTop: 10,
              paddingBottom: Math.max(insets.bottom, 16),
            }}>
            {/* Grab handle */}
            <View
              style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.fieldBorder }}
            />

            <ScrollView
              contentContainerStyle={{ padding: 20, gap: 16 }}
              showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={{ alignItems: 'center', gap: 8 }}>
                <BrandLogo brand={brandForTransaction(t)} size={56} />
                <T v="heading" accessibilityRole="header" style={{ textAlign: 'center' }}>
                  {t.product}
                </T>
                <T style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: c.brandText }}>
                  {money(t.total)}
                </T>
                <T v="small">{t.date}</T>
              </View>

              {/* Details */}
              <View
                style={{
                  borderWidth: 1,
                  borderColor: c.line,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 4,
                }}>
                <KeyValue label="Type" value={KIND_LABEL[t.kind]} first />
                <KeyValue label="Provider" value={t.provider} />
                <KeyValue label="Date" value={t.date} />
                <KeyValue label="Amount" value={money(roundToTwoDecimals(t.total - t.fee))} />
                <KeyValue label="Transaction fee" value={money(t.fee)} />
                <KeyValue label="Total paid" value={money(t.total)} />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 16,
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: c.lineSoft,
                  }}>
                  <T v="small" style={{ fontSize: 14 }}>
                    Transaction ID
                  </T>
                  <T v="strong" selectable style={{ fontSize: 13, flexShrink: 1, textAlign: 'right' }}>
                    {t.id}
                  </T>
                </View>
              </View>

              {/* Actions */}
              <View style={{ gap: 6 }}>
                <Button
                  label="Resend"
                  icon="resend"
                  onPress={() => {
                    onClose();
                    onResend(t);
                  }}
                />
                <Button variant="text" label="Close" onPress={onClose} />
              </View>
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}