import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';
import { cn } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

/** Sign In / Create Account with tab toggle — matches design reference. */
export function SignInScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, role } = useAuth();

  const validate = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    return '';
  };

  const submit = async () => {
    const v = validate();
    if (v) return setError(v);
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      if (mode === 'signup' && role === 'merchant') {
        navigation.navigate('MerchantOnboarding');
      }
      // Customer flow: RootNavigator swaps to tabs automatically once user is set.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="h-14 flex-row items-center px-2">
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              className="h-11 w-11 items-center justify-center"
            >
              <Icon name="arrow_back" size={24} color="#1b1c19" />
            </Pressable>
          </View>

          <View className="px-6 pt-4">
            <Text className="mb-8 text-center font-headline-bold text-sm uppercase tracking-[0.2em] text-primary">
              Elixir &amp; Stem
            </Text>

            {/* Tab toggle */}
            <View className="mb-8 flex-row rounded-full bg-surface-container p-1">
              {(['signin', 'signup'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  className={cn(
                    'flex-1 items-center rounded-full py-2.5',
                    mode === m && 'bg-surface-container-lowest'
                  )}
                >
                  <Text
                    className={cn(
                      'font-body-semibold text-sm',
                      mode === m ? 'text-on-surface' : 'text-on-surface-variant'
                    )}
                  >
                    {m === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Headline className="mb-1">
              {mode === 'signin' ? 'Welcome Back' : 'Join the Garden'}
            </Headline>
            <Text className="mb-8 font-body text-base text-on-surface-variant">
              {mode === 'signin'
                ? 'Enter your details to access your wellness journey.'
                : role === 'merchant'
                  ? 'Create your merchant account to start the license review.'
                  : 'Create your account to start your wellness journey.'}
            </Text>

            <Input
              label="Email Address"
              icon="mail"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              className="mb-5"
            />
            <Input
              label="Password"
              icon="lock"
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              error={error}
              rightSlot={
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Icon name="visibility_off" size={20} color="#737973" />
                </Pressable>
              }
            />
            {mode === 'signin' && (
              <Pressable className="mt-2 self-end">
                <Text className="font-body-semibold text-sm text-secondary">Forgot Password?</Text>
              </Pressable>
            )}

            <Button
              label={mode === 'signin' ? 'Sign In' : 'Create Account'}
              iconRight="arrow_forward"
              size="lg"
              className="mt-8 w-full"
              loading={loading}
              onPress={submit}
            />

            {/* Divider + social logins */}
            <View className="my-8 flex-row items-center gap-4">
              <View className="h-px flex-1 bg-outline-variant" />
              <Text className="font-body text-xs uppercase tracking-widest text-on-surface-variant">
                Or continue with
              </Text>
              <View className="h-px flex-1 bg-outline-variant" />
            </View>
            <View className="flex-row gap-3">
              <Button label="Google" variant="outline" className="flex-1" onPress={() => {}} />
              <Button label="Apple" variant="outline" className="flex-1" onPress={() => {}} />
            </View>

            <Text className="mb-8 mt-10 text-center font-body text-xs leading-5 text-on-surface-variant">
              By signing in, you confirm you are 21 years of age or older. Access to Elixir &amp;
              Stem constitutes acceptance of our{' '}
              <Text className="font-body-semibold text-secondary">Terms of Service</Text> and{' '}
              <Text className="font-body-semibold text-secondary">Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
