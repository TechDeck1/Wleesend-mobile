import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { Button, Card, Icon, Screen, Segment, AppText, Tile } from '@/components/UiComponents';
import { money, type SendKind } from '@/data';
import { useTransactionHistory } from '@/hooks/use-transaction-history';
import { useStore, type Transaction } from '@/store';
import { fonts, useTheme } from '@/theme';
import { brandForTransaction } from '@/services/transactionService';
import { TransactionDetailsModal } from '@/components/TransactionDetailsModal';

const FILTERS: { id: 'all' | SendKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'airtime', label: 'Airtime' },
  { id: 'utility', label: 'Utility' },
  { id: 'voucher', label: 'Shopping voucher' },
];

const KIND_LABEL: Record<SendKind, string> = {
  airtime: 'Airtime',
  utility: 'Utility',
  voucher: 'Shopping voucher',
};
const KINDS = Object.keys(KIND_LABEL) as SendKind[];

export default function TransactionsScreen() {
  const theme = useTheme();
  const { resend } = useStore();
  const [filter, setFilter] = useState<'all' | SendKind>('all');
  const { rows, totals, isLoading, error, hasMore, handleRefresh, handleLoadMore } =
    useTransactionHistory(filter);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const totalSent =
    filter === 'all'
      ? KINDS.reduce((subtotal, kind) => subtotal + totals[kind], 0)
      : totals[filter];

  const handleSendAgain = (transaction: Transaction) => {
    resend(transaction);
    router.push(transaction.draft.phone ? ROUTES.SEND_PAYMENT : ROUTES.SEND);
  };
  return (
    <Screen
      gap={18}
      onScrollNearEnd={() => {
        if (hasMore && !isLoading && !error) void handleLoadMore();
      }}
    >
      <AppText variant="title" accessibilityRole="header">
        Transactions
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FILTERS.map((transactionFilter) => (
          <Segment
            key={transactionFilter.id}
            shape="chip"
            label={transactionFilter.label}
            isSelected={filter === transactionFilter.id}
            onPress={() => setFilter(transactionFilter.id)}
          />
        ))}
      </View>

      {isLoading && rows.length === 0 ? (
        <ActivityIndicator style={{ paddingTop: 72 }} accessibilityLabel="Loading transactions" />
      ) : null}

      {!isLoading && !error && rows.length === 0 ? (
        <View
          style={{
            alignItems: 'center',
            gap: 14,
            paddingTop: 72,
            paddingHorizontal: 24,
          }}
        >
          <Tile icon="list" size={72} />
          <AppText variant="heading" style={{ fontSize: 18 }}>
            No transactions found.
          </AppText>
          <AppText variant="muted" style={{ textAlign: 'center' }}>
            Credit you send will be listed here.
          </AppText>
          <Button
            label="Send credit"
            onPress={() => router.navigate(ROUTES.PRODUCTS)}
            style={{ height: 50, marginTop: 6 }}
          />
        </View>
      ) : null}

      {rows.length > 0 ? (
        <Card>
          {rows.map((transaction, index) => (
            <Pressable
              key={transaction.id}
              onPress={() => setSelectedTransaction(transaction)}
              accessibilityRole="button"
              accessibilityLabel={`View details of ${transaction.product}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                paddingHorizontal: 16,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.lineSoft,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <BrandLogo brand={brandForTransaction(transaction)} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="strong" style={{ fontSize: 14.5 }}>
                  {transaction.product}
                </AppText>
                <AppText variant="small" style={{ fontSize: 12.5 }}>
                  {transaction.provider}
                </AppText>
                <AppText variant="small" style={{ fontSize: 12.5 }}>
                  {transaction.receiver}, {transaction.date}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <AppText style={{ fontFamily: fonts.display, fontSize: 15 }}>
                  {money(transaction.total)}
                </AppText>
                <Pressable
                  onPress={() => handleSendAgain(transaction)}
                  accessibilityRole="button"
                  accessibilityLabel={`Resend ${transaction.product} to ${transaction.receiver}`}
                  hitSlop={6}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: theme.brandTint,
                  }}
                >
                  <Icon name="resend" size={13} color={theme.brandText} />
                  <Text
                    style={{
                      color: theme.brandText,
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    Resend
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {error ? (
        <View
          style={{
            alignItems: 'center',
            gap: 12,
            paddingTop: rows.length === 0 ? 48 : 0,
          }}
        >
          <AppText variant="muted" style={{ textAlign: 'center' }}>
            {error}
          </AppText>
          <Button
            label="Try again"
            onPress={rows.length === 0 ? handleRefresh : handleLoadMore}
            style={{ height: 50 }}
          />
        </View>
      ) : null}

      {isLoading && rows.length > 0 ? (
        <ActivityIndicator accessibilityLabel="Loading more transactions" />
      ) : null}

      {rows.length > 0 ? (
        <Card style={{ padding: 16, paddingHorizontal: 18, gap: 10 }}>
          {filter === 'all'
            ? KINDS.map((kind) => (
                <View
                  key={kind}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <AppText variant="muted">{KIND_LABEL[kind]}</AppText>
                  <AppText variant="strong">{money(totals[kind])}</AppText>
                </View>
              ))
            : null}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              paddingTop: filter === 'all' ? 10 : 0,
              borderTopWidth: filter === 'all' ? 1 : 0,
              borderTopColor: theme.lineSoft,
            }}
          >
            <AppText variant="strong">
              Total sent{filter === 'all' ? '' : `: ${KIND_LABEL[filter]}`}
            </AppText>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 20,
                color: theme.brandText,
              }}
            >
              {money(totalSent)}
            </Text>
          </View>
          <AppText variant="small" style={{ fontSize: 12.5 }}>
            Amounts include transaction fees.
          </AppText>
        </Card>
      ) : null}

      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onResend={handleSendAgain}
      />
    </Screen>
  );
}
