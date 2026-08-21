import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/api/client';
import { useAuth } from '@/store/auth';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MerchantOnboarding'>;

/**
 * Merchant onboarding wizard: business details → license upload → payout info.
 * Submission always lands in "pending" — admin approval happens out of band.
 */
export function MerchantOnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseDoc, setLicenseDoc] = useState<string | null>(null);
  const [payoutName, setPayoutName] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuth((s) => s.signIn);

  const pickLicenseDoc = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) setLicenseDoc(result.assets[0].uri);
  };

  const canNext =
    step === 0
      ? businessName.trim().length > 1 && address.trim().length > 5
      : step === 1
        ? licenseNumber.trim().length > 3 && !!licenseDoc
        : payoutName.trim().length > 1;

  const submit = async () => {
    setLoading(true);
    try {
      // Upload license document to S3 if one was selected
      let licenseDocUrl: string | undefined;
      if (licenseDoc) {
        const fileName = licenseDoc.split('/').pop() ?? 'license-doc';
        const contentType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        licenseDocUrl = await api.uploadFile(licenseDoc, fileName, contentType, 'license-document');
      }

      await api.registerMerchant({
        businessName,
        address,
        licenseNumber,
        licenseDocUrl,
      });
      Alert.alert(
        'Application submitted',
        'Your dispensary is now pending review. An admin will verify your license before your shop goes live to customers.',
        [{ text: 'OK', onPress: () => navigation.navigate('SignIn') }]
      );
    } catch (e) {
      Alert.alert('Submission failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Business', 'License', 'Payout'];

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
        <Headline className="mt-6">Set Up Your Dispensary</Headline>
        <Text className="mt-1 font-body text-sm text-on-surface-variant">
          Step {step + 1} of {steps.length} — {steps[step]}
        </Text>

        {/* Progress */}
        <View className="mb-8 mt-4 flex-row gap-2">
          {steps.map((s, i) => (
            <View
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-surface-container-highest'}`}
            />
          ))}
        </View>

        {step === 0 && (
          <View className="gap-5">
            <Input
              label="Business Name"
              icon="storefront"
              placeholder="Elixir & Stem Downtown"
              value={businessName}
              onChangeText={setBusinessName}
            />
            <Input
              label="Business Address"
              icon="location_on"
              placeholder="Street, city, state, ZIP"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        )}

        {step === 1 && (
          <View className="gap-5">
            <Input
              label="State License Number"
              icon="verified"
              placeholder="e.g. CA-C10-0001234-LIC"
              autoCapitalize="characters"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
            />
            <Pressable
              onPress={pickLicenseDoc}
              className="items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest py-10"
            >
              <Icon name="upload_file" size={32} color="#4d644b" />
              <Text className="font-body-semibold text-sm text-on-surface">
                {licenseDoc ? 'Document attached' : 'Upload license document'}
              </Text>
              <Text className="font-body text-xs text-on-surface-variant">
                Camera or gallery — PDF/photo of your state license
              </Text>
            </Pressable>
            <Text className="font-body text-xs leading-5 text-on-surface-variant">
              Your application is reviewed manually by our compliance team. Merchant accounts are
              never auto-approved.
            </Text>
          </View>
        )}

        {step === 2 && (
          <View className="gap-5">
            <Input
              label="Payout Account Name"
              icon="person"
              placeholder="Legal business entity name"
              value={payoutName}
              onChangeText={setPayoutName}
            />
            <Text className="font-body text-xs leading-5 text-on-surface-variant">
              Payouts cover pay-on-delivery reconciliation. Bank details are collected securely
              after license approval.
            </Text>
          </View>
        )}

        <View className="mb-10 mt-8 flex-row gap-3">
          {step > 0 && (
            <Button label="Back" variant="outline" className="flex-1" onPress={() => setStep(step - 1)} />
          )}
          <Button
            label={step === steps.length - 1 ? 'Submit for Review' : 'Continue'}
            iconRight="arrow_forward"
            className="flex-1"
            disabled={!canNext}
            loading={loading}
            onPress={() => (step === steps.length - 1 ? submit() : setStep(step + 1))}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
