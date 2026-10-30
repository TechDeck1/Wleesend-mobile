import { View } from 'react-native';

import { Card, NavBar, Screen, T, Tile, type IconName } from '@/components/ui';

const REASONS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'timer',
    title: "It's fast",
    text: 'Send mobile or LEC credit instantly with token delivered by SMS/Text to the receiver.',
  },
  {
    icon: 'thumb',
    title: "It's easy",
    text: 'Easily set up your account and start sending mobile/LEC credit to your family and friends.',
  },
  {
    icon: 'shield',
    title: "It's reliable",
    text: 'Maintaining your trust is our priority. We ensure that your credit purchase is delivered on time and safely.',
  },
];

export default function AboutScreen() {
  return (
    <Screen header={<NavBar title="About" />}>
      <T v="title" accessibilityRole="header">
        About Wleesend
      </T>
      <T>
        Wleesend is a Liberian owned and operated company established in 2025. The company is a subsidiary of Wleepay
        Financial Services incorporated in Liberia.
      </T>
      <T>
        Liberians receive cash remittances daily to purchase goods and services. But they have to first retrieve the
        remitted cash from an agent, and then use the cash to purchase a mobile top up (scratch) card or LEC credit
        from another agent.
      </T>
      <T>
        Wleesend solves this problem by allowing those in the diaspora to instantly send both Mobile and LEC credits
        to their family and friends back home. They immediately receive an SMS/Text message with the Mobile or LEC
        Token to top up their phone or electricity meter.
      </T>
      <Card style={{ padding: 18, paddingVertical: 20, gap: 18 }}>
        <T v="heading" style={{ fontSize: 18 }} accessibilityRole="header">
          Why Wleesend
        </T>
        {REASONS.map((r) => (
          <View key={r.title} style={{ flexDirection: 'row', gap: 14 }}>
            <Tile icon={r.icon} tone="soft" size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="display" style={{ fontSize: 15.5 }}>
                {r.title}
              </T>
              <T v="small" style={{ fontSize: 14, lineHeight: 20 }}>
                {r.text}
              </T>
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
