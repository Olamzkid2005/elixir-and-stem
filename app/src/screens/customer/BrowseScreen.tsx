import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { mockMerchants } from '@/api/mock';
import type { Merchant } from '@/api/types';
import { cn } from '@/lib/utils';

/**
 * Browse — "Find dispensaries near me" with map/list toggle.
 * Map tiles require react-native-maps native build; in Expo Go we render a
 * styled placeholder canvas with dispensary pins.
 */
export function BrowseScreen() {
  const [mode, setMode] = useState<'list' | 'map'>('list');
  const [zip, setZip] = useState('');
  const [merchants] = useState<Merchant[]>(mockMerchants);
  const [locating, setLocating] = useState(false);
  const [locationMsg, setLocationMsg] = useState('');

  const locate = async () => {
    setLocating(true);
    setLocationMsg('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationMsg('Location permission denied — enter a ZIP instead.');
        return;
      }
      await Location.getCurrentPositionAsync({});
      setLocationMsg('Showing dispensaries near you.');
    } catch {
      setLocationMsg('Could not fetch location — enter a ZIP instead.');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    locate();
  }, []);

  return (
    <Screen>
      <AppHeader />
      <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
        <Headline size="md">Nearby Dispensaries</Headline>
        <View className="flex-row rounded-full bg-surface-container p-1">
          {(['list', 'map'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className={cn(
                'h-9 w-9 items-center justify-center rounded-full',
                mode === m && 'bg-surface-container-lowest'
              )}
            >
              <Icon
                name={m === 'list' ? 'list' : 'map'}
                size={18}
                color={mode === m ? '#061b0e' : '#737973'}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {mode === 'map' ? (
        <View className="mx-4 mb-3 h-64 overflow-hidden rounded-2xl bg-surface-container">
          {/* Nigeria map placeholder — shows merchant locations in major cities */}
          <View className="flex-1 items-center justify-center bg-primary/10">
            {/* Simplified Nigeria outline */}
            <View style={{ height: 192, width: '100%', position: 'relative' }}>
              {/* City dots */}
              {[
                { name: 'Lagos', x: 0.25, y: 0.7 },
                { name: 'Abuja', x: 0.5, y: 0.4 },
                { name: 'Kano', x: 0.55, y: 0.15 },
                { name: 'Port Harcourt', x: 0.7, y: 0.65 },
                { name: 'Ibadan', x: 0.3, y: 0.6 },
              ].map((city) => {
                const screenWidth = Dimensions.get('window').width - 64; // mx-4 * 2
                return (
                  <View
                    key={city.name}
                    style={{ left: screenWidth * city.x, top: 192 * city.y, position: 'absolute' }}
                    className="items-center"
                  >
                    <View className="h-3 w-3 rounded-full bg-primary" />
                    <Text className="mt-0.5 font-body text-[10px] text-on-surface-variant">
                      {city.name}
                    </Text>
                  </View>
                );
              })}

              {/* Merchant pins */}
              {merchants.map((m, i) => {
                const screenWidth = Dimensions.get('window').width - 64;
                return (
                  <View
                    key={m.id}
                    style={{
                      left: screenWidth * (0.25 + i * 0.15),
                      top: 192 * (0.5 + (i % 2) * 0.2),
                      position: 'absolute',
                    }}
                    className="h-8 w-8 items-center justify-center rounded-full bg-primary shadow-md"
                  >
                    <Icon name="storefront" size={14} color="#ffffff" />
                  </View>
                );
              })}
            </View>
          </View>
          <View className="bg-surface-container p-2">
            <Text className="text-center font-body text-xs text-on-surface-variant">
              {merchants.length} dispensaries in Nigeria • Full map available in dev build
            </Text>
          </View>
        </View>
      ) : null}

      <View className="px-4 pb-2">
        <Input
          icon="location_on"
          placeholder="Enter ZIP code"
          keyboardType="number-pad"
          value={zip}
          onChangeText={setZip}
          className="gap-0"
        />
        {locationMsg ? (
          <Text className="mt-1 px-1 font-body text-xs text-on-surface-variant">{locationMsg}</Text>
        ) : null}
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {merchants.map((m) => (
          <View key={m.id} className="mb-3 rounded-2xl bg-surface-container-lowest p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="font-headline text-lg text-on-surface">{m.businessName}</Text>
                <Text className="mt-0.5 font-body text-sm text-on-surface-variant">
                  {m.address}
                </Text>
                <View className="mt-2 flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <Icon name="star" size={14} color="#e9c176" />
                    <Text className="font-body-semibold text-xs text-on-surface">{m.rating}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Icon name="schedule" size={14} color="#737973" />
                    <Text className="font-body text-xs text-on-surface-variant">
                      {m.deliveryEtaMins[0]}–{m.deliveryEtaMins[1]} min
                    </Text>
                  </View>
                  <Text className="font-body text-xs text-on-surface-variant">
                    {m.distanceMiles} mi
                  </Text>
                </View>
              </View>
              <Badge
                variant={m.status === 'approved' ? 'secondary' : 'gold'}
                label={m.status === 'approved' ? 'Licensed' : 'Pending'}
              />
            </View>
          </View>
        ))}
        <Button
          label="Find dispensaries near me"
          icon="location_on"
          variant="secondary"
          loading={locating}
          onPress={locate}
          className="mb-8 mt-2"
        />
      </ScrollView>
    </Screen>
  );
}
