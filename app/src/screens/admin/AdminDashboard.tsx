import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, Linking } from 'react-native';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader, SectionTitle } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/api/client';

interface PendingMerchant {
  id: string;
  businessName: string;
  licenseNumber: string;
  licenseDocUrl?: string | null;
  address: string;
  status: string;
  user?: { email: string; createdAt: string };
}

/**
 * Admin dashboard — shows pending merchant applications for review.
 * Admin can approve or reject merchants after verifying their license.
 */
export function AdminDashboard() {
  const [merchants, setMerchants] = useState<PendingMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadMerchants = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetPendingMerchants();
      setMerchants(data);
    } catch (e) {
      console.error('Failed to load merchants:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  const handleApprove = async (merchantId: string) => {
    setActionLoading(merchantId);
    try {
      await api.adminUpdateMerchantStatus(merchantId, 'approved');
      Alert.alert('Approved', 'Merchant is now live and visible to customers.');
      loadMerchants();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to approve merchant.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (merchantId: string) => {
    Alert.alert('Reject Merchant', 'This will prevent the merchant from going live. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(merchantId);
          try {
            await api.adminUpdateMerchantStatus(merchantId, 'rejected');
            Alert.alert('Rejected', 'Merchant application has been rejected.');
            loadMerchants();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to reject merchant.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <AppHeader back />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Headline className="mt-2 px-4">Admin Dashboard</Headline>

        <SectionTitle
          title="Pending Applications"
          action={merchants.length > 0 ? `${merchants.length} pending` : undefined}
        />

        {loading ? (
          <View className="items-center py-10">
            <Icon name="pending" size={32} color="#737973" />
            <Text className="mt-2 font-body text-sm text-on-surface-variant">Loading...</Text>
          </View>
        ) : merchants.length === 0 ? (
          <View className="items-center rounded-2xl bg-surface-container-lowest mx-4 py-10">
            <Icon name="check_circle" size={48} color="#4d644b" />
            <Text className="mt-3 font-headline text-base text-on-surface">All caught up!</Text>
            <Text className="mt-1 font-body text-sm text-on-surface-variant">
              No pending merchant applications
            </Text>
          </View>
        ) : (
          <View className="mx-4 gap-4">
            {merchants.map((m) => (
              <View key={m.id} className="rounded-2xl bg-surface-container-lowest p-4">
                {/* Merchant info */}
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="font-headline text-lg text-on-surface">{m.businessName}</Text>
                    <Text className="mt-1 font-body text-sm text-on-surface-variant">{m.address}</Text>
                    {m.user && (
                      <Text className="mt-0.5 font-body text-xs text-on-surface-variant">
                        {m.user.email}
                      </Text>
                    )}
                  </View>
                  <Badge variant="secondary" label="Pending" />
                </View>

                {/* License info */}
                <View className="mt-4 rounded-xl bg-surface-container p-3">
                  <View className="flex-row items-center gap-2">
                    <Icon name="verified" size={18} color="#4d644b" />
                    <Text className="font-body-semibold text-sm text-on-surface">
                      License: {m.licenseNumber}
                    </Text>
                  </View>

                  {m.licenseDocUrl ? (
                    <Pressable
                      onPress={() => Linking.openURL(m.licenseDocUrl!)}
                      className="mt-2 flex-row items-center gap-2"
                    >
                      <Icon name="description" size={16} color="#061b0e" />
                      <Text className="font-body text-sm text-primary underline">
                        View License Document
                      </Text>
                    </Pressable>
                  ) : (
                    <Text className="mt-2 font-body text-xs text-on-surface-variant">
                      No document uploaded
                    </Text>
                  )}
                </View>

                {/* Action buttons */}
                <View className="mt-4 flex-row gap-3">
                  <Button
                    label="Approve"
                    icon="check_circle"
                    className="flex-1"
                    loading={actionLoading === m.id}
                    onPress={() => handleApprove(m.id)}
                  />
                  <Button
                    label="Reject"
                    icon="close"
                    variant="outline"
                    className="flex-1"
                    loading={actionLoading === m.id}
                    onPress={() => handleReject(m.id)}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="mb-10" />
      </ScrollView>
    </Screen>
  );
}
