import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { mockMerchants } from '@/api/mock';
import type { Merchant } from '@/api/types';
import { cn } from '@/lib/utils';

/** Default map region — Lagos, Nigeria */
const LAGOS_REGION = {
  latitude: 6.5244,
  longitude: 3.3792,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

/**
 * Browse — "Find dispensaries near me" with real Google Maps + list view.
 */
export function BrowseScreen() {
  const [mode, setMode] = useState<'list' | 'map'>('list');
  const [merchants] = useState<Merchant[]>(mockMerchants);
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState(LAGOS_REGION);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  const locate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(pos);
        setMapRegion({ ...pos, latitudeDelta: 0.1, longitudeDelta: 0.1 });
      }
    } catch {
      // Keep default Lagos region
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
              <Icon name={m === 'list' ? 'list' : 'map'} size={18} color={mode === m ? '#061b0e' : '#737973'} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Real Google Map */}
      {mode === 'map' && (
        <View className="mx-4 mb-3 overflow-hidden rounded-2xl">
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ height: 260, width: '100%' }}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            showsUserLocation={!!userLocation}
            showsMyLocationButton={false}
          >
            {/* User location marker */}
            {userLocation && (
              <Marker coordinate={userLocation} title="You are here">
                <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow-md">
                  <Icon name="location_on" size={16} color="#ffffff" />
                </View>
              </Marker>
            )}

            {/* Merchant markers */}
            {merchants
              .filter((m) => m.lat && m.lng)
              .map((m) => (
                <Marker
                  key={m.id}
                  coordinate={{ latitude: m.lat, longitude: m.lng }}
                  onPress={() => setSelectedMerchant(m)}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary shadow-md">
                    <Icon name="storefront" size={16} color="#ffffff" />
                  </View>
                </Marker>
              ))}
          </MapView>

          {/* Merchant info card on marker tap */}
          {selectedMerchant && (
            <View className="absolute bottom-0 left-0 right-0 border-t border-outline-variant bg-surface p-4 shadow-lg">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="font-headline text-lg text-on-surface">
                    {selectedMerchant.businessName}
                  </Text>
                  <Text className="mt-0.5 font-body text-sm text-on-surface-variant">
                    {selectedMerchant.address}
                  </Text>
                  <View className="mt-2 flex-row items-center gap-3">
                    <View className="flex-row items-center gap-1">
                      <Icon name="star" size={14} color="#e9c176" />
                      <Text className="font-body-semibold text-xs text-on-surface">
                        {selectedMerchant.rating}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Icon name="schedule" size={14} color="#737973" />
                      <Text className="font-body text-xs text-on-surface-variant">
                        {selectedMerchant.deliveryEtaMins[0]}–{selectedMerchant.deliveryEtaMins[1]} min
                      </Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  onPress={() => setSelectedMerchant(null)}
                  hitSlop={8}
                  className="h-8 w-8 items-center justify-center rounded-full bg-surface-container"
                >
                  <Icon name="close" size={18} color="#737973" />
                </Pressable>
              </View>
              <Button label="View Menu" icon="storefront" size="sm" className="mt-3" onPress={() => setSelectedMerchant(null)} />
            </View>
          )}

          <View className="bg-surface-container p-2">
            <Text className="text-center font-body text-xs text-on-surface-variant">
              {merchants.length} dispensaries · Tap markers for details
            </Text>
          </View>
        </View>
      )}

      {/* Merchant list */}
      <View className="flex-1 px-4">
        {merchants.map((m) => (
          <View key={m.id} className="mb-3 rounded-2xl bg-surface-container-lowest p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="font-headline text-lg text-on-surface">{m.businessName}</Text>
                <Text className="mt-0.5 font-body text-sm text-on-surface-variant">{m.address}</Text>
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
                </View>
              </View>
              <Badge variant="secondary" label="Licensed" />
            </View>
          </View>
        ))}
      </View>

      <View className="px-4 pb-4">
        <Button label="Find dispensaries near me" icon="location_on" variant="secondary" loading={locating} onPress={locate} />
      </View>
    </Screen>
  );
}
