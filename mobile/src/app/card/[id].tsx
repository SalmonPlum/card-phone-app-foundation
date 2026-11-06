import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { configuredDeck } from '../../decks';
import { assetRegistry } from '../../decks/assets';
import { CardDetails } from '../../features/cards/CardDetails';
import { cardForRoute } from '../../features/cards/selectors';
import { useLocale } from '../../i18n/useLocale';
import { t } from '../../i18n/locale';
import { spacing, radius } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

export default function Details() {
  const styles = useThemeStyles(makeStyles);
  const params = useLocalSearchParams(), router = useRouter(), locale = useLocale();
  const card = cardForRoute(configuredDeck, params.id);
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/catalogue' as never); };
  return <SafeAreaView style={styles.screen}>
    {card ? <CardDetails detailTemplate={configuredDeck.detailTemplate} key={`${configuredDeck.id}:${card.id}:${locale}`} card={card} locale={locale} assetRegistry={assetRegistry} onBack={back}/>
      : <><Pressable accessibilityRole="button" onPress={back} style={styles.back}><Text style={styles.link}>{t('back', locale)}</Text></Pressable><Text accessibilityRole="alert" style={styles.message}>{t('cardNotFound', locale)}</Text></>}
  </SafeAreaView>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  back: { minHeight: 48, alignSelf: 'flex-start', marginHorizontal: spacing.lg, marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderRadius: radius.pill },
  link: { ...typography.label, color: colors.primary },
  message: { ...typography.body, padding: spacing.lg, color: colors.text },
});
