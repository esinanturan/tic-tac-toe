import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Canvas, RoundedRect, Line, Circle, Group, Text, vec, Fill } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  withTiming, 
  Easing, 
  withSequence, 
  withDelay, 
  runOnJS,
  useAnimatedStyle,
  withSpring,
  FadeIn
} from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, 300);

type CellValue = 'X' | 'O' | string | null;

type GameBoardProps = {
  gridSize: number;
  winLength: number;
  currentPlayer: string;
  onGameWon: (winner: string) => void;
  onGameTie: () => void;
  onChangeTurn?: (player: string) => void;
  onGameStart?: () => void;
  onGameReset?: (resetMatch?: boolean) => void;
  enableSounds?: boolean;
  player1Name?: string;
  player2Name?: string;
  player1Symbol?: string;
  player2Symbol?: string;
};

export function GameBoard({ 
  gridSize = 3, 
  winLength = 3, 
  currentPlayer, 
  onGameWon, 
  onGameTie,
  onChangeTurn,
  onGameStart,
  onGameReset,
  enableSounds = false,
  player1Name = 'Player 1',
  player2Name = 'Player 2',
  player1Symbol = 'X',
  player2Symbol = 'O'
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
  const [currentPlayerState, setCurrentPlayerState] = useState<CellValue>(player1Symbol);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  
  // Animation values
  const progress = useSharedValue(0);
  const boardOpacity = useSharedValue(1);
  const cellSize = BOARD_SIZE / gridSize;
  const boardScale = useSharedValue(1);
  const cellHighlight = useSharedValue(0);
  
  // Board shake animation
  const boardShakeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: boardScale.value === undefined || boardScale.value === null ? 1 : boardScale.value }, // Ensure the scale is always a number
      ]
    };
  });
  
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
    
    // Animate the board
    if (lastMove) {
      // Pulse animation when a move is made - ensure scale values are numbers
      boardScale.value = withSequence(
        withTiming(1.03, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 150, easing: Easing.in(Easing.quad) })
      );
      
      // Highlight animation
      cellHighlight.value = withSequence(
        withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
        withDelay(300, withTiming(0, { duration: 600 }))
      );
    }
  }, [board, lastMove]);
  
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
    setLastMove([row, col]);
    
    const winner = checkWinner(newBoard);
    if (winner) {
      if (winner === 'tie') {
        onGameTie();
      } else {
        onGameWon(winner);
        
        // Celebrate animation for winning - ensure it's a numerical value
        boardScale.value = 1; // Reset first
        setTimeout(() => {
          boardScale.value = withTiming(1.05, { duration: 300 });
          setTimeout(() => {
            boardScale.value = withTiming(1, { duration: 300 });
          }, 300);
        }, 0);
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
      const nextPlayer = currentPlayerState === player1Symbol ? player2Symbol : player1Symbol;
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
    // Fully reset the game board state
    resetGameBoard();
    
    // Reset game state completely
    setGameOver(false);
    setLastMove(null);
    setWinningLine([]);
    setCurrentPlayerState(player1Symbol);
    setGameStarted(false);
    
    // Ensure animations are reset
    boardScale.value = 1;
    boardOpacity.value = 1;
    progress.value = 0;
    
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
    setCurrentPlayerState(player1Symbol);
    setLastMove(null);
    
    // Safe animation handling with numerical values
    boardScale.value = 1; // Reset scale to ensure a number
    boardOpacity.value = 0;
    boardOpacity.value = withTiming(1, { duration: 500 });
    
    // Reset progress animation
    progress.value = 0;
    progress.value = withTiming(1, { duration: 800 });
    
    // Board appear animation - simplify to avoid potential issues
    setTimeout(() => {
      boardScale.value = withTiming(1.05, { duration: 300 });
      setTimeout(() => {
        boardScale.value = withTiming(1, { duration: 300 });
      }, 300);
    }, 0);
  };
  
  // Get colors for game elements based on theme
  const gridLineColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const boardBackgroundColor = isDark ? colors.background : '#f2f2f7';
  const xColor = colors.tint;
  const oColor = isDark ? '#FF9C41' : '#FF9500'; // Slightly adjusted for dark mode
  const gameOverOverlayColor = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.7)';
  const playAgainButtonColor = colors.tint;
  const playAgainTextColor = isDark ? '#000000' : '#FFFFFF'; // Black text on blue in dark mode
  
  // Function to draw a cell's symbol
  const renderCellSymbol = (cell: CellValue, rowIndex: number, colIndex: number) => {
    if (!cell) return null;
    
    const isLastMove = lastMove && lastMove[0] === rowIndex && lastMove[1] === colIndex;
    const isPlayer1 = cell === player1Symbol;
    
    if (isPlayer1 || cell === 'X') {
      // X marker (default)
      if (cell === 'X') {
        const padding = cellSize * 0.2;
        return (
          <Group 
            key={`${rowIndex}-${colIndex}`} 
            transform={[
              { translateX: colIndex * cellSize }, 
              { translateY: rowIndex * cellSize }
            ]}
          >
            <Line
              p1={vec(padding, padding)}
              p2={vec(cellSize - padding, cellSize - padding)}
              color={xColor}
              style="stroke"
              strokeWidth={4}
              strokeCap="round"
              opacity={isLastMove ? progress : 1}
            />
            <Line
              p1={vec(cellSize - padding, padding)}
              p2={vec(padding, cellSize - padding)}
              color={xColor}
              style="stroke"
              strokeWidth={4}
              strokeCap="round"
              opacity={isLastMove ? progress : 1}
            />
          </Group>
        );
      }
      
      // For custom emoji symbols, we draw a circle with the player color
      // and the actual emoji will be rendered in overlay
      return (
        <Group 
          key={`${rowIndex}-${colIndex}`} 
          transform={[
            { translateX: colIndex * cellSize }, 
            { translateY: rowIndex * cellSize }
          ]}
        >
          <Circle
            cx={cellSize / 2}
            cy={cellSize / 2}
            r={cellSize * 0.38} // Slightly larger background
            color={isDark ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.15)'} // Semi-transparent
            style="fill"
            opacity={isLastMove ? progress : 1}
          />
          <Circle
            cx={cellSize / 2}
            cy={cellSize / 2}
            r={cellSize * 0.38}
            color={xColor}
            style="stroke"
            strokeWidth={2.5}
            opacity={isLastMove ? progress : 1}
          />
        </Group>
      );
    } else {
      // O marker (default)
      if (cell === 'O') {
        const center = cellSize / 2;
        const radius = cellSize * 0.3;
        return (
          <Group 
            key={`${rowIndex}-${colIndex}`} 
            transform={[
              { translateX: colIndex * cellSize }, 
              { translateY: rowIndex * cellSize }
            ]}
          >
            <Circle
              cx={center}
              cy={center}
              r={radius}
              color={oColor}
              style="stroke"
              strokeWidth={4}
              opacity={isLastMove ? progress : 1}
            />
          </Group>
        );
      }
      
      // For custom emoji symbols, we draw a circle with the player color
      // and the actual emoji will be rendered in overlay
      return (
        <Group 
          key={`${rowIndex}-${colIndex}`} 
          transform={[
            { translateX: colIndex * cellSize }, 
            { translateY: rowIndex * cellSize }
          ]}
        >
          <Circle
            cx={cellSize / 2}
            cy={cellSize / 2}
            r={cellSize * 0.38} // Slightly larger background
            color={isDark ? 'rgba(255, 156, 65, 0.2)' : 'rgba(255, 149, 0, 0.15)'} // Semi-transparent
            style="fill"
            opacity={isLastMove ? progress : 1}
          />
          <Circle
            cx={cellSize / 2}
            cy={cellSize / 2}
            r={cellSize * 0.38}
            color={oColor}
            style="stroke"
            strokeWidth={2.5}
            opacity={isLastMove ? progress : 1}
          />
        </Group>
      );
    }
  };
  
  // Override canvas rendering with React Native Text for custom symbols
  useEffect(() => {
    // Function to update cell text overlays
    const updateCellOverlays = () => {
      if (!board) return; // Safety check
      
      const overlays = [];
      
      // Find all cells that have custom emoji symbols
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const cellValue = board[i] && board[i][j];
          if (cellValue && cellValue !== 'X' && cellValue !== 'O') {
            // Add overlay for custom symbol
            overlays.push({
              row: i,
              col: j,
              value: cellValue,
              isPlayer1: cellValue === player1Symbol
            });
          }
        }
      }
      
      // Update state to trigger rerender with overlays
      setCellOverlays(overlays);
    };
    
    updateCellOverlays();
  }, [board, player1Symbol, player2Symbol, gridSize]);
  
  // State for cell text overlays
  const [cellOverlays, setCellOverlays] = useState<Array<{row: number, col: number, value: string, isPlayer1: boolean}>>([]);
  
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.boardContainer, 
          { 
            width: BOARD_SIZE, 
            height: BOARD_SIZE,
            opacity: boardOpacity,
            backgroundColor: boardBackgroundColor 
          },
          boardShakeStyle
        ]}
      >
        <GestureDetector gesture={tapGesture}>
          <Canvas style={{ flex: 1 }}>
            {/* Background */}
            <Fill color={boardBackgroundColor} />
            
            {/* Grid lines */}
            {Array(gridSize - 1).fill(0).map((_, i) => (
              <React.Fragment key={`h-${i}`}>
                <Line
                  p1={vec(0, (i + 1) * cellSize)}
                  p2={vec(BOARD_SIZE, (i + 1) * cellSize)}
                  color={gridLineColor}
                  style="stroke"
                  strokeWidth={2}
                />
                <Line
                  p1={vec((i + 1) * cellSize, 0)}
                  p2={vec((i + 1) * cellSize, BOARD_SIZE)}
                  color={gridLineColor}
                  style="stroke"
                  strokeWidth={2}
                />
              </React.Fragment>
            ))}
            
            {/* Highlight for last move */}
            {lastMove && (
              <RoundedRect
                x={lastMove[1] * cellSize + 2}
                y={lastMove[0] * cellSize + 2}
                width={cellSize - 4}
                height={cellSize - 4}
                r={8}
                color={
                  board[lastMove[0]][lastMove[1]] === player1Symbol 
                    ? `rgba(${isDark ? '0, 122, 255' : '0, 122, 255'}, 0.15)` 
                    : `rgba(${isDark ? '255, 156, 65' : '255, 149, 0'}, 0.15)`
                }
                opacity={cellHighlight}
              />
            )}
            
            {/* Cell symbols */}
            {board && board.map((row, rowIndex) =>
              row && row.map((cell, colIndex) => {
                if (cell) {
                  return renderCellSymbol(cell, rowIndex, colIndex);
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
                color={board[winningLine[0][0]][winningLine[0][1]] === player1Symbol ? xColor : oColor}
                style="stroke"
                strokeWidth={4}
                strokeCap="round"
                opacity={progress}
              />
            )}
          </Canvas>
        </GestureDetector>
        
        {/* Text overlays for custom symbols - only show when game is not over */}
        {!gameOver && cellOverlays.map((overlay) => (
          <View
            key={`overlay-container-${overlay.row}-${overlay.col}`}
            style={{
              position: 'absolute',
              top: overlay.row * cellSize,
              left: overlay.col * cellSize,
              width: cellSize,
              height: cellSize,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10
            }}
          >
            <Animated.Text
              style={[
                {
                  fontSize: cellSize * 0.6,
                  fontWeight: 'bold',
                  color: isDark ? '#FFFFFF' : '#000000',
                  textAlign: 'center',
                  opacity: lastMove && lastMove[0] === overlay.row && lastMove[1] === overlay.col 
                    ? (progress as any) : 1,
                }
              ]}
            >
              {overlay.value}
            </Animated.Text>
          </View>
        ))}
      </Animated.View>
      
      {/* Game over overlay - rendered separately to ensure it's always on top */}
      {gameOver && (
        <Animated.View 
          style={[
            styles.gameOverContainer,
            { 
              backgroundColor: gameOverOverlayColor,
              width: BOARD_SIZE,
              height: BOARD_SIZE,
              position: 'absolute',
              top: 10, // Match padding of container
              zIndex: 100 // Ensure this is higher than any other element
            }
          ]}
          entering={FadeIn.duration(300)}
        >
          <ThemedText type="subtitle" style={{ color: '#FFFFFF' }}>
            {winningLine.length > 0 
              ? `${board[winningLine[0][0]][winningLine[0][1]] === player1Symbol ? player1Name : player2Name} (${board[winningLine[0][0]][winningLine[0][1]]}) wins!` 
              : "It's a tie!"}
          </ThemedText>
          <Animated.View 
            style={[
              styles.resetButton, 
              { backgroundColor: playAgainButtonColor }
            ]}
            onTouchEnd={resetGame}
          >
            <ThemedText style={[styles.buttonText, { color: playAgainTextColor }]}>Play Again</ThemedText>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 20, // Ensure this is higher than any other element
  },
  resetButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  }
}); 