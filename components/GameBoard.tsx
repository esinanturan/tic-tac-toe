import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Canvas, RoundedRect, Line, Circle, Group, Text, vec, Fill } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, withTiming, Easing, withSequence, withDelay, runOnJS } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, 300);

type GameBoardProps = {
  gridSize: number;
  winLength: number;
  currentPlayer: string;
  onGameWon: (winner: string) => void;
  onGameTie: () => void;
  onChangeTurn?: (player: string) => void;
  onGameStart?: () => void;
  onGameReset?: () => void;
  enableSounds?: boolean;
};

type CellValue = 'X' | 'O' | null;

export function GameBoard({ 
  gridSize = 3, 
  winLength = 3, 
  currentPlayer, 
  onGameWon, 
  onGameTie,
  onChangeTurn,
  onGameStart,
  onGameReset,
  enableSounds = false
}: GameBoardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  
  // Game state
  const [board, setBoard] = useState<CellValue[][]>(() => 
    Array(gridSize).fill(null).map(() => Array(gridSize).fill(null))
  );
  const [gameOver, setGameOver] = useState(false);
  const [winningLine, setWinningLine] = useState<number[][]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayerState, setCurrentPlayerState] = useState<CellValue>('X');
  
  // Animation values
  const progress = useSharedValue(0);
  const boardOpacity = useSharedValue(0);
  const cellSize = BOARD_SIZE / gridSize;
  
  // Update local player state when prop changes
  useEffect(() => {
    if (currentPlayer) {
      setCurrentPlayerState(currentPlayer as CellValue);
    }
  }, [currentPlayer]);
  
  // Initialize board when grid size changes
  useEffect(() => {
    resetGameBoard();
  }, [gridSize, winLength]);
  
  // Update Skia values when animation progresses
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [board]);
  
  // Check for a winner
  const checkWinner = (boardState: CellValue[][]) => {
    // Check rows
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j <= gridSize - winLength; j++) {
        const line = [];
        let allSame = true;
        const firstCell = boardState[i][j];
        
        if (firstCell) {
          for (let k = 0; k < winLength; k++) {
            if (boardState[i][j + k] !== firstCell) {
              allSame = false;
              break;
            }
            line.push([i, j + k]);
          }
          
          if (allSame) {
            setWinningLine(line);
            return firstCell;
          }
        }
      }
    }
    
    // Check columns
    for (let i = 0; i <= gridSize - winLength; i++) {
      for (let j = 0; j < gridSize; j++) {
        const line = [];
        let allSame = true;
        const firstCell = boardState[i][j];
        
        if (firstCell) {
          for (let k = 0; k < winLength; k++) {
            if (boardState[i + k][j] !== firstCell) {
              allSame = false;
              break;
            }
            line.push([i + k, j]);
          }
          
          if (allSame) {
            setWinningLine(line);
            return firstCell;
          }
        }
      }
    }
    
    // Check diagonals (top-left to bottom-right)
    for (let i = 0; i <= gridSize - winLength; i++) {
      for (let j = 0; j <= gridSize - winLength; j++) {
        const line = [];
        let allSame = true;
        const firstCell = boardState[i][j];
        
        if (firstCell) {
          for (let k = 0; k < winLength; k++) {
            if (boardState[i + k][j + k] !== firstCell) {
              allSame = false;
              break;
            }
            line.push([i + k, j + k]);
          }
          
          if (allSame) {
            setWinningLine(line);
            return firstCell;
          }
        }
      }
    }
    
    // Check diagonals (top-right to bottom-left)
    for (let i = 0; i <= gridSize - winLength; i++) {
      for (let j = gridSize - 1; j >= winLength - 1; j--) {
        const line = [];
        let allSame = true;
        const firstCell = boardState[i][j];
        
        if (firstCell) {
          for (let k = 0; k < winLength; k++) {
            if (boardState[i + k][j - k] !== firstCell) {
              allSame = false;
              break;
            }
            line.push([i + k, j - k]);
          }
          
          if (allSame) {
            setWinningLine(line);
            return firstCell;
          }
        }
      }
    }
    
    // Check for a tie
    const isBoardFull = boardState.every(row => row.every(cell => cell !== null));
    if (isBoardFull) {
      return 'tie';
    }
    
    return null;
  };
  
  // Handle cell tap
  const handleCellTap = (row: number, col: number) => {
    if (gameOver || board[row][col]) return;
    
    // Start game on first move
    if (!gameStarted) {
      setGameStarted(true);
      if (onGameStart) {
        onGameStart();
      }
    }
    
    const newBoard = [...board.map(row => [...row])];
    newBoard[row][col] = currentPlayerState;
    setBoard(newBoard);
    
    const winner = checkWinner(newBoard);
    if (winner) {
      if (winner === 'tie') {
        onGameTie();
      } else {
        onGameWon(winner);
      }
      setGameOver(true);
      
      // Animate winning line
      progress.value = 0;
      progress.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(200, withTiming(0.5, { duration: 300 })),
        withTiming(1, { duration: 300 }),
      );
    } else {
      // Switch player
      const nextPlayer = currentPlayerState === 'X' ? 'O' : 'X';
      setCurrentPlayerState(nextPlayer);
      if (onChangeTurn) {
        onChangeTurn(nextPlayer);
      }
    }
  };
  
  // Tap gesture handler
  const tapGesture = Gesture.Tap()
    .onStart(({ x, y }) => {
      if (gameOver) return;
      const row = Math.floor(y / cellSize);
      const col = Math.floor(x / cellSize);
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        runOnJS(handleCellTap)(row, col);
      }
    });
  
  // Reset game
  const resetGame = () => {
    resetGameBoard();
    
    // Call parent reset handler if provided
    if (onGameReset) {
      onGameReset();
    }
  };
  
  // Reset the game board state
  const resetGameBoard = () => {
    setBoard(Array(gridSize).fill(null).map(() => Array(gridSize).fill(null)));
    setGameOver(false);
    setWinningLine([]);
    setGameStarted(false);
    setCurrentPlayerState('X');
    
    // Animate board resetting
    boardOpacity.value = 0;
    boardOpacity.value = withTiming(1, { duration: 500 });
    
    // Reset progress animation
    progress.value = 0;
    progress.value = withTiming(1, { duration: 800 });
  };
  
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.boardContainer, 
          { 
            width: BOARD_SIZE, 
            height: BOARD_SIZE,
            opacity: boardOpacity 
          }
        ]}
      >
        <GestureDetector gesture={tapGesture}>
          <Canvas style={{ flex: 1 }}>
            {/* Background */}
            <Fill color={isDark ? '#1c1c1e' : '#f2f2f7'} />
            
            {/* Grid lines */}
            {Array(gridSize - 1).fill(0).map((_, i) => (
              <React.Fragment key={`h-${i}`}>
                <Line
                  p1={vec(0, (i + 1) * cellSize)}
                  p2={vec(BOARD_SIZE, (i + 1) * cellSize)}
                  color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                  style="stroke"
                  strokeWidth={2}
                />
                <Line
                  p1={vec((i + 1) * cellSize, 0)}
                  p2={vec((i + 1) * cellSize, BOARD_SIZE)}
                  color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                  style="stroke"
                  strokeWidth={2}
                />
              </React.Fragment>
            ))}
            
            {/* X and O markers */}
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                if (cell === 'X') {
                  // X marker
                  const padding = cellSize * 0.2;
                  return (
                    <Group key={`${rowIndex}-${colIndex}`} transform={[{ translateX: colIndex * cellSize }, { translateY: rowIndex * cellSize }]}>
                      <Line
                        p1={vec(padding, padding)}
                        p2={vec(cellSize - padding, cellSize - padding)}
                        color={colors.tint}
                        style="stroke"
                        strokeWidth={4}
                        strokeCap="round"
                      />
                      <Line
                        p1={vec(cellSize - padding, padding)}
                        p2={vec(padding, cellSize - padding)}
                        color={colors.tint}
                        style="stroke"
                        strokeWidth={4}
                        strokeCap="round"
                      />
                    </Group>
                  );
                } else if (cell === 'O') {
                  // O marker
                  const center = cellSize / 2;
                  const radius = cellSize * 0.3;
                  return (
                    <Group key={`${rowIndex}-${colIndex}`} transform={[{ translateX: colIndex * cellSize }, { translateY: rowIndex * cellSize }]}>
                      <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        color="#FF9500"
                        style="stroke"
                        strokeWidth={4}
                      />
                    </Group>
                  );
                }
                return null;
              })
            )}
            
            {/* Winning line */}
            {winningLine.length > 0 && (
              <Line
                p1={vec(
                  winningLine[0][1] * cellSize + cellSize / 2,
                  winningLine[0][0] * cellSize + cellSize / 2
                )}
                p2={vec(
                  winningLine[winningLine.length - 1][1] * cellSize + cellSize / 2,
                  winningLine[winningLine.length - 1][0] * cellSize + cellSize / 2
                )}
                color={board[winningLine[0][0]][winningLine[0][1]] === 'X' ? colors.tint : '#FF9500'}
                style="stroke"
                strokeWidth={4}
                strokeCap="round"
                opacity={progress}
              />
            )}
          </Canvas>
        </GestureDetector>
      </Animated.View>
      
      {gameOver && (
        <Animated.View style={styles.gameOverContainer}>
          <ThemedText type="subtitle">
            {winningLine.length > 0 
              ? `Player ${board[winningLine[0][0]][winningLine[0][1]]} wins!` 
              : "It's a tie!"}
          </ThemedText>
          <Animated.View 
            style={styles.resetButton}
            onTouchEnd={resetGame}
          >
            <ThemedText>Play Again</ThemedText>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  boardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gameOverContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderRadius: 12,
  },
  resetButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
}); 