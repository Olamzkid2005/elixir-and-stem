import { useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as Apple from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { useAuth } from '@/store/auth';

/**
 * Google + Apple sign-in hook.
 *
 * Expo Go limitations:
 * - Google: works via auth-session proxy
 * - Apple: works on iOS (requires native build on Android)
 *
 * For Google, you need:
 * 1. Create OAuth 2.0 credentials in Google Cloud Console
 * 2. Set webClientId (NOT androidClientId) for Expo Go
 * 3. Set the Web client ID as EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env
 */
export function useOAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithOAuth } = useAuth();

  // ── Google ──────────────────────────────────────────────────────────

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: Constants.expoConfig?.extra?.googleWebClientId || '',
  });

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await googlePromptAsync();
      if (result?.type === 'success') {
        const { id_token } = result.params;
        // Decode the ID token to get email/name (in production, send to backend for verification)
        const payload = JSON.parse(atob(id_token!.split('.')[1]));
        await signInWithOAuth('google', payload.email, payload.name ?? payload.given_name);
      } else if (result?.type === 'error') {
        setError('Google sign-in was cancelled or failed.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Apple ───────────────────────────────────────────────────────────

  const signInWithApple = async () => {
    setLoading(true);
    setError('');
    try {
      const credential = await Apple.signInAsync({
        requestedScopes: [Apple.AppleAuthenticationScope.FULL_NAME, Apple.AppleAuthenticationScope.EMAIL],
      });

      if (credential.identityToken) {
        // Decode identity token to get email
        const payload = JSON.parse(atob(credential.identityToken.split('.')[1]));
        const email = credential.email ?? payload.email;
        const name = credential.fullName?.givenName
          ? `${credential.fullName.givenName} ${credential.fullName.familyName ?? ''}`.trim()
          : undefined;

        await signInWithOAuth('apple', email!, name);
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled — don't show error
      } else {
        setError(e instanceof Error ? e.message : 'Apple sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    signInWithApple,
    loading,
    error,
    canUseGoogle: !!googleRequest,
    canUseApple: Platform.OS === 'ios',
  };
}
