import { Redirect } from 'expo-router';

export default function TabsIndex() {
  // Redirect to the tic-tac-toe game as the default tab
  return <Redirect href="/(tabs)/tictactoe" />;
} 