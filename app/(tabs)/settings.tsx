import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Switch, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  
  // Theme-aware colors
  const sectionBgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const buttonSelectedBg = colors.tint;
  const buttonSelectedText = '#FFF';
  
  // Game settings
  const [settings, setSettings] = useState({
    gridSize: 3,
    winLength: 3,
    enableTimer: true,
    enableSounds: true,
    playerName: 'Player 1',
    maxRounds: 5
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
        setSettings(JSON.parse(savedSettings));
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
  const handlePlayerNameChange = (name: string) => {
    saveSettings({
      ...settings,
      playerName: name
    });
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Game Settings</ThemedText>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Grid Size Settings */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <ThemedText type="subtitle">Grid Size</ThemedText>
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
            <ThemedText type="subtitle">Win Length</ThemedText>
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
            <ThemedText style={styles.helperText}>
              Number of marks in a row needed to win
            </ThemedText>
          </ThemedView>
          
          {/* Rounds Settings */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <ThemedText type="subtitle">Match Rounds</ThemedText>
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
            <ThemedText style={styles.helperText}>
              Number of rounds in a complete match
            </ThemedText>
          </ThemedView>
          
          {/* Game Options */}
          <ThemedView style={[styles.section, { backgroundColor: sectionBgColor }]}>
            <ThemedText type="subtitle">Game Options</ThemedText>
            
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
}); 