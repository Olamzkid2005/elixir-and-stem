import './global.css';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts as usePlayfair,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { RootNavigator } from '@/navigation/RootNavigator';
import {
  registerForPushNotifications,
  setupNotificationListeners,
  getNotificationNavigationData,
} from '@/lib/notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [playfairLoaded] = usePlayfair({ PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_600SemiBold });
  const fontsLoaded = playfairLoaded && interLoaded;
  const navigationRef = useNavigationContainerRef<any>();
  const notificationRegistered = useRef(false);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // Initialize push notifications once fonts are loaded
  useEffect(() => {
    if (!fontsLoaded || notificationRegistered.current) return;
    notificationRegistered.current = true;

    // Register for push notifications (fire-and-forget)
    registerForPushNotifications().catch(() => {});

    // Set up notification listeners
    const cleanup = setupNotificationListeners(
      // Received in foreground
      (notification) => {
        console.log('[Push] Notification received:', notification.request.content);
      },
      // Tapped — navigate to the relevant screen
      (response) => {
        const navData = getNotificationNavigationData(response);
        if (navData && navigationRef.current?.isReady()) {
          // @ts-ignore — dynamic navigation
          navigationRef.current.navigate(navData.screen, navData.params);
        }
      }
    );

    return cleanup;
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View className="flex-1 bg-background" />;

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
