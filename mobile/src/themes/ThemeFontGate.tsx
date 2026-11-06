import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/locale';
import { loadThemeFonts } from '../platform/themeFonts';
import { useThemeSettings } from './ThemeProvider';
import catalog from './fontCatalog.json';
import { resolveThemeTypography, type ThemeTypography } from './typography';

const FontsAvailable = createContext(false);
const fallback = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
};

export function useThemeTypography(): ThemeTypography {
  const { theme } = useThemeSettings();
  const available = useContext(FontsAvailable);
  return useMemo(() => resolveThemeTypography(theme, catalog.fonts, available, fallback), [theme, available]);
}

/** A startup-only gate; font completion never replaces metrics under an active session. */
export function ThemeFontGate({ children, loadFonts = loadThemeFonts }: { children: ReactNode; loadFonts?: () => Promise<void> }) {
  const { theme, ready, retryThemeRestore, keepCurrentTheme } = useThemeSettings(), locale = useLocale();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed' | 'fallback'>('loading');
  const [startedAt, setStartedAt] = useState(() => Date.now());
  useEffect(() => {
    let active = true;
    const finish = (next: 'loaded' | 'failed') => {
      if (active) setStatus(current => current === 'loading' ? next : current);
    };
    void Promise.resolve().then(loadFonts).then(() => finish('loaded'), () => finish('failed'));
    return () => { active = false; };
  }, [attempt, loadFonts]);
  useEffect(() => {
    if (status !== 'loading' && !(status === 'loaded' && !ready)) return;
    // One deadline covers both font loading and persisted-theme restoration.
    const timer = setTimeout(() => setStatus('failed'), Math.max(0, 15000 - (Date.now() - startedAt)));
    return () => clearTimeout(timer);
  }, [ready, status, startedAt]);
  const retry = () => {
    if (!ready) retryThemeRestore();
    setStatus('loading'); setStartedAt(Date.now()); setAttempt(value => value + 1);
  };
  const continueWithFallback = () => { keepCurrentTheme(); setStatus('fallback'); };
  if ((status === 'loaded' && ready) || status === 'fallback') {
    return <FontsAvailable.Provider value={status === 'loaded'}>{children}</FontsAvailable.Provider>;
  }
  const colors = theme.colors;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', padding: 24 }}>
    <View style={{ gap: 16 }}>
      {status === 'failed' ? <>
        <Text accessibilityRole="alert" style={{ color: colors.text, fontSize: 18, lineHeight: 28 }}>{t('fontLoadError', locale)}</Text>
        <Pressable accessibilityRole="button" onPress={retry}
          style={{ minHeight: 48, padding: 16, borderRadius: 24, backgroundColor: colors.primary }}>
          <Text style={{ color: colors.onPrimary, fontSize: 16 }}>{t('retry', locale)}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={continueWithFallback}
          style={{ minHeight: 48, padding: 16, borderRadius: 24, backgroundColor: colors.surface }}>
          <Text style={{ color: colors.text, fontSize: 16 }}>{t('useSystemFonts', locale)}</Text>
        </Pressable>
      </> : <Text accessibilityRole="progressbar" style={{ color: colors.text, fontSize: 18, lineHeight: 28 }}>{t('loadingFonts', locale)}</Text>}
    </View>
  </SafeAreaView>;
}
