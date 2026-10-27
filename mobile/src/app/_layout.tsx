import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useReducedMotion } from '../features/cards/useReducedMotion';
import { colors } from '../ui/theme';
import { SessionProvider } from '../session/SessionProvider';

export default function RootLayout(): React.JSX.Element {
  const reduced = useReducedMotion();
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
          <Stack.Screen name="card/[id]" options={{ animation: reduced === false ? 'fade' : 'none', animationDuration: 260, gestureEnabled: false }} />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
