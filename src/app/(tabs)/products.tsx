import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { BrandLogo, type Brand } from '@/components/brand-logo';
import { Card, Icon, Screen, T } from '@/components/ui';
import { LEC_NAME, type OperatorId, type SendKind } from '@/data';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

export default function ProductsScreen() {
  const c = useTheme();
  const { startSend } = useStore();

  const product = (brand: Brand, title: string, detail: string, kind: SendKind, operator?: OperatorId) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        startSend(kind, operator);
        router.push('/send');
      }}>
      <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <BrandLogo brand={brand} size={52} />
        <View style={{ flex: 1, gap: 3 }}>
          <T v="display" style={{ fontSize: 15.5 }}>
            {title}
          </T>
          <T v="small" style={{ fontSize: 13.5 }}>
            {detail}
          </T>
        </View>
        <Icon name="right" size={18} color={c.muted} />
      </Card>
    </Pressable>
  );

  return (
    <Screen gap={22}>
      <View style={{ gap: 6 }}>
        <T v="title" accessibilityRole="header">
          Products
        </T>
        <T v="muted">Buy and send credit to family and friends in Liberia.</T>
      </View>
      <View style={{ gap: 12 }}>
        {product('lec', LEC_NAME, 'Buy and send LEC credit tokens', 'utility')}
        {product('mtn', 'Lonestar Cell MTN', 'Buy and send Lonestar mobile phone credit and packages', 'airtime', 'mtn')}
        {product('orange', 'Orange Liberia', 'Buy and send Orange mobile phone credit and packages', 'airtime', 'orange')}
        {product('stop-and-shop', 'Stop & Shop', 'Buy and send Stop & Shop shopping vouchers', 'voucher')}
      </View>
    </Screen>
  );
}
