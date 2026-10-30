import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { Button, Card, Icon, Screen, Segment, T, Tile } from '@/components/ui';
import { money, type SendKind } from '@/data';
import { brandOf, useStore, type Transaction } from '@/store';
import { fonts, useTheme } from '@/theme';

const FILTERS: { id: 'all' | SendKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'airtime', label: 'Airtime' },
  { id: 'utility', label: 'Utility' },
  { id: 'voucher', label: 'Shopping voucher' },
];

const KIND_LABEL: Record<SendKind, string> = { airtime: 'Airtime', utility: 'Utility', voucher: 'Shopping voucher' };
const KINDS = Object.keys(KIND_LABEL) as SendKind[];

const sum = (list: Transaction[]) => list.reduce((total, t) => total + t.total, 0);

export default function TransactionsScreen() {
  const c = useTheme();
  const { transactions, resend } = useStore();
  const [filter, setFilter] = useState<'all' | SendKind>('all');
  const rows = transactions.filter((t) => filter === 'all' || t.kind === filter);

  const sendAgain = (t: Transaction) => {
    resend(t);
    router.push('/send/payment');
  };

  return (
    <Screen gap={18}>
      <T v="title" accessibilityRole="header">
        Transactions
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FILTERS.map((f) => (
          <Segment key={f.id} shape="chip" label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </View>

      {rows.length === 0 ? (
        <View style={{ alignItems: 'center', gap: 14, paddingTop: 72, paddingHorizontal: 24 }}>
          <Tile icon="list" size={72} />
          <T v="heading" style={{ fontSize: 18 }}>
            No transactions found.
          </T>
          <T v="muted" style={{ textAlign: 'center' }}>
            Credit you send will be listed here.
          </T>
          <Button label="Send credit" onPress={() => router.navigate('/products')} style={{ height: 50, marginTop: 6 }} />
        </View>
      ) : (
        <Card>
          {rows.map((t, i) => (
            <View
              key={t.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                paddingHorizontal: 16,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: c.lineSoft,
              }}>
              <BrandLogo brand={brandOf(t.draft)} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="strong" style={{ fontSize: 14.5 }}>
                  {t.product}
                </T>
                <T v="small" style={{ fontSize: 12.5 }}>
                  {t.provider}
                </T>
                <T v="small" style={{ fontSize: 12.5 }}>
                  {t.receiver}, {t.date}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <T style={{ fontFamily: fonts.display, fontSize: 15 }}>{money(t.total)}</T>
                <Pressable
                  onPress={() => sendAgain(t)}
                  accessibilityRole="button"
                  accessibilityLabel={`Resend ${t.product} to ${t.receiver}`}
                  hitSlop={6}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: c.brandTint,
                  }}>
                  <Icon name="resend" size={13} color={c.brandText} />
                  <Text style={{ color: c.brandText, fontSize: 13, fontWeight: '600' }}>Resend</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </Card>
      )}

      {rows.length > 0 ? (
        <Card style={{ padding: 16, paddingHorizontal: 18, gap: 10 }}>
          {filter === 'all'
            ? KINDS.map((k) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T v="muted">{KIND_LABEL[k]}</T>
                  <T v="strong">{money(sum(transactions.filter((t) => t.kind === k)))}</T>
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
              borderTopColor: c.lineSoft,
            }}>
            <T v="strong">Total sent{filter === 'all' ? '' : `: ${KIND_LABEL[filter]}`}</T>
            <Text style={{ fontFamily: fonts.display, fontSize: 20, color: c.brandText }}>{money(sum(rows))}</Text>
          </View>
          <T v="small" style={{ fontSize: 12.5 }}>
            Amounts include transaction fees.
          </T>
        </Card>
      ) : null}
    </Screen>
  );
}
