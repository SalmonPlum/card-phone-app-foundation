import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/locale';
import { loadThemeFonts } from '../platform/themeFonts';
import { useThemeSettings } from './ThemeProvider';
import catalog from './fontCatalog.json';
import { resolveThemeTypography, scaleThemeTypography, type ThemeTypography } from './typography';
import { useTextSizeSettings } from '../settings/TextSizeProvider';

const FontsAvailable = createContext(false);
const fallback = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
};

export function useThemeTypography(): ThemeTypography {
  const { theme } = useThemeSettings();
  const available = useContext(FontsAvailable);
  const { scale } = useTextSizeSettings();
  return useMemo(() => scaleThemeTypography(resolveThemeTypography(theme, catalog.fonts, available, fallback), scale), [theme, available, scale]);
}

/** A startup-only gate; font completion never replaces metrics under an active session. */
export function ThemeFontGate({ children, loadFonts = loadThemeFonts }: { children: ReactNode; loadFonts?: () => Promise<void> }) {
  const { theme, ready: themeReady, retryThemeRestore, keepCurrentTheme } = useThemeSettings(), locale = useLocale();
  const textSize = useTextSizeSettings();
  const ready = themeReady && textSize.ready;
  const typography = useThemeTypography();
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
    // One deadline bounds fonts, theme and text-size restoration before sessions mount.
    const timer = setTimeout(() => setStatus('failed'), Math.max(0, 15000 - (Date.now() - startedAt)));
    return () => clearTimeout(timer);
  }, [ready, status, startedAt]);
  const retry = () => {
    if (!themeReady) retryThemeRestore();
    if (!textSize.ready) textSize.retryTextSizeRestore();
    setStatus('loading'); setStartedAt(Date.now()); setAttempt(value => value + 1);
  };
  const continueWithFallback = () => { keepCurrentTheme(); textSize.keepCurrentTextSize(); setStatus('fallback'); };
  if ((status === 'loaded' && ready) || status === 'fallback') {
    return <FontsAvailable.Provider value={status === 'loaded'}>{children}</FontsAvailable.Provider>;
  }
  const colors = theme.colors;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
    <View style={{ gap: 16 }}>
      {status === 'failed' ? <>
        <Text accessibilityRole="alert" style={{ ...typography.body, color: colors.text }}>{t('fontLoadError', locale)}</Text>
        <Pressable accessibilityRole="button" onPress={retry}
          style={{ minHeight: 48, padding: 16, borderRadius: 24, backgroundColor: colors.primary }}>
          <Text style={{ ...typography.label, color: colors.onPrimary }}>{t('retry', locale)}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={continueWithFallback}
          style={{ minHeight: 48, padding: 16, borderRadius: 24, backgroundColor: colors.surface }}>
          <Text style={{ ...typography.label, color: colors.text }}>{t('useSystemFonts', locale)}</Text>
        </Pressable>
      </> : <Text accessibilityRole="progressbar" style={{ ...typography.body, color: colors.text }}>{t('loadingFonts', locale)}</Text>}
    </View>
    </ScrollView>
  </SafeAreaView>;
}
