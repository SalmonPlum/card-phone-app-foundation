import { configuredDeck } from '../../decks';
import { assetRegistry } from '../../decks/assets';
import { useLocale } from '../../i18n/useLocale';
import { CardCollectionScreen } from './CardCollectionScreen';
import { useCallback, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { CatalogueSearchBar } from './CatalogueSearchBar';
import { filterCardsByName } from './cardNameSearch';
import { t } from '../../i18n/locale';
import { spacing } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

export default function CatalogueScreen() {
  const locale = useLocale();
  const styles = useThemeStyles(makeStyles);
  const [query, setQuery] = useState('');
  const cards = configuredDeck.cards;
  const visibleCards = useMemo(() => filterCardsByName(cards, locale, query), [cards, locale, query]);
  useFocusEffect(useCallback(() => () => Keyboard.dismiss(), []));
  return <CardCollectionScreen detailTemplate={configuredDeck.detailTemplate} cards={configuredDeck.cards} locale={locale} assetRegistry={assetRegistry}
    visibleCards={visibleCards} filterKey={`${locale}:${query}`} scrollKey={`catalogue:${configuredDeck.id}`} hostTestID="catalogue-host"
    headerContent={<CatalogueSearchBar query={query} onChange={setQuery} locale={locale}/>}
    emptyContent={<View style={styles.empty}><Text accessibilityRole="alert" style={styles.copy}>{t('noCardMatches', locale)}</Text></View>}/>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  empty: { padding: spacing.lg },
  copy: { ...typography.body, color: colors.mutedText },
});
