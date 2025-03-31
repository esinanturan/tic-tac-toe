import React from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'tr', name: 'Türkçe' }
];

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {t('language.select')}
      </ThemedText>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.languageButtons}
      >
        {LANGUAGES.map(lang => (
          <Pressable
            key={lang.code}
            style={[
              styles.languageButton,
              { 
                backgroundColor: i18n.language === lang.code 
                  ? colors.tint 
                  : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' 
              }
            ]}
            onPress={() => changeLanguage(lang.code)}
          >
            <ThemedText 
              style={[
                styles.languageText, 
                i18n.language === lang.code && { 
                  color: isDark ? '#000' : '#fff',
                  fontWeight: 'bold' 
                }
              ]}
            >
              {t(`language.${lang.code}`)}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  title: {
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 16,
  },
  languageButtons: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  languageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    marginHorizontal: 5,
  },
  languageText: {
    fontSize: 16,
  }
}); 