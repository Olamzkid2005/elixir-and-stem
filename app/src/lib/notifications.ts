import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api, useMock } from '@/api/client';

/**
 * Configure how notifications appear when the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request push notification permissions and return the Expo push token.
 * Returns null if permissions denied or running in mock mode.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (useMock) return null;

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not yet determined
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Notification permissions not granted');
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const pushToken = tokenData.data;

  // Register with backend
  try {
    await api.registerPushToken(pushToken, Platform.OS as 'ios' | 'android');
  } catch (err) {
    console.error('[Push] Failed to register token with backend:', err);
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#061b0e',
    });
  }

  return pushToken;
}

/**
 * Set up notification listeners. Call this once in the root component.
 * Returns cleanup function.
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    onNotificationReceived?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onNotificationTapped?.(response);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

/**
 * Extract navigation data from a notification response.
 * Returns the screen name and params to navigate to.
 */
export function getNotificationNavigationData(
  response: Notifications.NotificationResponse
): { screen: string; params?: Record<string, any> } | null {
  const data = response.notification.request.content.data;
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
