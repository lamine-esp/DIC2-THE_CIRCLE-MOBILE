import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LanguageProvider } from './src/contexts/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Check if onboarding has been completed
        const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
        setHasCompletedOnboarding(onboardingCompleted === 'true');

        // Simulate loading time for splash screen
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn('Error during app preparation:', error);
      } finally {
        setIsLoading(false);
        SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <StatusBar style="dark" backgroundColor="#fff" />
        <AppNavigator />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
