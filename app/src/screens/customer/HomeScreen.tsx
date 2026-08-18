import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/ui/Screen';
import { Chip } from '@/components/ui/Chip';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { FeaturedCard, ProductRowCard } from '@/components/ProductCards';
import { Input } from '@/components/ui/Input';
import { mockProducts } from '@/api/mock';
import { CATEGORY_LIST, type Category } from '@/api/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Customer Home — search, category pills, Featured Cultivars, Curated Selection. */
export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);

  const filtered = useMemo(
    () =>
      mockProducts.filter(
        (p) =>
          (!category || p.category === category) &&
          (!query || p.name.toLowerCase().includes(query.toLowerCase()))
      ),
    [category, query]
  );

  const featured = filtered.filter((p) => p.category === 'Flower').slice(0, 4);
  const curated = filtered.slice(0, 6);

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View className="px-4 pt-2">
          <Input
            icon="search"
            placeholder="Search strains, brands, effects…"
            value={query}
            onChangeText={setQuery}
            className="gap-0"
          />
        </View>

        {/* Categories */}
        <FlatList
          horizontal
          data={CATEGORY_LIST}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}
          renderItem={({ item }) => (
            <Chip
              label={item}
              selected={category === item}
              onPress={() => setCategory(category === item ? null : item)}
            />
          )}
        />

        {/* Featured Cultivars */}
        {featured.length > 0 && (
          <>
            <SectionTitle title="Featured Cultivars" />
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <FeaturedCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { product: item })}
                />
              )}
            />
          </>
        )}

        {/* Curated Selection */}
        <SectionTitle title="Curated Selection" action="View All" />
        <View className="px-4 pb-8">
          {curated.map((p) => (
            <ProductRowCard
              key={p.id}
              product={p}
              onPress={() => navigation.navigate('ProductDetail', { product: p })}
            />
          ))}
          {curated.length === 0 && (
            <Text className="mt-4 text-center font-body text-sm text-on-surface-variant">
              Nothing matches your filters yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
