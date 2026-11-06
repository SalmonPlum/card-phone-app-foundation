import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useReducedMotion } from '../features/cards/useReducedMotion';
import { ThemeProvider, useThemeSettings } from '../themes/ThemeProvider';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { RevealModeProvider } from '../settings/RevealModeProvider';
import { SessionProvider } from '../session/SessionProvider';
import { ThemeFontGate } from '../themes/ThemeFontGate';

export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <RevealModeProvider>
            <ThemeFontGate>
              <SessionProvider>
                <ThemedNavigation />
              </SessionProvider>
            </ThemeFontGate>
          </RevealModeProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedNavigation() {
  const { theme } = useThemeSettings();
  const reduced = useReducedMotion();
  return <>
    <StatusBar style={theme.appearance === 'dark' ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.canvas } }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="card/[id]" options={{ animation: reduced === false ? 'fade' : 'none', animationDuration: 260, gestureEnabled: false }} />
    </Stack>
  </>;
}
