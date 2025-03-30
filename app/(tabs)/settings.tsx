import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Switch, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Types for leaderboard entries
type LeaderboardEntry = {
  playerName: string;
  timeSeconds: number;
  gridSize: number;
  date: string;
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Game settings
  const [settings, setSettings] = useState({
    gridSize: 3,
    winLength: 3,
    enableTimer: true,
    enableSounds: true,
    playerName: 'Player 1'
  });
  
  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedGridSize, setSelectedGridSize] = useState(3);
  
  // Load settings and leaderboard on mount
  useEffect(() => {
    loadSettings();
    loadLeaderboard();
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
  
  // Load leaderboard from AsyncStorage
  const loadLeaderboard = async () => {
    try {
      const savedLeaderboard = await AsyncStorage.getItem('gameLeaderboard');
      if (savedLeaderboard) {
        setLeaderboard(JSON.parse(savedLeaderboard));
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };
  
  // Reset leaderboard
  const resetLeaderboard = async () => {
    Alert.alert(
      'Reset Leaderboard',
      'Are you sure you want to reset the leaderboard? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('gameLeaderboard');
              setLeaderboard([]);
            } catch (error) {
              console.error('Failed to reset leaderboard:', error);
            }
          }
        }
      ]
    );
  };
  
  // Format time for display (mm:ss.ms)
  const formatTime = (timeSeconds: number) => {
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = Math.floor(timeSeconds % 60);
    const ms = Math.floor((timeSeconds % 1) * 100);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Grid size options
  const gridSizeOptions = [3, 4, 5, 6];
  
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
  
  // Handle toggle changes
  const handleToggleChange = (key: keyof typeof settings, value: boolean) => {
    saveSettings({
      ...settings,
      [key]: value
    });
  };
  
  // Filter leaderboard by selected grid size
  const filteredLeaderboard = leaderboard
    .filter(entry => entry.gridSize === selectedGridSize)
    .sort((a, b) => a.timeSeconds - b.timeSeconds)
    .slice(0, 10); // Top 10 times
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Game Settings</ThemedText>
      
      <ScrollView style={styles.scrollView}>
        {/* Grid Size Settings */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Grid Size</ThemedText>
          <View style={styles.optionsContainer}>
            {gridSizeOptions.map(size => (
              <Pressable
                key={`grid-${size}`}
                style={[
                  styles.optionButton,
                  { backgroundColor: settings.gridSize === size ? colors.tint : 'transparent' }
                ]}
                onPress={() => handleGridSizeChange(size)}
              >
                <ThemedText 
                  style={[
                    styles.optionText, 
                    { color: settings.gridSize === size ? '#FFF' : colors.text }
                  ]}
                >
                  {size}x{size}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </ThemedView>
        
        {/* Win Length Settings */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Win Length</ThemedText>
          <View style={styles.optionsContainer}>
            {Array.from({ length: settings.gridSize }, (_, i) => i + 3)
              .filter(len => len <= settings.gridSize)
              .map(length => (
                <Pressable
                  key={`win-${length}`}
                  style={[
                    styles.optionButton,
                    { backgroundColor: settings.winLength === length ? colors.tint : 'transparent' }
                  ]}
                  onPress={() => handleWinLengthChange(length)}
                >
                  <ThemedText 
                    style={[
                      styles.optionText, 
                      { color: settings.winLength === length ? '#FFF' : colors.text }
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
        
        {/* Game Options */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Game Options</ThemedText>
          
          <View style={styles.toggleRow}>
            <ThemedText>Enable Timer</ThemedText>
            <Switch
              value={settings.enableTimer}
              onValueChange={(value) => handleToggleChange('enableTimer', value)}
              trackColor={{ false: '#767577', true: colors.tint }}
            />
          </View>
          
          <View style={styles.toggleRow}>
            <ThemedText>Enable Sounds</ThemedText>
            <Switch
              value={settings.enableSounds}
              onValueChange={(value) => handleToggleChange('enableSounds', value)}
              trackColor={{ false: '#767577', true: colors.tint }}
            />
          </View>
        </ThemedView>
        
        {/* Leaderboard */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Leaderboard</ThemedText>
            <Pressable 
              style={styles.resetButton}
              onPress={resetLeaderboard}
            >
              <ThemedText style={styles.resetText}>Reset</ThemedText>
            </Pressable>
          </View>
          
          <View style={styles.optionsContainer}>
            {gridSizeOptions.map(size => (
              <Pressable
                key={`leaderboard-${size}`}
                style={[
                  styles.optionButton,
                  { backgroundColor: selectedGridSize === size ? colors.tint : 'transparent' }
                ]}
                onPress={() => setSelectedGridSize(size)}
              >
                <ThemedText 
                  style={[
                    styles.optionText, 
                    { color: selectedGridSize === size ? '#FFF' : colors.text }
                  ]}
                >
                  {size}x{size}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          
          <ThemedView style={styles.leaderboardContainer}>
            {filteredLeaderboard.length > 0 ? (
              <>
                <View style={styles.leaderboardHeader}>
                  <ThemedText style={[styles.leaderboardHeaderText, { flex: 0.5 }]}>Rank</ThemedText>
                  <ThemedText style={[styles.leaderboardHeaderText, { flex: 2 }]}>Player</ThemedText>
                  <ThemedText style={[styles.leaderboardHeaderText, { flex: 1.5 }]}>Time</ThemedText>
                  <ThemedText style={[styles.leaderboardHeaderText, { flex: 1.5 }]}>Date</ThemedText>
                </View>
                
                {filteredLeaderboard.map((entry, index) => (
                  <View key={`entry-${index}`} style={styles.leaderboardRow}>
                    <ThemedText style={[styles.leaderboardText, { flex: 0.5 }]}>{index + 1}</ThemedText>
                    <ThemedText style={[styles.leaderboardText, { flex: 2 }]} numberOfLines={1}>{entry.playerName}</ThemedText>
                    <ThemedText style={[styles.leaderboardText, { flex: 1.5 }]}>{formatTime(entry.timeSeconds)}</ThemedText>
                    <ThemedText style={[styles.leaderboardText, { flex: 1.5 }]} numberOfLines={1}>{new Date(entry.date).toLocaleDateString()}</ThemedText>
                  </View>
                ))}
              </>
            ) : (
              <ThemedText style={styles.emptyLeaderboard}>
                No records yet. Win games to set records!
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150, 150, 150, 0.3)',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
  },
  resetText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  leaderboardContainer: {
    marginTop: 16,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.3)',
  },
  leaderboardHeaderText: {
    fontWeight: '600',
    fontSize: 14,
  },
  leaderboardRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  leaderboardText: {
    fontSize: 14,
  },
  emptyLeaderboard: {
    textAlign: 'center',
    marginVertical: 24,
    opacity: 0.6,
  },
}); 