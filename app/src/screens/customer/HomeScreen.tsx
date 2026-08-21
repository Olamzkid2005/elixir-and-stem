import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/ui/Screen';
import { Chip } from '@/components/ui/Chip';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { FeaturedCard, ProductRowCard } from '@/components/ProductCards';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/ProductImage';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/api/client';
import { mockProducts } from '@/api/mock';
import { formatPrice, CATEGORY_LIST, type Category, type Product } from '@/api/types';
import { useFavorites } from '@/store/favorites';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Customer Home — debounced search, category pills, Favorites shelf, Featured Cultivars, Curated Selection. */
export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searching, setSearching] = useState(false);
  const { favorites, initialized, refresh: refreshFavorites } = useFavorites();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    refreshFavorites();
  }, []);

  // Debounced search — hits API when backend is available, falls back to mock filtering
  const doSearch = useCallback(async (q: string, cat: Category | null) => {
    setSearching(true);
    try {
      const results = await api.searchProducts(q, cat ?? undefined);
      setProducts(results);
    } catch {
      // Fallback to local mock filtering
      const filtered = mockProducts.filter(
        (p) =>
          (!cat || p.category === cat) &&
          (!q ||
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.brand.toLowerCase().includes(q.toLowerCase()) ||
            p.description.toLowerCase().includes(q.toLowerCase()))
      );
      setProducts(filtered);
    } finally {
      setSearching(false);
    }
  }, [query, category]);

  // Debounce search on query/category change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query, category);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category, doSearch]);

  const featured = products.filter((p) => p.category === 'Flower').slice(0, 4);
  const curated = products.slice(0, 6);

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

        {/* Search results indicator */}
        {(query || category) && (
          <View className="flex-row items-center justify-between px-4 pb-2">
            <Text className="font-body text-sm text-on-surface-variant">
              {searching ? 'Searching…' : `${products.length} result${products.length === 1 ? '' : 's'}`}
              {query ? ` for "${query}"` : ''}
              {category ? ` in ${category}` : ''}
            </Text>
            <Pressable
              onPress={() => { setQuery(''); setCategory(null); }}
              hitSlop={8}
            >
              <Text className="font-body-semibold text-sm text-secondary">Clear</Text>
            </Pressable>
          </View>
        )}

        {/* Favorites shelf — only shown if customer has ≥1 favorite */}
        {!query && !category && initialized && favorites.length > 0 && (
          <>
            <SectionTitle
              title="Your Favorites"
              action="View All"
              onAction={() => navigation.navigate('Favorites')}
            />
            <FlatList
              horizontal
              data={favorites}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => navigation.navigate('ProductDetail', { product: item })}
                  className="mr-3 w-36 overflow-hidden rounded-2xl bg-surface-container-lowest"
                >
                  <ProductImage color={item.imageColor} className="h-28 w-full" iconSize={32} />
                  <View className="p-2.5">
                    <Text className="font-headline text-sm text-on-surface" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="font-body text-xs text-on-surface-variant" numberOfLines={1}>
                      {item.brand}
                    </Text>
                    <View className="mt-1 flex-row items-center justify-between">
                      <Text className="font-body-semibold text-xs text-primary">
                        {formatPrice(item.weightOptions[0]?.price ?? 0)}
                      </Text>
                      <View className="flex-row items-center gap-0.5">
                        <Icon name="star" size={10} color="#e9c176" />
                        <Text className="font-body text-[10px] text-on-surface-variant">
                          {item.rating}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </>
        )}

        {/* Featured Cultivars — hidden during search */}
        {!query && !category && featured.length > 0 && (
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

        {/* Curated Selection / Search Results */}
        <SectionTitle title={query || category ? 'Results' : 'Curated Selection'} action={!query && !category ? 'View All' : undefined} />
        <View className="px-4 pb-8">
          {curated.map((p) => (
            <ProductRowCard
              key={p.id}
              product={p}
              onPress={() => navigation.navigate('ProductDetail', { product: p })}
            />
          ))}
          {curated.length === 0 && !searching && (
            <View className="items-center py-12">
              <Icon name="search" size={40} color="#c3c8c1" />
              <Text className="mt-3 font-body text-sm text-on-surface-variant">
                No products match your search
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
