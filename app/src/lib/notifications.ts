import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api, useMock } from '@/api/client';

/**
 * Detect if we're running in Expo Go (remote push not supported since SDK 53).
 */
function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

/**
 * Lazy-load expo-notifications only when not in Expo Go.
 * This avoids the "Android Push notifications removed from Expo Go" error.
 */
let Notifications: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (Notifications) return Notifications;
  if (isExpoGo()) return null;
  try {
    const notifs = require('expo-notifications');
    Notifications = notifs;
    // Configure how notifications appear when the app is in the foreground.
    notifs.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return notifs;
  } catch {
    return null;
  }
}

/**
 * Request push notification permissions and return the Expo push token.
 * Returns null if:
 * - Running in mock mode
 * - Running in Expo Go (remote push removed in SDK 53)
 * - Permissions denied
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (useMock) return null;

  const Notifs = await getNotifications();
  if (!Notifs) {
    console.log('[Push] Expo Go detected — remote push requires a development build');
    console.log('[Push] Local notifications still work via "Send Test Notification" in Profile');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifs.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not yet determined
  if (existingStatus !== 'granted') {
    const { status } = await Notifs.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Notification permissions not granted');
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifs.getExpoPushTokenAsync();
  const pushToken = tokenData.data;

  // Register with backend
  try {
    await api.registerPushToken(pushToken, Platform.OS as 'ios' | 'android');
    console.log('[Push] Token registered with backend:', pushToken);
  } catch (err) {
    console.error('[Push] Failed to register token with backend:', err);
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    Notifs.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifs.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#061b0e',
    });
  }

  return pushToken;
}

/**
 * Send a local notification (works in Expo Go on iOS, requires dev build on Android).
 */
export async function sendLocalTestNotification(): Promise<void> {
  const Notifs = await getNotifications();
  if (!Notifs) {
    throw new Error('Local notifications require a development build on Android Expo Go');
  }
  await Notifs.scheduleNotificationAsync({
    content: {
      title: '🌿 Elixir & Stem',
      body: 'Push notifications are working! This is a local test notification.',
      data: { type: 'test' },
    },
    trigger: null, // immediate
  });
}

// ── Listeners (no-op in Expo Go) ────────────────────────────────────────

let cleanupFns: (() => void)[] = [];

/**
 * Set up notification listeners. Call this once in the root component.
 * Returns cleanup function. No-op in Expo Go.
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationTapped?: (response: any) => void
): () => void {
  // If in Expo Go, return a no-op cleanup
  if (isExpoGo()) return () => {};

  // Listeners require the module to be loaded — schedule async init
  getNotifications().then((Notifs) => {
    if (!Notifs) return;
    const receivedSub = Notifs.addNotificationReceivedListener((notification: any) => {
      onNotificationReceived?.(notification);
    });
    const responseSub = Notifs.addNotificationResponseReceivedListener((response: any) => {
      onNotificationTapped?.(response);
    });
    cleanupFns.push(() => receivedSub.remove(), () => responseSub.remove());
  });

  return () => {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  };
}

/**
 * Extract navigation data from a notification response.
 * Returns the screen name and params to navigate to.
 */
export function getNotificationNavigationData(
  response: any
): { screen: string; params?: Record<string, any> } | null {
  const data = response?.notification?.request?.content?.data;
  if (!data?.screen) return null;

  const params: Record<string, any> = {};
  if (data.orderId) params.orderId = data.orderId;

  return { screen: data.screen as string, params: Object.keys(params).length > 0 ? params : undefined };
}

/**
 * Unregister push token from backend (e.g., on sign out).
 */
export async function unregisterPushNotifications(): Promise<void> {
  if (useMock) return;
  try {
    await api.unregisterPushToken();
  } catch {
    // Ignore errors on cleanup
  }
}
