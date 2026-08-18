import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { mockProducts } from '@/api/mock';
import { CATEGORY_LIST, type Category, type StrainType } from '@/api/types';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductForm'>;

/** Add/Edit product — category, strain type, potency, price tiers, stock, photo. */
export function ProductFormScreen({ route, navigation }: Props) {
  const existing = route.params?.productId
    ? mockProducts.find((p) => p.id === route.params.productId)
    : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [brand, setBrand] = useState(existing?.brand ?? '');
  const [category, setCategory] = useState<Category>(existing?.category ?? 'Flower');
  const [strain, setStrain] = useState<StrainType | null>(existing?.strainType ?? 'hybrid');
  const [thc, setThc] = useState(existing?.thcPct?.toString() ?? '');
  const [cbd, setCbd] = useState(existing?.cbdPct?.toString() ?? '');
  const [price, setPrice] = useState(
    existing ? (existing.weightOptions[0].price / 100).toString() : ''
  );
  const [stock, setStock] = useState(existing?.stock.toString() ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [error, setError] = useState('');

  const save = () => {
    if (!name.trim()) return setError('Product name is required.');
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) return setError('Enter a valid price.');
    const stockNum = Number(stock);
    if (!stock || Number.isNaN(stockNum) || stockNum < 0) return setError('Enter a valid stock count.');
    setError('');
    // Persist via POST/PATCH /products when the backend is configured.
    Alert.alert('Saved', `${name} ${existing ? 'updated' : 'added to your menu'}.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <Screen>
      <AppHeader back />
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Headline>{existing ? 'Edit Product' : 'New Product'}</Headline>

        <View className="mt-5 gap-5 pb-10">
          <Pressable className="items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest py-8">
            <Icon name="upload_file" size={28} color="#4d644b" />
            <Text className="font-body-semibold text-sm text-on-surface">Product photo</Text>
          </Pressable>

          <Input label="Name" placeholder="Blue Dream" value={name} onChangeText={setName} />
          <Input label="Brand" placeholder="Elixir Reserve" value={brand} onChangeText={setBrand} />

          <View className="gap-2">
            <Text className="font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORY_LIST.map((c) => (
                <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
              ))}
            </View>
          </View>

          {category === 'Flower' && (
            <View className="gap-2">
              <Text className="font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
                Strain Type
              </Text>
              <View className="flex-row gap-2">
                {(['sativa', 'indica', 'hybrid'] as StrainType[]).map((s) => (
                  <Chip
                    key={s}
                    label={s.charAt(0).toUpperCase() + s.slice(1)}
                    selected={strain === s}
                    onPress={() => setStrain(s)}
                  />
                ))}
              </View>
            </View>
          )}

          <View className="flex-row gap-3">
            <Input
              label="THC %"
              keyboardType="decimal-pad"
              placeholder="22"
              value={thc}
              onChangeText={setThc}
              className="flex-1"
            />
            <Input
              label="CBD %"
              keyboardType="decimal-pad"
              placeholder="1.2"
              value={cbd}
              onChangeText={setCbd}
              className="flex-1"
            />
          </View>

          <View className="flex-row gap-3">
            <Input
              label="Base Price ($)"
              keyboardType="decimal-pad"
              placeholder="45.00"
              value={price}
              onChangeText={setPrice}
              className="flex-1"
            />
            <Input
              label="Stock"
              keyboardType="number-pad"
              placeholder="30"
              value={stock}
              onChangeText={setStock}
              className="flex-1"
            />
          </View>
          <Text className="-mt-3 font-body text-xs text-on-surface-variant">
            Additional weight tiers (7g, 14g…) can be configured after creation.
          </Text>

          <Input
            label="Description"
            placeholder="Aroma, flavor notes, best time of day…"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            error={error}
          />

          <Button label={existing ? 'Save Changes' : 'Add to Menu'} size="lg" onPress={save} />
        </View>
      </ScrollView>
    </Screen>
  );
}
