import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type GameSettings = {
  gridSize: number;
  winLength: number;
  currentPlayer: string;
  gameMode: string;
  enableTimer?: boolean;
  enableSounds?: boolean;
  playerName?: string;
};

type GameSettingsProps = {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
};

export function GameSettings({ settings, onUpdateSettings }: GameSettingsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isExpanded, setIsExpanded] = useState(false);
  const [gameSettingsChanged, setGameSettingsChanged] = useState(false);
  
  // Animation values
  const rotateValue = useSharedValue(0);
  const heightValue = useSharedValue(0);
  
  // Toggle panel expansion
  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
    rotateValue.value = withTiming(isExpanded ? 0 : 1, { duration: 300 });
    heightValue.value = withTiming(isExpanded ? 0 : 1, { duration: 300 });
  };
  
  // Animated styles
  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateValue.value * 180}deg` }],
    };
  });
  
  const contentStyle = useAnimatedStyle(() => {
    return {
      height: heightValue.value * 200,
      opacity: heightValue.value,
      overflow: 'hidden',
    };
  });
  
  // Settings options
  const gridSizeOptions = [3, 4, 5];
  const winLengthOptions = [3, 4, 5];
  const gameModeOptions = [
    { value: 'local', label: 'Local Multiplayer' },
    { value: 'online', label: 'Online Multiplayer' },
  ];
  
  // Save settings to AsyncStorage and update parent component
  const saveSettings = async (newSettings: Partial<GameSettings>) => {
    try {
      // If grid size or win length changes, this is a critical game setting change
      const isCriticalChange = 
        (newSettings.gridSize !== undefined && newSettings.gridSize !== settings.gridSize) ||
        (newSettings.winLength !== undefined && newSettings.winLength !== settings.winLength);
      
      // Signal that game settings changed
      if (isCriticalChange) {
        setGameSettingsChanged(true);
      }
      
      // Get current settings from storage
      const savedSettingsStr = await AsyncStorage.getItem('gameSettings');
      const savedSettings = savedSettingsStr ? JSON.parse(savedSettingsStr) : { ...settings };
      
      // Update with new settings
      const updatedSettings = { ...savedSettings, ...newSettings };
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('gameSettings', JSON.stringify(updatedSettings));
      
      // Update parent component only for non-critical changes
      if (!isCriticalChange) {
        onUpdateSettings(newSettings);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };
  
  // Handle grid size change
  const handleGridSizeChange = (size: number) => {
    const newSettings = { 
      gridSize: size,
      // Ensure win length is not greater than grid size
      winLength: Math.min(settings.winLength, size)
    };
    saveSettings(newSettings);
  };
  
  // Handle win length change
  const handleWinLengthChange = (length: number) => {
    saveSettings({ winLength: length });
  };
  
  // Handle game mode change
  const handleGameModeChange = (mode: string) => {
    saveSettings({ gameMode: mode });
    onUpdateSettings({ gameMode: mode });
  };
  
  return (
    <ThemedView style={styles.container}>
      <Pressable style={styles.header} onPress={toggleExpand}>
        <ThemedText type="subtitle">Game Settings</ThemedText>
        <Animated.View style={iconStyle}>
          <Ionicons 
            name="chevron-down" 
            size={24} 
            color={colors.text} 
          />
        </Animated.View>
      </Pressable>
      
      <Animated.View style={[styles.content, contentStyle]}>
        <View style={styles.settingRow}>
          <ThemedText style={styles.settingLabel}>Grid Size:</ThemedText>
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
        </View>
        
        <View style={styles.settingRow}>
          <ThemedText style={styles.settingLabel}>Win Length:</ThemedText>
          <View style={styles.optionsContainer}>
            {winLengthOptions.filter(len => len <= settings.gridSize).map(length => (
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
        </View>
        
        <View style={styles.settingRow}>
          <ThemedText style={styles.settingLabel}>Game Mode:</ThemedText>
          <View style={styles.optionsContainer}>
            {gameModeOptions.map(mode => (
              <Pressable
                key={`mode-${mode.value}`}
                style={[
                  styles.modeButton,
                  { backgroundColor: settings.gameMode === mode.value ? colors.tint : 'transparent' }
                ]}
                onPress={() => handleGameModeChange(mode.value)}
              >
                <ThemedText 
                  style={[
                    styles.optionText, 
                    { color: settings.gameMode === mode.value ? '#FFF' : colors.text }
                  ]}
                >
                  {mode.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
        
        {gameSettingsChanged && (
          <ThemedText style={styles.changeNotice}>
            Grid/win settings will apply when you switch to game tab
          </ThemedText>
        )}
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    marginVertical: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    paddingHorizontal: 16,
  },
  settingRow: {
    marginVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  changeNotice: {
    marginTop: 16,
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
  },
}); 