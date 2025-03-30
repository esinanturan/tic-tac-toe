import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Text, FlatList, View, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Define leaderboard entry type
type LeaderboardEntry = {
  player: string;
  gridSize: number;
  winLength: number;
  time: number;
  date: string;
  playerName?: string;
  symbol?: string;
};

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Theme-aware colors
  const itemBgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const rankBgColor = isDark ? 'rgba(0,122,255,0.7)' : 'rgba(0,122,255,0.8)';
  const timeTextColor = colors.tint;
  // Ensure good opacity for secondary text in dark mode
  const secondaryTextOpacity = isDark ? 0.8 : 0.7;
  // Title text should be more visible
  const titleColor = isDark ? 'rgba(255,255,255,0.95)' : colors.text;
  
  // Theme-aware colors for the clear button
  const clearButtonBg = isDark ? 'rgba(255,59,48,0.8)' : '#FF3B30'; // Red color
  const clearButtonTextColor = '#FFFFFF';
  
  // Load leaderboard data when the component mounts or when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadLeaderboard();
    }, [])
  );
  
  // Load leaderboard data from AsyncStorage
  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const leaderboardStr = await AsyncStorage.getItem('leaderboard');
      
      if (leaderboardStr) {
        const leaderboardData = JSON.parse(leaderboardStr);
        
        // Add symbol information if missing
        const updatedData = leaderboardData.map((entry: LeaderboardEntry) => {
          if (!entry.symbol) {
            const isPlayerOne = entry.player.includes('Player 1');
            return {
              ...entry,
              symbol: isPlayerOne ? 'X' : 'O'
            };
          }
          return entry;
        });
        
        setLeaderboard(updatedData);
      } else {
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Format time for display (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get player display name
  const getPlayerDisplayName = (entry: LeaderboardEntry) => {
    const symbol = entry.symbol || (entry.player.includes('Player 1') ? 'X' : 'O');
    return `${entry.playerName || entry.player} (${symbol})`;
  };
  
  // Render list item
  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={[styles.leaderboardItem, { backgroundColor: itemBgColor }]}>
      <View style={[styles.rankContainer, { backgroundColor: rankBgColor }]}>
        <ThemedText style={[styles.rankText, { color: '#FFFFFF' }]}>{index + 1}</ThemedText>
      </View>
      <View style={styles.detailsContainer}>
        <View style={styles.row}>
          <ThemedText style={styles.playerName}>
            {getPlayerDisplayName(item)}
          </ThemedText>
          <ThemedText style={[styles.timeText, { color: timeTextColor }]}>
            {formatTime(item.time)}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={[styles.gridInfo, { opacity: secondaryTextOpacity }]}>
            {item.gridSize}x{item.gridSize} grid ({item.winLength} to win)
          </ThemedText>
          <ThemedText style={[styles.dateText, { opacity: secondaryTextOpacity }]}>
            {formatDate(item.date)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
  
  // Clear leaderboard
  const clearLeaderboard = async () => {
    try {
      await AsyncStorage.removeItem('leaderboard');
      await AsyncStorage.removeItem('roundsData');
      setLeaderboard([]);
    } catch (error) {
      console.error('Failed to clear leaderboard:', error);
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
          onPress: clearLeaderboard
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={[styles.title, { color: titleColor }]}>Leaderboard</ThemedText>
        <ThemedText style={[styles.subtitle, { opacity: secondaryTextOpacity }]}>Fastest Win Times</ThemedText>
        
        {loading ? (
          <ThemedText style={styles.loadingText}>Loading leaderboard data...</ThemedText>
        ) : leaderboard.length > 0 ? (
          <>
            <FlatList
              data={leaderboard}
              renderItem={renderItem}
              keyExtractor={(item, index) => `leaderboard-${index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
            <Pressable 
              style={[styles.clearButton, { backgroundColor: clearButtonBg }]}
              onPress={confirmClearLeaderboard}
            >
              <ThemedText style={[styles.clearButtonText, { color: clearButtonTextColor }]}>
                Clear Leaderboard
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <ThemedView style={[styles.emptyContainer, { backgroundColor: itemBgColor }]}>
            <ThemedText style={[styles.emptyText, { opacity: secondaryTextOpacity }]}>
              No leaderboard entries yet. Start playing to set records!
            </ThemedText>
          </ThemedView>
        )}
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
    padding: 16,
    paddingBottom: 100, // Extra padding for tab bar
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.7,
  },
  listContent: {
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsContainer: {
    flex: 1,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  gridInfo: {
    fontSize: 12,
    opacity: 0.7,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.7,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 24,
  },
  clearButton: {
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  clearButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 