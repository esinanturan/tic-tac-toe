import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Switch, Pressable, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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
  
  // Save settings to AsyncStorage
  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('gameSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
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
      'Clear Leaderboard',
      'Are you sure you want to clear all leaderboard data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearLeaderboardData
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Game Settings</ThemedText>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Player Names and Symbols */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <ThemedText type="subtitle" style={{ color: sectionHeaderColor }}>Player Settings</ThemedText>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Player 1 Name</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBgColor,
                    color: inputTextColor,
                    borderColor: borderColor
                  }
                ]}
                value={settings.player1Name}
                onChangeText={handlePlayer1NameChange}
                placeholder="Enter Player 1 name"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              />
            </View>
            
            <View style={styles.symbolSelectorContainer}>
              <ThemedText style={styles.inputLabel}>Player 1 Symbol</ThemedText>
              <View style={styles.symbolsRow}>
                {SYMBOL_OPTIONS.map(option => (
                  <Pressable
                    key={`p1-${option.value}`}
                    style={[
                      styles.symbolButton,
                      { 
                        backgroundColor: settings.player1Symbol === option.value ? buttonSelectedBg : 'transparent',
                        borderColor: borderColor
                      }
                    ]}
                    onPress={() => handlePlayer1SymbolChange(option.value)}
                  >
                    <ThemedText 
                      style={[
                        styles.symbolText, 
                        { 
                          color: settings.player1Symbol === option.value ? buttonSelectedText : colors.text,
                          fontSize: option.value.length > 1 ? 16 : 20 // Adjust size for emojis
                        }
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
            
            <View style={[styles.divider, { borderColor: borderColor }]} />
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Player 2 Name</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBgColor,
                    color: inputTextColor,
                    borderColor: borderColor
                  }
                ]}
                value={settings.player2Name}
                onChangeText={handlePlayer2NameChange}
                placeholder="Enter Player 2 name"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              />
            </View>
            
            <View style={styles.symbolSelectorContainer}>
              <ThemedText style={styles.inputLabel}>Player 2 Symbol</ThemedText>
              <View style={styles.symbolsRow}>
                {SYMBOL_OPTIONS.map(option => (
                  <Pressable
                    key={`p2-${option.value}`}
                    style={[
                      styles.symbolButton,
                      { 
                        backgroundColor: settings.player2Symbol === option.value ? buttonSelectedBg : 'transparent',
                        borderColor: borderColor
                      }
                    ]}
                    onPress={() => handlePlayer2SymbolChange(option.value)}
                  >
                    <ThemedText 
                      style={[
                        styles.symbolText, 
                        { 
                          color: settings.player2Symbol === option.value ? buttonSelectedText : colors.text,
                          fontSize: option.value.length > 1 ? 16 : 20 // Adjust size for emojis
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
          
          {/* Grid Size Settings */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <ThemedText type="subtitle" style={{ color: sectionHeaderColor }}>Grid Size</ThemedText>
            <View style={styles.optionsContainer}>
              {gridSizeOptions.map(size => (
                <Pressable
                  key={`grid-${size}`}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: settings.gridSize === size ? buttonSelectedBg : 'transparent',
                      borderColor: borderColor
                    }
                  ]}
                  onPress={() => handleGridSizeChange(size)}
                >
                  <ThemedText 
                    style={[
                      styles.optionText, 
                      { color: settings.gridSize === size ? buttonSelectedText : colors.text }
                    ]}
                  >
                    {size}x{size}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ThemedView>
          
          {/* Win Length Settings */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <ThemedText type="subtitle" style={{ color: sectionHeaderColor }}>Win Length</ThemedText>
            <View style={styles.optionsContainer}>
              {Array.from({ length: settings.gridSize }, (_, i) => i + 3)
                .filter(len => len <= settings.gridSize)
                .map(length => (
                  <Pressable
                    key={`win-${length}`}
                    style={[
                      styles.optionButton,
                      { 
                        backgroundColor: settings.winLength === length ? buttonSelectedBg : 'transparent',
                        borderColor: borderColor
                      }
                    ]}
                    onPress={() => handleWinLengthChange(length)}
                  >
                    <ThemedText 
                      style={[
                        styles.optionText, 
                        { color: settings.winLength === length ? buttonSelectedText : colors.text }
                      ]}
                    >
                      {length}
                    </ThemedText>
                  </Pressable>
                ))}
            </View>
            <ThemedText style={[styles.helperText, { opacity: isDark ? 0.8 : 0.6 }]}>
              Number of marks in a row needed to win
            </ThemedText>
          </ThemedView>
          
          {/* Rounds Settings */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <ThemedText type="subtitle" style={{ color: sectionHeaderColor }}>Match Rounds</ThemedText>
            <View style={styles.optionsContainer}>
              {roundsOptions.map(rounds => (
                <Pressable
                  key={`rounds-${rounds}`}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: settings.maxRounds === rounds ? buttonSelectedBg : 'transparent',
                      borderColor: borderColor
                    }
                  ]}
                  onPress={() => handleRoundsChange(rounds)}
                >
                  <ThemedText 
                    style={[
                      styles.optionText, 
                      { color: settings.maxRounds === rounds ? buttonSelectedText : colors.text }
                    ]}
                  >
                    {rounds}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <ThemedText style={[styles.helperText, { opacity: isDark ? 0.8 : 0.6 }]}>
              Number of rounds in a complete match
            </ThemedText>
          </ThemedView>
          
          {/* Game Options */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <ThemedText type="subtitle" style={{ color: sectionHeaderColor }}>Game Options</ThemedText>
            
            <View style={[styles.toggleRow, { borderBottomColor: borderColor }]}>
              <ThemedText>Enable Timer</ThemedText>
              <Switch
                value={settings.enableTimer}
                onValueChange={(value) => handleToggleChange('enableTimer', value)}
                trackColor={{ false: isDark ? '#3A3A3C' : '#767577', true: colors.tint }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={isDark ? '#3A3A3C' : '#767577'}
              />
            </View>
            
            <View style={[styles.toggleRow, { borderBottomColor: borderColor }]}>
              <ThemedText>Enable Sounds</ThemedText>
              <Switch
                value={settings.enableSounds}
                onValueChange={(value) => handleToggleChange('enableSounds', value)}
                trackColor={{ false: isDark ? '#3A3A3C' : '#767577', true: colors.tint }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={isDark ? '#3A3A3C' : '#767577'}
              />
            </View>
          </ThemedView>
          
          {/* Data Management Section */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <ThemedText type="subtitle" style={{ color: sectionHeaderColor }}>Data Management</ThemedText>
            
            <ThemedText style={[styles.helperText, { opacity: isDark ? 0.8 : 0.6, marginBottom: 16 }]}>
              Clear all game records and leaderboard data
            </ThemedText>
            
            <Pressable 
              style={[styles.dangerButton, { backgroundColor: dangerButtonBg }]}
              onPress={confirmClearLeaderboard}
            >
              <ThemedText style={[styles.dangerButtonText, { color: dangerButtonTextColor }]}>
                Clear Leaderboard Data
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ScrollView>
      </ThemedView>
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
}); 