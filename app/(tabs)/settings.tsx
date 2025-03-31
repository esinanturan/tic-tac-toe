import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Switch, Pressable, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Default symbols for players
const DEFAULT_SYMBOLS = {
  player1: 'X',
  player2: 'O'
};

// Symbol options including emojis
const SYMBOL_OPTIONS = [
  { value: 'X', label: 'X' },
  { value: 'O', label: 'O' },
  { value: '😀', label: '😀' },
  { value: '😎', label: '😎' },
  { value: '🚀', label: '🚀' },
  { value: '⭐', label: '⭐' },
  { value: '🔥', label: '🔥' },
  { value: '💫', label: '💫' },
  { value: '🌟', label: '🌟' },
  { value: '🎮', label: '🎮' }
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  
  // Theme-aware colors
  const sectionBgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const buttonSelectedBg = colors.tint;
  const buttonSelectedText = isDark ? '#000000' : '#FFFFFF';
  const sectionHeaderColor = isDark ? 'rgba(255,255,255,0.9)' : colors.text;
  const inputBgColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const inputTextColor = colors.text;
  
  // Theme-aware colors for danger button
  const dangerButtonBg = isDark ? 'rgba(255,59,48,0.8)' : '#FF3B30'; // Red color
  const dangerButtonTextColor = '#FFFFFF';
  
  // Player 2 color (orange for o)
  const player2Color = isDark ? '#FF9C41' : '#FF9500';
  
  // Game settings
  const [settings, setSettings] = useState({
    gridSize: 3,
    winLength: 3,
    enableTimer: true,
    enableSounds: true,
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    maxRounds: 5,
    player1Symbol: DEFAULT_SYMBOLS.player1,
    player2Symbol: DEFAULT_SYMBOLS.player2
  });
  
  // Add feedback toast for settings changes
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Load settings from AsyncStorage
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('gameSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        
        // Handle migration from old format
        if (parsedSettings.playerName && !parsedSettings.player1Name) {
          parsedSettings.player1Name = parsedSettings.playerName;
        }
        if (!parsedSettings.player2Name) {
          parsedSettings.player2Name = 'Player 2';
        }
        
        // Set default symbols if not present
        if (!parsedSettings.player1Symbol) {
          parsedSettings.player1Symbol = DEFAULT_SYMBOLS.player1;
        }
        if (!parsedSettings.player2Symbol) {
          parsedSettings.player2Symbol = DEFAULT_SYMBOLS.player2;
        }
        
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };
  
  // Show feedback to user
  const showSuccessFeedback = () => {
    setFeedbackMessage(t('settings.settingsUpdated'));
    setShowFeedback(true);
    
    // Auto-hide feedback after 2 seconds
    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
  };
  
  // Save settings to AsyncStorage
  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('gameSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      showSuccessFeedback();
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };
  
  // Grid size options
  const gridSizeOptions = [3, 4, 5, 6];
  
  // Rounds options
  const roundsOptions = [1, 3, 5, 7, 10];
  
  // Handle grid size change
  const handleGridSizeChange = (size: number) => {
    const newSettings = {
      ...settings,
      gridSize: size,
      // Ensure winLength is not greater than gridSize
      winLength: Math.min(settings.winLength, size)
    };
    saveSettings(newSettings);
  };
  
  // Handle win length change
  const handleWinLengthChange = (length: number) => {
    saveSettings({
      ...settings,
      winLength: length
    });
  };
  
  // Handle rounds change
  const handleRoundsChange = (rounds: number) => {
    saveSettings({
      ...settings,
      maxRounds: rounds
    });
  };
  
  // Handle toggle changes
  const handleToggleChange = (key: keyof typeof settings, value: boolean) => {
    saveSettings({
      ...settings,
      [key]: value
    });
  };
  
  // Handle player name change
  const handlePlayer1NameChange = (name: string) => {
    saveSettings({
      ...settings,
      player1Name: name
    });
  };
  
  // Handle player 2 name change
  const handlePlayer2NameChange = (name: string) => {
    saveSettings({
      ...settings,
      player2Name: name
    });
  };
  
  // Handle player symbol change
  const handlePlayer1SymbolChange = (symbol: string) => {
    // Ensure the two players don't have the same symbol
    if (symbol === settings.player2Symbol) {
      Alert.alert('Symbol already in use', 'Please select a different symbol for Player 1.');
      return;
    }
    
    saveSettings({
      ...settings,
      player1Symbol: symbol
    });
  };
  
  // Handle player 2 symbol change
  const handlePlayer2SymbolChange = (symbol: string) => {
    // Ensure the two players don't have the same symbol
    if (symbol === settings.player1Symbol) {
      Alert.alert('Symbol already in use', 'Please select a different symbol for Player 2.');
      return;
    }
    
    saveSettings({
      ...settings,
      player2Symbol: symbol
    });
  };
  
  // Clear leaderboard data
  const clearLeaderboardData = async () => {
    try {
      await AsyncStorage.removeItem('leaderboard');
      await AsyncStorage.removeItem('roundsData');
      Alert.alert('Success', 'Leaderboard data has been cleared.');
    } catch (error) {
      console.error('Failed to clear leaderboard:', error);
      Alert.alert('Error', 'Failed to clear leaderboard data.');
    }
  };
  
  // Confirm and clear leaderboard
  const confirmClearLeaderboard = () => {
    Alert.alert(
      t('leaderboard.title'),
      t('leaderboard.confirmClear'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('leaderboard.clearButton'),
          style: 'destructive',
          onPress: clearLeaderboardData
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>{t('settings.title')}</ThemedText>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Player Names and Symbols */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <ThemedText type="subtitle" style={{ color: sectionHeaderColor }}>
              {t('settings.playerSettings')}
            </ThemedText>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>{t('settings.player1Name')}</ThemedText>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: inputBgColor,
                    borderColor: borderColor,
                    color: inputTextColor
                  }
                ]}
                value={settings.player1Name}
                onChangeText={handlePlayer1NameChange}
                placeholder={t('game.player1')}
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              />
            </View>
            
            <View style={styles.symbolSelectorContainer}>
              <ThemedText style={styles.inputLabel}>{t('settings.selectSymbol')}</ThemedText>
              <View style={styles.symbolsRow}>
                {SYMBOL_OPTIONS.map(option => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.symbolButton,
                      { 
                        backgroundColor: settings.player1Symbol === option.value ? 
                          colors.tint : 'transparent',
                        borderColor: settings.player1Symbol === option.value ? 
                          colors.tint : borderColor
                      }
                    ]}
                    onPress={() => handlePlayer1SymbolChange(option.value)}
                  >
                    <ThemedText 
                      style={[
                        styles.symbolText, 
                        { 
                          color: settings.player1Symbol === option.value ? 
                            isDark ? '#000' : '#fff' : colors.text 
                        }
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
            
            {/* Player 2 Name and Symbol */}
            <View style={[styles.divider, { borderBottomColor: borderColor }]} />
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>{t('settings.player2Name')}</ThemedText>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: inputBgColor,
                    borderColor: borderColor,
                    color: inputTextColor
                  }
                ]}
                value={settings.player2Name}
                onChangeText={handlePlayer2NameChange}
                placeholder={t('game.player2')}
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              />
            </View>
            
            <View style={styles.symbolSelectorContainer}>
              <ThemedText style={styles.inputLabel}>{t('settings.selectSymbol')}</ThemedText>
              <View style={styles.symbolsRow}>
                {SYMBOL_OPTIONS.map(option => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.symbolButton,
                      { 
                        backgroundColor: settings.player2Symbol === option.value ? 
                          player2Color : 'transparent',
                        borderColor: settings.player2Symbol === option.value ? 
                          player2Color : borderColor
                      }
                    ]}
                    onPress={() => handlePlayer2SymbolChange(option.value)}
                  >
                    <ThemedText 
                      style={[
                        styles.symbolText, 
                        { 
                          color: settings.player2Symbol === option.value ? 
                            '#FFFFFF' : colors.text 
                        }
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </ThemedView>
          
          {/* Grid Size and Win Length, and Rounds */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={{ color: sectionHeaderColor }}>
                {t('app.title')}
              </ThemedText>
            </View>
            
            <ThemedText style={[styles.helperText, { marginBottom: 8 }]}>
              {t('settings.gridSize', { size: settings.gridSize })}
            </ThemedText>
            <View style={styles.optionsContainer}>
              {gridSizeOptions.map(size => (
                <Pressable
                  key={`size-${size}`}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: settings.gridSize === size ? 
                        buttonSelectedBg : 'transparent',
                      borderColor: settings.gridSize === size ? 
                        buttonSelectedBg : borderColor
                    }
                  ]}
                  onPress={() => handleGridSizeChange(size)}
                >
                  <ThemedText 
                    style={[
                      styles.optionText, 
                      { 
                        color: settings.gridSize === size ? 
                          buttonSelectedText : colors.text 
                      }
                    ]}
                  >
                    {size}x{size}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            
            <ThemedText style={[styles.helperText, { marginTop: 16, marginBottom: 8 }]}>
              {t('settings.winLength', { length: settings.winLength })}
            </ThemedText>
            <View style={styles.optionsContainer}>
              {Array.from({ length: settings.gridSize }, (_, i) => i + 3).filter(n => n <= settings.gridSize).map(length => (
                <Pressable
                  key={`length-${length}`}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: settings.winLength === length ? 
                        buttonSelectedBg : 'transparent',
                      borderColor: settings.winLength === length ? 
                        buttonSelectedBg : borderColor
                    }
                  ]}
                  onPress={() => handleWinLengthChange(length)}
                >
                  <ThemedText 
                    style={[
                      styles.optionText, 
                      { 
                        color: settings.winLength === length ? 
                          buttonSelectedText : colors.text 
                      }
                    ]}
                  >
                    {length}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            
            <ThemedText style={[styles.helperText, { marginTop: 16, marginBottom: 8 }]}>
              {t('settings.rounds', { rounds: settings.maxRounds })}
            </ThemedText>
            <View style={styles.optionsContainer}>
              {roundsOptions.map(rounds => (
                <Pressable
                  key={`rounds-${rounds}`}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: settings.maxRounds === rounds ? 
                        buttonSelectedBg : 'transparent',
                      borderColor: settings.maxRounds === rounds ? 
                        buttonSelectedBg : borderColor
                    }
                  ]}
                  onPress={() => handleRoundsChange(rounds)}
                >
                  <ThemedText 
                    style={[
                      styles.optionText, 
                      { 
                        color: settings.maxRounds === rounds ? 
                          buttonSelectedText : colors.text 
                      }
                    ]}
                  >
                    {rounds}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ThemedView>
          
          {/* Game Options */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <ThemedText type="subtitle" style={{ color: sectionHeaderColor }}>
              {t('settings.gameOptions')}
            </ThemedText>
            
            <View style={[styles.toggleRow, { borderBottomColor: borderColor }]}>
              <ThemedText>{t('settings.enableTimer')}</ThemedText>
              <Switch
                value={settings.enableTimer}
                onValueChange={(value) => handleToggleChange('enableTimer', value)}
                trackColor={{ false: isDark ? '#3A3A3C' : '#767577', true: colors.tint }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={isDark ? '#3A3A3C' : '#767577'}
              />
            </View>
            
            <View style={[styles.toggleRow, { borderBottomColor: borderColor }]}>
              <ThemedText>{t('settings.enableSounds')}</ThemedText>
              <Switch
                value={settings.enableSounds}
                onValueChange={(value) => handleToggleChange('enableSounds', value)}
                trackColor={{ false: isDark ? '#3A3A3C' : '#767577', true: colors.tint }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={isDark ? '#3A3A3C' : '#767577'}
              />
            </View>
          </ThemedView>
          
          {/* Language Selection */}
          <LanguageSelector />
          
          {/* Danger Zone */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor, marginTop: 24 }]}>
            <ThemedText type="subtitle" style={[styles.sectionHeader, { color: dangerButtonBg }]}>
              {t('settings.dangerZone')}
            </ThemedText>
            
            <Pressable
              style={[styles.dangerButton, { backgroundColor: dangerButtonBg }]}
              onPress={confirmClearLeaderboard}
            >
              <ThemedText style={[styles.dangerButtonText, { color: dangerButtonTextColor }]}>
                {t('leaderboard.clearButton')}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ScrollView>
      </ThemedView>
      
      {/* Feedback Toast */}
      {showFeedback && (
        <Animated.View 
          style={[styles.feedbackToast, { backgroundColor: colors.tint }]}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
        >
          <ThemedText style={[styles.feedbackText, { color: isDark ? '#000' : '#fff' }]}>
            {feedbackMessage}
          </ThemedText>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  title: {
    textAlign: 'center',
    marginVertical: 20,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionText: {
    fontWeight: '500',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  resetText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  dangerButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  symbolSelectorContainer: {
    marginBottom: 16,
  },
  symbolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symbolButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  feedbackToast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  feedbackText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 