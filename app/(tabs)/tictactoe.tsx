import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { GameBoard } from '@/components/GameBoard';
import { ScoreBoard } from '@/components/ScoreBoard';
import { GameSettings } from '@/components/GameSettings';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

type GameSettingsType = {
  gridSize: number;
  winLength: number;
  currentPlayer: string;
  gameMode: string;
  enableTimer?: boolean;
  enableSounds?: boolean;
  playerName?: string;
};

type ScoreType = {
  player1: number;
  player2: number;
  ties: number;
};

export default function TicTacToeScreen() {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState<ScoreType>({ player1: 0, player2: 0, ties: 0 });
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [lastWinner, setLastWinner] = useState<string | null>(null);
  
  // Settings state
  const [gameSettings, setGameSettings] = useState<GameSettingsType>({
    gridSize: 3,
    winLength: 3,
    currentPlayer: 'X',
    gameMode: 'local',
    enableTimer: true,
    enableSounds: true,
    playerName: '',
  });
  
  // Previous settings for comparison
  const [previousSettings, setPreviousSettings] = useState<GameSettingsType | null>(null);
  
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
            savedSettings.winLength !== previousSettings.winLength;
            
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
      'Grid size or win conditions have changed. Would you like to reset the current game and apply the new settings?',
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
            resetGame();
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
    
    // Update score
    setScore(prev => {
      const newScore = { ...prev };
      if (winner === 'X') {
        newScore.player1 += 1;
      } else if (winner === 'O') {
        newScore.player2 += 1;
      }
      return newScore;
    });
    
    // Save the winning time to leaderboard
    if (gameSettings.enableTimer) {
      saveToLeaderboard(winner, timer);
    }
  };
  
  // Handle game tie event
  const handleGameTie = () => {
    setTimerActive(false);
    setScore(prev => ({ ...prev, ties: prev.ties + 1 }));
  };
  
  // Reset the game completely
  const resetGame = () => {
    setGameStarted(false);
    setTimerActive(false);
    setTimer(0);
    setLastWinner(null);
  };
  
  // Save winning time to leaderboard
  const saveToLeaderboard = async (player: string, time: number) => {
    try {
      // Get existing leaderboard
      const leaderboardStr = await AsyncStorage.getItem('leaderboard');
      const leaderboard = leaderboardStr ? JSON.parse(leaderboardStr) : [];
      
      // Add new entry
      leaderboard.push({
        player: player === 'X' ? 'Player 1' : 'Player 2',
        gridSize: gameSettings.gridSize,
        winLength: gameSettings.winLength,
        time,
        date: new Date().toISOString(),
      });
      
      // Sort by time (ascending)
      leaderboard.sort((a: any, b: any) => a.time - b.time);
      
      // Keep only top 10
      const topEntries = leaderboard.slice(0, 10);
      
      // Save back to storage
      await AsyncStorage.setItem('leaderboard', JSON.stringify(topEntries));
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
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText type="title" style={styles.title}>Tic Tac Toe</ThemedText>
        
        {gameSettings.enableTimer && (
          <ThemedView style={styles.timerContainer}>
            <ThemedText style={styles.timerText}>
              Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </ThemedText>
          </ThemedView>
        )}
        
        <ScoreBoard 
          score={score}
          currentPlayer={gameSettings.currentPlayer}
          lastWinner={lastWinner}
        />
        
        <GameBoard 
          gridSize={gameSettings.gridSize}
          winLength={gameSettings.winLength}
          currentPlayer={gameSettings.currentPlayer}
          onGameWon={handleGameWon}
          onGameTie={handleGameTie}
          onGameStart={handleGameStart}
          onGameReset={resetGame}
          enableSounds={gameSettings.enableSounds}
        />
        
        <GameSettings 
          settings={gameSettings}
          onUpdateSettings={handleUpdateSettings}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 16,
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
}); 