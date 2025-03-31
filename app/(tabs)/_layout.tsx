import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Default export is required for Expo Router layouts
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();
  
  // Force UI update when language changes
  useEffect(() => {
    // This is just to ensure the component re-renders when language changes
  }, [i18n.language]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('app.title'),
          tabBarIcon: ({ color }) => <Ionicons name="game-controller" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: t('leaderboard.title'),
          tabBarIcon: ({ color }) => <Ionicons name="trophy" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
