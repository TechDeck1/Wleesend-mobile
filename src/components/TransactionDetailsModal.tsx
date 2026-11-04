import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/BrandLogo';
import { Button, KeyValue, AppText } from '@/components/UiComponents';
import { money, type SendKind } from '@/data';
import { brandForTransaction } from '@/services/transactionService';
import { fonts, useTheme } from '@/theme';
import { roundToTwoDecimals } from '@/utils/airtime';
import type { TransactionDetailsModalProps } from '@/types/components/TransactionDetailsModal.types';

const KIND_LABEL: Record<SendKind, string> = {
  airtime: 'Airtime',
  utility: 'Utility credit',
  voucher: 'Shopping voucher',
};

/** Bottom sheet with the full details of one transaction. Shown while `transaction` is not null. */
export function TransactionDetailsModal({ transaction, onClose, onResend }: TransactionDetailsModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const transactionDetails = transaction;

  return (
    <Modal visible={transactionDetails !== null} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(13, 15, 43, 0.6)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close transaction details" />

        {transactionDetails ? (
          <View
            style={{
              maxHeight: '85%',
              backgroundColor: theme.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: theme.line,
              paddingTop: 10,
              paddingBottom: Math.max(insets.bottom, 16),
            }}>
            {/* Grab handle */}
            <View
              style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: theme.fieldBorder }}
            />

            <ScrollView
              contentContainerStyle={{ padding: 20, gap: 16 }}
              showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={{ alignItems: 'center', gap: 8 }}>
                <BrandLogo brand={brandForTransaction(transactionDetails)} size={56} />
                <AppText variant="heading" accessibilityRole="header" style={{ textAlign: 'center' }}>
                  {transactionDetails.product}
                </AppText>
                <AppText style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: theme.brandText }}>
                  {money(transactionDetails.total)}
                </AppText>
                <AppText variant="small">{transactionDetails.date}</AppText>
              </View>

              {/* Details */}
              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.line,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 4,
                }}>
                <KeyValue label="Type" value={KIND_LABEL[transactionDetails.kind]} first />
                <KeyValue label="Provider" value={transactionDetails.provider} />
                <KeyValue label="Date" value={transactionDetails.date} />
                <KeyValue label="Amount" value={money(roundToTwoDecimals(transactionDetails.total - transactionDetails.fee))} />
                <KeyValue label="Transaction fee" value={money(transactionDetails.fee)} />
                <KeyValue label="Total paid" value={money(transactionDetails.total)} />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 16,
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: theme.lineSoft,
                  }}>
                  <AppText variant="small" style={{ fontSize: 14 }}>
                    Transaction ID
                  </AppText>
                  <AppText variant="strong" selectable style={{ fontSize: 13, flexShrink: 1, textAlign: 'right' }}>
                    {transactionDetails.id}
                  </AppText>
                </View>
              </View>

              {/* Actions */}
              <View style={{ gap: 6 }}>
                <Button
                  label="Resend"
                  icon="resend"
                  onPress={() => {
                    onClose();
                    onResend(transactionDetails);
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
