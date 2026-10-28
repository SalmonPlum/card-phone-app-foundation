import { Pressable, StyleSheet, Text, View } from 'react-native';
import { configuredDeck } from '../../decks';
import { assetRegistry } from '../../decks/assets';
import { t } from '../../i18n/locale';
import { useLocale } from '../../i18n/useLocale';
import { useSession } from '../../session/SessionProvider';
import { colors, radius, spacing, type } from '../../ui/theme';
import { CardCollectionScreen } from '../cards/CardCollectionScreen';
import { cardsForIds } from '../cards/selectors';

export function ResultsScreen() {
  const { state, error, reset, retry } = useSession();
  const locale = useLocale();
  if (!state) return null;
  const cards = cardsForIds(configuredDeck, state.drawnIds);
  return <CardCollectionScreen cards={cards} locale={locale} assetRegistry={assetRegistry}
    title={t('results', locale)} scrollKey={`results:${configuredDeck.id}:${state.sessionId}`} hostTestID="results-host" scrollHeader
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

const styles = StyleSheet.create({
  copy: { ...type.body, fontFamily: type.sans, color: colors.ink },
  button: { backgroundColor: colors.deepForest, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: 48, alignItems: 'center' },
  buttonText: { ...type.label, fontFamily: type.sans, color: colors.lightInk, textAlign: 'center' },
  empty: { padding: spacing.lg, gap: spacing.lg },
  error: { gap: spacing.sm },
});
