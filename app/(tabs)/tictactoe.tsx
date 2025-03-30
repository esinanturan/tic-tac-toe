import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, Alert, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameBoard } from '@/components/GameBoard';
import { ScoreBoard } from '@/components/ScoreBoard';
import { GameSettings } from '@/components/GameSettings';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

type GameSettingsType = {
  gridSize: number;
  winLength: number;
  currentPlayer: string;
  gameMode: string;
  enableTimer?: boolean;
  enableSounds?: boolean;
  player1Name?: string;
  player2Name?: string;
  maxRounds?: number;
  player1Symbol?: string;
  player2Symbol?: string;
};

type ScoreType = {
  player1: number;
  player2: number;
  ties: number;
};

// Define leaderboard entry type
type LeaderboardEntry = {
  player: string;
  gridSize: number;
  winLength: number;
  time: number;
  date: string;
  playerName?: string;
  symbol: string;
};

export default function TicTacToeScreen() {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState<ScoreType>({ player1: 0, player2: 0, ties: 0 });
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [lastWinner, setLastWinner] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [showMatchComplete, setShowMatchComplete] = useState(false);
  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  
  // Settings state
  const [gameSettings, setGameSettings] = useState<GameSettingsType>({
    gridSize: 3,
    winLength: 3,
    currentPlayer: 'X',
    gameMode: 'local',
    enableTimer: true,
    enableSounds: true,
    player1Name: '',
    player2Name: '',
    maxRounds: 5, // Default to 5 rounds
    player1Symbol: 'X',
    player2Symbol: 'O'
  });
  
  // Previous settings for comparison
  const [previousSettings, setPreviousSettings] = useState<GameSettingsType | null>(null);
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  
  // Check if match is complete after a round
  useEffect(() => {
    const maxRounds = gameSettings.maxRounds || 5;
    const player1Symbol = gameSettings.player1Symbol || 'X';
    const player2Symbol = gameSettings.player2Symbol || 'O';
    
    console.log(`Round ${currentRound}/${maxRounds}: Player 1 (${player1Symbol}): ${score.player1}, Player 2 (${player2Symbol}): ${score.player2}`);
    
    // Only check if we've played at least one game
    if (score.player1 > 0 || score.player2 > 0 || score.ties > 0) {
      // Check if either player has won more than half the rounds
      const roundsNeededToWin = Math.ceil(maxRounds / 2);
      
      console.log(`Rounds needed to win: ${roundsNeededToWin}`);
      
      if (score.player1 >= roundsNeededToWin) {
        // Player 1 wins the match
        console.log(`Player 1 (${player1Symbol}) wins the match!`);
        setShowMatchComplete(true);
        setMatchWinner(player1Symbol);
        
        // Save match result to leaderboard
        saveMatchToLeaderboard();
      }
      else if (score.player2 >= roundsNeededToWin) {
        // Player 2 wins the match
        console.log(`Player 2 (${player2Symbol}) wins the match!`);
        setShowMatchComplete(true);
        setMatchWinner(player2Symbol);
        
        // Save match result to leaderboard
        saveMatchToLeaderboard();
      }
      // Check if we've reached or completed the maximum number of rounds
      else if (currentRound >= maxRounds) {
        // Match is complete, determine winner based on score
        setShowMatchComplete(true);
        if (score.player1 > score.player2) {
          setMatchWinner(player1Symbol);
          console.log(`Player 1 (${player1Symbol}) wins by score after all rounds`);
        } else if (score.player2 > score.player1) {
          setMatchWinner(player2Symbol);
          console.log(`Player 2 (${player2Symbol}) wins by score after all rounds`);
        } else {
          setMatchWinner(null); // Tie
          console.log('Match ended in a tie');
        }
        
        // Save match result to leaderboard
        saveMatchToLeaderboard();
      }
    }
  }, [currentRound, score, gameSettings]);
  
  // Load game settings from AsyncStorage
  const loadGameSettings = async () => {
    try {
      const savedSettingsStr = await AsyncStorage.getItem('gameSettings');
      if (savedSettingsStr) {
        const savedSettings = JSON.parse(savedSettingsStr);
        // Check if settings have changed while a game is in progress
        if (previousSettings && gameStarted) {
          const criticalSettingsChanged = 
            savedSettings.gridSize !== previousSettings.gridSize ||
            savedSettings.winLength !== previousSettings.winLength ||
            savedSettings.maxRounds !== previousSettings.maxRounds;
            
          if (criticalSettingsChanged) {
            // If critical settings changed during a game, prompt to reset
            promptResetGame(savedSettings);
            return;
          }
        }
        
        // Apply the settings
        setGameSettings(savedSettings);
        
        // Save current settings for future comparison
        setPreviousSettings(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load game settings:', error);
    }
  };
  
  // Prompt the user to reset the game due to settings changes
  const promptResetGame = (newSettings: GameSettingsType) => {
    Alert.alert(
      'Game Settings Changed',
      'Game settings have changed. Would you like to reset the current game and apply the new settings?',
      [
        {
          text: 'Keep Playing',
          style: 'cancel',
        },
        {
          text: 'Reset Game',
          onPress: () => {
            // Apply new settings and reset the game
            setGameSettings(newSettings);
            setPreviousSettings(newSettings);
            resetGame(true); // Reset entire match
          },
        },
      ]
    );
  };
  
  // Effect to monitor tab focus
  useFocusEffect(
    useCallback(() => {
      // Load settings when tab is focused
      loadGameSettings();
      
      return () => {
        // Cleanup if needed
      };
    }, [gameStarted])
  );
  
  // Timer functionality
  useEffect(() => {
    if (timerActive) {
      const id = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      setIntervalId(id);
      return () => clearInterval(id);
    } else if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [timerActive]);
  
  // Start the timer when game begins
  const handleGameStart = () => {
    setGameStarted(true);
    if (gameSettings.enableTimer) {
      setTimerActive(true);
    }
  };
  
  // Handle game won event
  const handleGameWon = (winner: string) => {
    setLastWinner(winner);
    setTimerActive(false);
    
    // Update score - ensure proper player gets the point
    setScore(prev => {
      const newScore = { ...prev };
      if (winner === 'X') {
        newScore.player1 += 1;
        console.log('Player 1 (X) scored a point');
      } else if (winner === 'O') {
        newScore.player2 += 1;
        console.log('Player 2 (O) scored a point');
      }
      return newScore;
    });
    
    // Save round data
    if (gameSettings.enableTimer) {
      saveRoundToLeaderboard(winner, timer);
    }
    
    // Check if we need to increment the round (will be handled by the useEffect)
    const nextRound = currentRound + 1;
    console.log(`Moving to round ${nextRound}`);
    setCurrentRound(nextRound);
  };
  
  // Handle game tie event
  const handleGameTie = () => {
    setTimerActive(false);
    setScore(prev => ({ ...prev, ties: prev.ties + 1 }));
    console.log('Game ended in a tie');
    
    // Check if we need to increment the round (will be handled by the useEffect)
    const nextRound = currentRound + 1;
    console.log(`Moving to round ${nextRound}`);
    setCurrentRound(nextRound);
  };
  
  // Reset the game completely
  const resetGame = (resetMatch = false) => {
    setGameStarted(false);
    setTimerActive(false);
    setTimer(0);
    setLastWinner(null);
    
    if (resetMatch) {
      setScore({ player1: 0, player2: 0, ties: 0 });
      setCurrentRound(1);
      setShowMatchComplete(false);
      setMatchWinner(null);
    }
  };
  
  // Reset the match after completion
  const resetMatch = () => {
    // Reset all game state
    setScore({ player1: 0, player2: 0, ties: 0 });
    setCurrentRound(1);
    setShowMatchComplete(false);
    setMatchWinner(null);
    setTimer(0);
    setGameStarted(false);
    setTimerActive(false);
    
    // Make sure the player starts as Player 1's symbol
    setGameSettings(prev => ({
      ...prev,
      currentPlayer: prev.player1Symbol || 'X'
    }));
    
    // Clear any saved round data
    AsyncStorage.removeItem('roundsData').catch(err => 
      console.error('Failed to clear round data:', err)
    );
  };
  
  // Save single round data to leaderboard
  const saveRoundToLeaderboard = async (player: string, time: number) => {
    try {
      // Get existing rounds data
      const roundsDataStr = await AsyncStorage.getItem('roundsData');
      const roundsData = roundsDataStr ? JSON.parse(roundsDataStr) : [];
      
      // Determine if this is player 1 or player 2 based on the symbol
      const player1Symbol = gameSettings.player1Symbol || 'X';
      const player2Symbol = gameSettings.player2Symbol || 'O';
      const isPlayer1 = player === player1Symbol;
      const playerName = isPlayer1 ? gameSettings.player1Name || 'Player 1' : gameSettings.player2Name || 'Player 2';
      const playerLabel = isPlayer1 ? 'Player 1' : 'Player 2';
      
      // Add new entry
      const newRoundData = {
        player: playerLabel,
        playerName: playerName,
        gridSize: gameSettings.gridSize,
        winLength: gameSettings.winLength,
        time,
        round: currentRound,
        date: new Date().toISOString(),
        symbol: player
      };
      
      roundsData.push(newRoundData);
      console.log(`Round ${currentRound} won by ${playerName} (${player}) in ${time} seconds`);
      
      // Save back to storage
      await AsyncStorage.setItem('roundsData', JSON.stringify(roundsData));
    } catch (error) {
      console.error('Failed to save round data:', error);
    }
  };
  
  // Save match result to leaderboard
  const saveMatchToLeaderboard = async () => {
    if (!gameSettings.enableTimer) return;
    
    try {
      // Get existing leaderboard
      const leaderboardStr = await AsyncStorage.getItem('leaderboard');
      const leaderboard: LeaderboardEntry[] = leaderboardStr ? JSON.parse(leaderboardStr) : [];
      
      const player1Symbol = gameSettings.player1Symbol || 'X';
      const player2Symbol = gameSettings.player2Symbol || 'O';
      
      // Determine winner
      const winner = score.player1 > score.player2 ? player1Symbol : score.player2 > score.player1 ? player2Symbol : null;
      
      // Only save if there's a winner
      if (winner) {
        // Get rounds data
        const roundsDataStr = await AsyncStorage.getItem('roundsData');
        const roundsData = roundsDataStr ? JSON.parse(roundsDataStr) : [];
        
        // Get player name based on symbol
        const isPlayer1 = winner === player1Symbol;
        const playerName = isPlayer1 ? gameSettings.player1Name || 'Player 1' : gameSettings.player2Name || 'Player 2';
        const playerLabel = isPlayer1 ? 'Player 1' : 'Player 2';
        
        // Calculate average time for winning rounds
        const winnerRounds = roundsData.filter((r: any) => 
          r.symbol === winner && r.round <= currentRound
        );
        
        const totalTime = winnerRounds.reduce((sum: number, round: any) => sum + round.time, 0);
        const avgTime = winnerRounds.length > 0 ? totalTime / winnerRounds.length : 0;
        
        // Add new entry
        const newEntry: LeaderboardEntry = {
          player: playerLabel,
          playerName: playerName,
          gridSize: gameSettings.gridSize,
          winLength: gameSettings.winLength,
          time: avgTime,
          date: new Date().toISOString(),
          symbol: winner
        };
        
        console.log('Saving match to leaderboard:', newEntry);
        
        leaderboard.push(newEntry);
        
        // Sort by time (ascending)
        leaderboard.sort((a, b) => a.time - b.time);
        
        // Keep only top 10
        const topEntries = leaderboard.slice(0, 10);
        
        // Save back to storage
        await AsyncStorage.setItem('leaderboard', JSON.stringify(topEntries));
        
        // Clear rounds data
        await AsyncStorage.removeItem('roundsData');
      }
    } catch (error) {
      console.error('Failed to save to leaderboard:', error);
    }
  };
  
  // Update game settings
  const handleUpdateSettings = (newSettings: Partial<GameSettingsType>) => {
    setGameSettings(prev => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });
  };
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Theme-aware colors for UI elements
  const sectionBgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const buttonBgColor = colors.tint;
  const buttonTextColor = isDark ? '#000000' : '#FFFFFF';
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ThemedText type="title" style={styles.title}>Tic Tac Toe</ThemedText>
          
          {gameSettings.maxRounds && (
            <ThemedView style={[styles.roundsContainer, { backgroundColor: sectionBgColor }]}>
              <ThemedText style={styles.roundsText}>
                Round {currentRound} of {gameSettings.maxRounds}
              </ThemedText>
            </ThemedView>
          )}
          
          {gameSettings.enableTimer && (
            <ThemedView style={[styles.timerContainer, { backgroundColor: sectionBgColor }]}>
              <ThemedText style={styles.timerText}>
                Time: {formatTime(timer)}
              </ThemedText>
            </ThemedView>
          )}
          
          <ScoreBoard 
            score={score}
            currentPlayer={gameSettings.currentPlayer}
            lastWinner={lastWinner}
            player1Name={gameSettings.player1Name || 'Player 1'}
            player2Name={gameSettings.player2Name || 'Player 2'}
            player1Symbol={gameSettings.player1Symbol || 'X'}
            player2Symbol={gameSettings.player2Symbol || 'O'}
          />
          
          {showMatchComplete ? (
            <ThemedView style={[styles.matchCompleteContainer, { backgroundColor: sectionBgColor }]}>
              <ThemedText type="title">Match Complete!</ThemedText>
              <ThemedText style={styles.matchResultText}>
                {matchWinner 
                  ? `${matchWinner === gameSettings.player1Symbol 
                      ? (gameSettings.player1Name || 'Player 1') + ` (${gameSettings.player1Symbol})` 
                      : (gameSettings.player2Name || 'Player 2') + ` (${gameSettings.player2Symbol})`} wins the match!`
                  : 'The match ended in a tie!'}
              </ThemedText>
              <ThemedText style={styles.scoreText}>
                {gameSettings.player1Name || 'Player 1'} ({gameSettings.player1Symbol}): {score.player1} - {gameSettings.player2Name || 'Player 2'} ({gameSettings.player2Symbol}): {score.player2}
              </ThemedText>
              <Pressable 
                style={[styles.newMatchButton, { backgroundColor: buttonBgColor }]} 
                onPress={resetMatch}
              >
                <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>New Match</ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            <GameBoard 
              gridSize={gameSettings.gridSize}
              winLength={gameSettings.winLength}
              currentPlayer={gameSettings.currentPlayer}
              onGameWon={handleGameWon}
              onGameTie={handleGameTie}
              onGameStart={handleGameStart}
              onGameReset={resetGame}
              enableSounds={gameSettings.enableSounds}
              player1Name={gameSettings.player1Name || 'Player 1'}
              player2Name={gameSettings.player2Name || 'Player 2'}
              player1Symbol={gameSettings.player1Symbol || 'X'}
              player2Symbol={gameSettings.player2Symbol || 'O'}
              onChangeTurn={(player) => setGameSettings(prev => ({ ...prev, currentPlayer: player }))}
            />
          )}
          
          <GameSettings 
            settings={gameSettings}
            onUpdateSettings={handleUpdateSettings}
          />
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom to account for tab bar
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  roundsContainer: {
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roundsText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  timerContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '500',
  },
  matchCompleteContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 24,
    marginVertical: 20,
  },
  matchResultText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  scoreText: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  newMatchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
}); 