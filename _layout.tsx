import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/src/i18n/i18n';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// ... rest of imports and code ...

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <I18nextProvider i18n={i18n}>
      <Tabs
        screenOptions={{
          // ... existing tab options ...
        }}>
        {/* ... existing tabs ... */}
      </Tabs>
    </I18nextProvider>
  );
} 