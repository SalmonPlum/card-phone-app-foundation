import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Card, Locale } from '../../domain/contracts';
import type { AssetRegistry } from '../../decks/assets';
import { localizeCard } from '../../domain/deck';
import { t } from '../../i18n/locale';
import { CardFace } from './CardTile';
import { colors, type, spacing, radius } from '../../ui/theme';

export type CardDetailsProps = { card: Card; locale: Locale; assetRegistry: AssetRegistry };
export function CardDetails({ card, locale, assetRegistry }: CardDetailsProps) {
  return <ScrollView contentContainerStyle={styles.content}>
    <CardFace card={card} locale={locale} assetRegistry={assetRegistry} testID={`detail-face-${card.id}`} />
    <CardDetailsText card={card} locale={locale} />
  </ScrollView>;
}
export function CardDetailsText({ card, locale }: Pick<CardDetailsProps, 'card' | 'locale'>) {
  const content = localizeCard(card, locale);
  return <>
    <Text accessibilityRole="header" style={styles.title}>{content.name}</Text>
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.heading}>{t('meaning', locale)}</Text>
      <Text style={styles.copy}>{content.meaning}</Text>
    </View>
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.heading}>{t('description', locale)}</Text>
      <Text style={styles.copy}>{content.description}</Text>
    </View>
  </>;
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  title: { ...type.cardTitle, fontFamily: type.serif, color: colors.deepForest },
  panel: { backgroundColor: colors.panel, borderRadius: radius.panel, padding: spacing.lg, gap: spacing.sm },
  heading: { ...type.label, fontFamily: type.sans, color: colors.goldInk, letterSpacing: 0.6 },
  copy: { ...type.body, fontFamily: type.sans, color: colors.ink },
});
