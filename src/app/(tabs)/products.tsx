import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { Card, Icon, Screen, AppText } from '@/components/UiComponents';
import { LEC_NAME, type OperatorId, type SendKind } from '@/data';
import { useStore } from '@/store';
import { useTheme } from '@/theme';
import type { Brand } from '@/types/components/BrandLogo.types';

export default function ProductsScreen() {
  const theme = useTheme();
  const { startSend } = useStore();

  const renderProductCard = (brand: Brand, title: string, detail: string, kind: SendKind, operator?: OperatorId) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        startSend(kind, operator);
        router.push('/send');
      }}>
      <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <BrandLogo brand={brand} size={52} />
        <View style={{ flex: 1, gap: 3 }}>
          <AppText variant="display" style={{ fontSize: 15.5 }}>
            {title}
          </AppText>
          <AppText variant="small" style={{ fontSize: 13.5 }}>
            {detail}
          </AppText>
        </View>
        <Icon name="right" size={18} color={theme.muted} />
      </Card>
    </Pressable>
  );

  return (
    <Screen gap={22}>
      <View style={{ gap: 6 }}>
        <AppText variant="title" accessibilityRole="header">
          Products
        </AppText>
        <AppText variant="muted">Buy and send credit to family and friends in Liberia.</AppText>
      </View>
      <View style={{ gap: 12 }}>
        {renderProductCard('lec', LEC_NAME, 'Buy and send LEC credit tokens', 'utility')}
        {renderProductCard('mtn', 'Lonestar Cell MTN', 'Buy and send Lonestar mobile phone credit and packages', 'airtime', 'mtn')}
        {renderProductCard('orange', 'Orange Liberia', 'Buy and send Orange mobile phone credit and packages', 'airtime', 'orange')}
        {renderProductCard('voucher', 'Stop & Shop', 'Buy and send Stop & Shop shopping vouchers', 'voucher')}
      </View>
    </Screen>
  );
}
