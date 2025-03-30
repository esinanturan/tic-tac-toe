import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type ScoreBoardProps = {
  score: {
    player1: number;
    player2: number;
    ties: number;
  };
  currentPlayer: string;
  lastWinner: string | null;
};

export function ScoreBoard({ score, currentPlayer, lastWinner }: ScoreBoardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  
  // Define theme colors
  const player1Color = colors.tint;
  const player2Color = isDark ? '#FF9C41' : '#FF9500'; // Slightly adjusted for dark mode
  const tieColor = isDark ? '#636366' : '#8E8E93';
  const trackColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  
  // Animated style for the player indicator
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        currentPlayer === 'X' ? player1Color : player2Color, 
        { duration: 300 }
      ),
      transform: [
        { 
          translateX: withTiming(
            currentPlayer === 'X' ? 0 : 100, 
            { duration: 300 }
          ) 
        }
      ],
    };
  }, [currentPlayer, colorScheme, player1Color, player2Color]);
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.scoresContainer}>
        <ScoreItem label="Player 1 (X)" score={score.player1} color={player1Color} />
        <ScoreItem label="Ties" score={score.ties} color={tieColor} />
        <ScoreItem label="Player 2 (O)" score={score.player2} color={player2Color} />
      </ThemedView>
      
      <ThemedView style={styles.turnContainer}>
        <ThemedText style={styles.turnText}>Current turn</ThemedText>
        <View style={[styles.indicatorTrack, { backgroundColor: trackColor }]}>
          <Animated.View style={[styles.indicator, indicatorStyle]} />
          <ThemedText style={[styles.playerX, { color: currentPlayer === 'X' ? '#FFF' : colors.text }]}>X</ThemedText>
          <ThemedText style={[styles.playerO, { color: currentPlayer === 'O' ? '#FFF' : colors.text }]}>O</ThemedText>
        </View>
      </ThemedView>
      
      {lastWinner && (
        <ThemedView style={styles.lastWinnerContainer}>
          <ThemedText style={styles.lastWinnerText}>
            Last winner: {lastWinner === 'X' ? 'Player 1 (X)' : 'Player 2 (O)'}
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

type ScoreItemProps = {
  label: string;
  score: number;
  color: string;
};

function ScoreItem({ label, score, color }: ScoreItemProps) {
  return (
    <View style={styles.scoreItem}>
      <ThemedText style={styles.scoreLabel}>{label}</ThemedText>
      <View style={[styles.scoreValue, { backgroundColor: color }]}>
        <ThemedText style={styles.scoreNumber}>{score}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 20,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreItem: {
    alignItems: 'center',
    gap: 4,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  scoreValue: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  turnContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  turnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  indicatorTrack: {
    width: 140,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    width: 70,
    height: 40,
    borderRadius: 20,
  },
  playerX: {
    flex: 1,
    textAlign: 'center',
    lineHeight: 40,
    fontWeight: 'bold',
    fontSize: 18,
  },
  playerO: {
    flex: 1,
    textAlign: 'center',
    lineHeight: 40,
    fontWeight: 'bold',
    fontSize: 18,
  },
  lastWinnerContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  lastWinnerText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
}); 