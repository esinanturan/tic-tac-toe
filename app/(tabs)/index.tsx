import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, Alert, Text, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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

// Create a simplified preview component for the game tab
function GameSettingsPreview({ settings }: { settings: GameSettingsType }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  
  // Theme-aware colors
  const sectionBgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const sectionHeaderColor = isDark ? 'rgba(255,255,255,0.9)' : colors.text;
  
  return (
    <ThemedView style={[styles.previewContainer, { backgroundColor: sectionBgColor }]}>
      <ThemedText type="subtitle" style={{ color: sectionHeaderColor }}>
        {t('settings.title')}
      </ThemedText>
      
      {/* Grid size and win length - now in a column for better handling of long texts */}
      <View style={styles.previewGrid}>
        <View style={styles.previewGridItem}>
          <ThemedText style={styles.previewLabel}>
            {t('settings.gridSizeLabel')}:
          </ThemedText>
          <ThemedText style={styles.previewValue}>
            {`${settings.gridSize}x${settings.gridSize}`}
          </ThemedText>
        </View>
        
        <View style={styles.previewGridItem}>
          <ThemedText style={styles.previewLabel}>
            {t('settings.winLengthLabel')}:
          </ThemedText>
          <ThemedText style={styles.previewValue}>
            {settings.winLength}
          </ThemedText>
        </View>
      </View>
      
      {/* Rounds and timer settings */}
      <View style={styles.previewGrid}>
        <View style={styles.previewGridItem}>
          <ThemedText style={styles.previewLabel}>
            {t('settings.roundsLabel')}:
          </ThemedText>
          <ThemedText style={styles.previewValue}>
            {settings.maxRounds}
          </ThemedText>
        </View>
        
        <View style={styles.previewGridItem}>
          <ThemedText style={styles.previewLabel}>
            {t('settings.timerLabel')}:
          </ThemedText>
          <ThemedText style={styles.previewValue}>
            {settings.enableTimer ? t('settings.on') : t('settings.off')}
          </ThemedText>
        </View>
      </View>
      
      <ThemedText style={styles.previewHint}>
        {t('settings.hint')}
      </ThemedText>
    </ThemedView>
  );
}

export default function GameScreen() {
  const { t } = useTranslation();
  
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
    
    // We only need to handle the case when the max rounds are reached without a player having enough wins
    // The handleGameWon function will handle the case when a player wins
    if (currentRound > maxRounds && !showMatchComplete) {
      // Match is complete, determine winner based on score
      console.log(`Max rounds reached (${maxRounds}). Ending match based on scores.`);
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
  }, [currentRound, score, gameSettings, showMatchComplete]);
  
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
      t('app.title'),
      t('settings.hint'),
      [
        {
          text: t('game.keepPlaying'),
          style: 'cancel',
          onPress: () => {
            // Keep playing with current settings
            console.log('Continue playing with current settings');
          }
        },
        {
          text: t('game.resetGame'),
          style: 'destructive',
          onPress: () => {
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
  
  // Handle when a game is won
  const handleGameWon = (winner: string) => {
    console.log(`Game won by ${winner}`);
    
    // Update the score
    let updatedScore = {...score};
    if (winner === (gameSettings.player1Symbol || 'X')) {
      updatedScore = {
        ...score,
        player1: score.player1 + 1
      };
      setScore(updatedScore);
      console.log(`Player 1 (${gameSettings.player1Symbol || 'X'}) scored a point. New score: ${updatedScore.player1}`);
    } else {
      updatedScore = {
        ...score,
        player2: score.player2 + 1
      };
      setScore(updatedScore);
      console.log(`Player 2 (${gameSettings.player2Symbol || 'O'}) scored a point. New score: ${updatedScore.player2}`);
    }
    
    // Update last winner
    setLastWinner(winner);
    
    // Save round data
    if (gameSettings.enableTimer) {
      saveRoundToLeaderboard(winner, timer);
    }
    
    // Increment round counter (after a slight delay)
    setTimeout(() => {
      // Only increment the round if we haven't reached the max rounds
      // or if neither player has won enough rounds yet
      const maxRounds = gameSettings.maxRounds || 5;
      const roundsNeededToWin = Math.ceil(maxRounds / 2);
      
      const player1HasEnoughWins = updatedScore.player1 >= roundsNeededToWin;
      const player2HasEnoughWins = updatedScore.player2 >= roundsNeededToWin;
      const hasReachedMaxRounds = currentRound >= maxRounds;
      
      // Check if we should end the match
      if (player1HasEnoughWins) {
        console.log(`Player 1 has ${updatedScore.player1} wins - enough to win the match!`);
        setShowMatchComplete(true);
        setMatchWinner(gameSettings.player1Symbol || 'X');
        saveMatchToLeaderboard();
        return;
      } else if (player2HasEnoughWins) {
        console.log(`Player 2 has ${updatedScore.player2} wins - enough to win the match!`);
        setShowMatchComplete(true);
        setMatchWinner(gameSettings.player2Symbol || 'O');
        saveMatchToLeaderboard();
        return;
      }
      
      if (!hasReachedMaxRounds) {
        console.log(`Moving to round ${currentRound + 1}`);
        setCurrentRound(prev => prev + 1);
      } else {
        // End the match because max rounds reached
        console.log(`Max rounds (${maxRounds}) reached. Ending match.`);
        setShowMatchComplete(true);
        
        if (updatedScore.player1 > updatedScore.player2) {
          setMatchWinner(gameSettings.player1Symbol || 'X');
        } else if (updatedScore.player2 > updatedScore.player1) {
          setMatchWinner(gameSettings.player2Symbol || 'O');
        } else {
          setMatchWinner(null); // Tie
        }
        
        saveMatchToLeaderboard();
      }
    }, 800);
    
    // Stop the timer
    setTimerActive(false);
  };
  
  // Handle game tie
  const handleGameTie = () => {
    console.log("Game ended in a tie");
    
    // Update score with the tie
    const updatedScore = {
      ...score,
      ties: score.ties + 1
    };
    setScore(updatedScore);
    
    // Set last winner to null for a tie
    setLastWinner(null);
    
    // Stop the timer
    setTimerActive(false);
    
    // Increment round counter (after a slight delay)
    setTimeout(() => {
      const maxRounds = gameSettings.maxRounds || 5;
      const hasReachedMaxRounds = currentRound >= maxRounds;
      
      if (!hasReachedMaxRounds) {
        console.log(`Moving to round ${currentRound + 1} after tie`);
        setCurrentRound(prev => prev + 1);
      } else {
        // End the match because max rounds reached
        console.log(`Max rounds (${maxRounds}) reached after tie. Ending match.`);
        setShowMatchComplete(true);
        
        if (updatedScore.player1 > updatedScore.player2) {
          setMatchWinner(gameSettings.player1Symbol || 'X');
        } else if (updatedScore.player2 > updatedScore.player1) {
          setMatchWinner(gameSettings.player2Symbol || 'O');
        } else {
          setMatchWinner(null); // Tie
        }
        
        saveMatchToLeaderboard();
      }
    }, 800);
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
          <ThemedText type="title" style={styles.title}>
            {t('app.title')}
          </ThemedText>
          
          {/* Combined round counter and timer in a row */}
          <ThemedView style={[styles.gameInfoContainer, { backgroundColor: sectionBgColor }]}>
            {gameSettings.maxRounds && (
              <View style={styles.gameInfoItem}>
                <ThemedText style={styles.gameInfoText}>
                  {t('game.round', { current: currentRound, total: gameSettings.maxRounds })}
                </ThemedText>
              </View>
            )}
            
            {gameSettings.enableTimer && (
              <View style={styles.gameInfoItem}>
                <ThemedText style={styles.gameInfoText}>
                  {t('game.time', { time: formatTime(timer) })}
                </ThemedText>
              </View>
            )}
          </ThemedView>
          
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
              <ThemedText type="title">{t('matchComplete.title')}</ThemedText>
              <ThemedText style={styles.matchResultText}>
                {matchWinner 
                  ? t('matchComplete.playerWins', {
                      player: matchWinner === gameSettings.player1Symbol ? gameSettings.player1Name || t('game.player1') : gameSettings.player2Name || t('game.player2'),
                      symbol: matchWinner
                    })
                  : t('matchComplete.tie')
                }
              </ThemedText>
              <ThemedText style={styles.scoreText}>
                {t('matchComplete.finalScore', {
                  player1: gameSettings.player1Name || t('game.player1'),
                  symbol1: gameSettings.player1Symbol,
                  score1: score.player1,
                  player2: gameSettings.player2Name || t('game.player2'),
                  symbol2: gameSettings.player2Symbol,
                  score2: score.player2
                })}
              </ThemedText>
              
              <Pressable 
                style={[styles.matchCompleteButton, { backgroundColor: colors.tint }]}
                onPress={resetMatch}
              >
                <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
                  {t('matchComplete.newMatch')}
                </ThemedText>
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
          
          <GameSettingsPreview settings={gameSettings} />
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
  gameInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
  },
  gameInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  gameInfoText: {
    fontSize: 16,
    fontWeight: '600',
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
  previewContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    flexWrap: 'wrap',
  },
  previewGridItem: {
    flex: 1,
    minWidth: '48%',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  previewLabel: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewHint: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
    fontSize: 12,
  },
  matchCompleteButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
}); 