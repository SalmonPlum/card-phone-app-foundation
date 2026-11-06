import { Pressable, StyleSheet, Text, View } from 'react-native';
import { configuredDeck } from '../../decks';
import { assetRegistry } from '../../decks/assets';
import { t } from '../../i18n/locale';
import { useLocale } from '../../i18n/useLocale';
import { useSession } from '../../session/SessionProvider';
import { radius, spacing } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';
import { CardCollectionScreen } from '../cards/CardCollectionScreen';
import { cardsForIds } from '../cards/selectors';

export function ResultsScreen() {
  const styles = useThemeStyles(makeStyles);
  const { state, error, reset, retry } = useSession();
  const locale = useLocale();
  if (!state) return null;
  const cards = cardsForIds(configuredDeck, state.drawnIds);
  return <CardCollectionScreen detailTemplate={configuredDeck.detailTemplate} cards={cards} locale={locale} assetRegistry={assetRegistry}
    scrollKey={`results:${configuredDeck.id}:${state.sessionId}`} hostTestID="results-host" scrollHeader
    headerContent={<>
      <Text style={styles.copy}>{t('drawnCount', locale, { count: cards.length })}</Text>
      <Pressable onPress={reset} accessibilityRole="button" style={styles.button}>
        <Text style={styles.buttonText}>{t('newSession', locale)}</Text>
      </Pressable>
      {error && <View style={styles.error}>
        <Text style={styles.copy}>{t('entropyError', locale)}</Text>
        <Pressable onPress={retry} accessibilityRole="button" style={styles.button}>
          <Text style={styles.buttonText}>{t('retry', locale)}</Text>
        </Pressable>
      </View>}
    </>}
    emptyContent={<View style={styles.empty}>
      <Text style={styles.copy}>{t('emptyResults', locale)}</Text>
      <Pressable onPress={reset} accessibilityRole="button" style={styles.button}>
        <Text style={styles.buttonText}>{t('drawCards', locale)}</Text>
      </Pressable>
    </View>} />;
}

const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  copy: { ...typography.body, color: colors.text },
  button: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: 48, alignItems: 'center' },
  buttonText: { ...typography.label, color: colors.onPrimary, textAlign: 'center' },
  empty: { padding: spacing.lg, gap: spacing.lg },
  error: { gap: spacing.sm },
});
