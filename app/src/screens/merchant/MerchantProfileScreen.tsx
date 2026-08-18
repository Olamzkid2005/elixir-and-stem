import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';

/** Merchant profile — shop details, license status, sign out. */
export function MerchantProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <Screen>
      <AppHeader />
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Headline className="mt-2">Shop Profile</Headline>

        <View className="mt-4 rounded-2xl bg-surface-container-lowest p-5">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Icon name="storefront" size={28} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="font-headline text-xl text-on-surface">
                {user?.name ?? 'Your Dispensary'}
              </Text>
              <Text className="font-body text-sm text-on-surface-variant">{user?.email}</Text>
            </View>
            <Badge variant="gold" label="Pending" />
          </View>
        </View>

        <SectionTitle title="Compliance" className="px-0" />
        <View className="gap-3 rounded-2xl bg-surface-container-lowest p-4">
          <Row label="License number" value="CA-C10-0001234-LIC" />
          <Row label="License document" value="Attached" />
          <Row label="Admin review" value="Pending — manual approval required" />
          <Row label="State rules" value="California defaults applied" />
        </View>

        <View className="mb-10 mt-6 gap-3">
          <Button label="Contact Support" icon="support_agent" variant="outline" onPress={() => {}} />
          <Button label="Sign Out" icon="logout" variant="ghost" onPress={signOut} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="font-body text-sm text-on-surface-variant">{label}</Text>
      <Text className="max-w-[60%] text-right font-body-semibold text-sm text-on-surface">
        {value}
      </Text>
    </View>
  );
}
