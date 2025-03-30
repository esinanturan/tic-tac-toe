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
  player1Name?: string;
  player2Name?: string;
  player1Symbol?: string;
  player2Symbol?: string;
};

export function ScoreBoard({ 
  score, 
  currentPlayer, 
  lastWinner,
  player1Name = 'Player 1',
  player2Name = 'Player 2',
  player1Symbol = 'X',
  player2Symbol = 'O'
}: ScoreBoardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  
  // Define theme colors
  const player1Color = colors.tint;
  const player2Color = isDark ? '#FF9C41' : '#FF9500'; // Slightly adjusted for dark mode
  const tieColor = isDark ? '#636366' : '#8E8E93';
  const trackColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  
  // Define text colors for current turn indicator with proper contrast
  const player1TextColor = isDark ? '#000000' : '#FFFFFF'; // Black text on blue in dark mode
  const player2TextColor = '#FFFFFF'; // White text on orange works in both modes
  
  // Determine if current player is player 1
  const isPlayer1Turn = currentPlayer === player1Symbol;
  
  // Animated style for the player indicator
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isPlayer1Turn ? player1Color : player2Color, 
        { duration: 300 }
      ),
      transform: [
        { 
          translateX: withTiming(
            isPlayer1Turn ? 0 : 70, 
            { duration: 300 }
          ) 
        }
      ],
    };
  }, [isPlayer1Turn, colorScheme, player1Color, player2Color]);
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.scoresContainer}>
        <ScoreItem label={`${player1Name} (${player1Symbol})`} score={score.player1} color={player1Color} textColor={player1TextColor} />
        <ScoreItem label="Ties" score={score.ties} color={tieColor} textColor="#FFFFFF" />
        <ScoreItem label={`${player2Name} (${player2Symbol})`} score={score.player2} color={player2Color} textColor="#FFFFFF" />
      </ThemedView>
      
      <ThemedView style={styles.turnContainer}>
        <ThemedText style={styles.turnText}>Current turn</ThemedText>
        <View style={[styles.indicatorTrack, { backgroundColor: trackColor }]}>
          <Animated.View style={[styles.indicator, indicatorStyle]} />
          <ThemedText style={[styles.playerX, { 
            color: isPlayer1Turn ? player1TextColor : colors.text 
          }]}>{player1Symbol}</ThemedText>
          <ThemedText style={[styles.playerO, { 
            color: !isPlayer1Turn ? player2TextColor : colors.text 
          }]}>{player2Symbol}</ThemedText>
        </View>
      </ThemedView>
      
      {lastWinner && (
        <ThemedView style={styles.lastWinnerContainer}>
          <ThemedText style={styles.lastWinnerText}>
            Last winner: {lastWinner === player1Symbol ? `${player1Name} (${player1Symbol})` : `${player2Name} (${player2Symbol})`}
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
  textColor?: string;
};

function ScoreItem({ label, score, color, textColor = '#FFFFFF' }: ScoreItemProps) {
  return (
    <View style={styles.scoreItem}>
      <ThemedText style={styles.scoreLabel}>{label}</ThemedText>
      <View style={[styles.scoreValue, { backgroundColor: color }]}>
        <ThemedText style={[styles.scoreNumber, { color: textColor }]}>{score}</ThemedText>
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