import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { mockProducts } from '@/api/mock';

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

// Mock review summary for the merchant
const reviewSummary = {
  averageRating: 4.8,
  totalReviews: 342,
  distribution: [
    { stars: 5, count: 220 },
    { stars: 4, count: 85 },
    { stars: 3, count: 28 },
    { stars: 2, count: 6 },
    { stars: 1, count: 3 },
  ],
};

/** Sales analytics — orders per day/week, top products, review aggregates. */
export function AnalyticsScreen() {
  const max = Math.max(...week.map((d) => d.orders));
  const topMax = Math.max(...topProducts.map((p) => p.sold));
  const reviewMax = Math.max(...reviewSummary.distribution.map((d) => d.count));

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
        <View className="mb-4 gap-3 rounded-2xl bg-surface-container-lowest p-4">
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

        {/* Reviews summary */}
        <SectionTitle title="Customer Reviews" className="px-0" />
        <View className="rounded-2xl bg-surface-container-lowest p-4">
          {/* Overall rating */}
          <View className="flex-row items-center gap-4">
            <View className="items-center">
              <Text className="font-headline text-4xl text-primary">
                {reviewSummary.averageRating}
              </Text>
              <View className="mt-1 flex-row items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name={star <= Math.round(reviewSummary.averageRating) ? 'star' : 'star_border'}
                    size={14}
                    color="#e9c176"
                  />
                ))}
              </View>
              <Text className="mt-1 font-body text-xs text-on-surface-variant">
                {reviewSummary.totalReviews} reviews
              </Text>
            </View>

            {/* Distribution bars */}
            <View className="flex-1 gap-1.5">
              {reviewSummary.distribution.map((d) => (
                <View key={d.stars} className="flex-row items-center gap-2">
                  <Text className="w-3 font-body text-[10px] text-on-surface-variant">
                    {d.stars}
                  </Text>
                  <Icon name="star" size={10} color="#e9c176" />
                  <View className="flex-1 h-2 overflow-hidden rounded-full bg-surface-container">
                    <View
                      className="h-full rounded-full bg-tertiary-fixed-dim"
                      style={{ width: `${(d.count / reviewMax) * 100}%` }}
                    />
                  </View>
                  <Text className="w-6 font-body text-[10px] text-on-surface-variant text-right">
                    {d.count}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Product ratings breakdown */}
          <View className="mt-4 border-t border-outline-variant pt-4">
            <Text className="mb-3 font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
              Product Ratings
            </Text>
            {mockProducts.slice(0, 4).map((p) => (
              <View key={p.id} className="mb-2 flex-row items-center justify-between">
                <Text className="flex-1 font-body text-sm text-on-surface" numberOfLines={1}>
                  {p.name}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Icon name="star" size={12} color="#e9c176" />
                  <Text className="font-body-semibold text-xs text-on-surface">
                    {p.rating}
                  </Text>
                  <Text className="font-body text-[10px] text-on-surface-variant">
                    ({p.reviews})
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mb-10" />
      </ScrollView>
    </Screen>
  );
}
