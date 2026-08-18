import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';

const week = [
  { day: 'Mon', orders: 8 },
  { day: 'Tue', orders: 11 },
  { day: 'Wed', orders: 7 },
  { day: 'Thu', orders: 14 },
  { day: 'Fri', orders: 19 },
  { day: 'Sat', orders: 24 },
  { day: 'Sun', orders: 16 },
];

const topProducts = [
  { name: 'Wedding Cake', sold: 42 },
  { name: 'Blue Dream', sold: 35 },
  { name: 'Lush Orchard', sold: 28 },
  { name: 'Clarity Drops', sold: 19 },
];

/** Basic sales analytics — orders per day/week + top products. */
export function AnalyticsScreen() {
  const max = Math.max(...week.map((d) => d.orders));
  const topMax = Math.max(...topProducts.map((p) => p.sold));

  return (
    <Screen>
      <AppHeader />
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Headline className="mt-2">Sales</Headline>

        <SectionTitle title="Orders This Week" className="px-0" />
        <View className="rounded-2xl bg-surface-container-lowest p-4">
          <View className="h-40 flex-row items-end justify-between gap-2">
            {week.map((d) => (
              <View key={d.day} className="flex-1 items-center gap-1">
                <Text className="font-body-semibold text-[10px] text-on-surface-variant">
                  {d.orders}
                </Text>
                <View
                  className="w-full rounded-t-xl bg-secondary"
                  style={{ height: `${(d.orders / max) * 100}%` }}
                />
                <Text className="font-body text-[10px] text-on-surface-variant">{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionTitle title="Top Products" className="px-0" />
        <View className="mb-10 gap-3 rounded-2xl bg-surface-container-lowest p-4">
          {topProducts.map((p, i) => (
            <View key={p.name}>
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="font-body-semibold text-sm text-on-surface">
                  {i + 1}. {p.name}
                </Text>
                <Text className="font-body text-xs text-on-surface-variant">{p.sold} sold</Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-surface-container">
                <View
                  className="h-full rounded-full bg-tertiary-fixed-dim"
                  style={{ width: `${(p.sold / topMax) * 100}%` }}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
