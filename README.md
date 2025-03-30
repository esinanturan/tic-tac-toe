# Advanced Tic-Tac-Toe App

A modern, feature-rich Tic-Tac-Toe game built with React Native and Expo, featuring animated gameplay, customizable settings, and a leaderboard system.

## Features

- **Customizable Game Settings**:
  - Adjustable grid size (3x3, 4x4, 5x5, 6x6)
  - Configurable win length (3, 4, 5 in a row)
  - Multi-round matches with adjustable number of rounds
  - Custom player names

- **Custom Player Symbols**:
  - Choose between classic X/O or fun emoji symbols (😀, 😎, 🚀, ⭐, 🔥, etc.)
  - Visual indicators for current player turn

- **Beautiful Animations**:
  - Animated game board with smooth piece placement
  - Highlighted winning lines
  - Transition effects between rounds
  - Reactive interface elements

- **Game Statistics**:
  - Timer tracking for each round
  - Match completion tracking
  - Tie game detection

- **Leaderboard System**:
  - Records fastest win times
  - Stores player names and symbols
  - Sortable by time
  - Persistent storage between sessions

- **Responsive Design**:
  - Adapts to different screen sizes
  - Supports both portrait and landscape orientations
  - Dark and light mode support

## Technologies Used

- **React Native**: Core framework for cross-platform mobile development
- **Expo**: Development platform for building and deploying React Native apps
- **React Native Reanimated**: Advanced animations library
- **React Native Skia**: High-performance 2D graphics rendering
- **Expo Router**: File-based routing system
- **React Native Gesture Handler**: Touch and gesture handling
- **AsyncStorage**: Local data persistence
- **TypeScript**: Type-safe JavaScript for improved development experience

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tick-tack-toe-app.git
cd tick-tack-toe-app
```

2. Install dependencies:
```bash
npm install
```

3. Install Expo CLI globally (if not already installed):
```bash
npm install -g expo-cli
```

## Running the Project

1. Start the development server:
```bash
npm start
```
or
```bash
expo start
```

2. Run on a device or emulator:
   - Scan the QR code with the Expo Go app (Android) or Camera app (iOS)
   - Press `a` to open on Android emulator
   - Press `i` to open on iOS simulator
   - Press `w` to open in a web browser

## Game Instructions

1. **Start a New Game**:
   - Choose your settings in the Settings tab
   - Navigate to the Game tab to start playing

2. **Gameplay**:
   - Players take turns placing their symbols on the board
   - First player to get the configured number in a row (horizontally, vertically, or diagonally) wins the round
   - Win enough rounds to win the match

3. **Viewing Leaderboard**:
   - Navigate to the Leaderboard tab to view fastest win times
   - Leaderboard entries show player name, symbol, grid size, and time

## Development Commands

- `npm run restart`: Restart the development server
- `npm run ios`: Run on iOS simulator
- `npm run android`: Run on Android emulator
- `npm run web`: Run in web browser
- `npm run eject`: Eject from Expo (advanced)

## Project Structure

```
tick-tack-toe-app/
├── app/               # Main application screens
│   ├── (tabs)/        # Tab-based navigation screens
│   ├── _layout.tsx    # App layout configuration
├── components/        # Reusable UI components
│   ├── GameBoard.tsx  # Tic-tac-toe board component
│   ├── ScoreBoard.tsx # Score display component
│   └── ...
├── constants/         # App constants and themes
├── hooks/             # Custom React hooks
└── assets/            # Images, fonts, etc.
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by classic tic-tac-toe games
- Built with modern React Native techniques
