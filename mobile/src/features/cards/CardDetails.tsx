import { ScrollView, StyleSheet, Text } from 'react-native';
import type { Card, Locale } from '../../domain/contracts';
import type { AssetRegistry } from '../../decks/assets';
import { localizeCard } from '../../domain/deck';
import { t } from '../../i18n/locale';
import { CardFace } from './CardTile';

export type CardDetailsProps = { card: Card; locale: Locale; assetRegistry: AssetRegistry };
export function CardDetails({ card, locale, assetRegistry }: CardDetailsProps) {
  const content = localizeCard(card, locale);
  return <ScrollView contentContainerStyle={styles.content}>
    <CardFace card={card} locale={locale} assetRegistry={assetRegistry} testID={`detail-face-${card.id}`} />
    <Text accessibilityRole="header" style={styles.title}>{content.name}</Text>
    <Text accessibilityRole="header" style={styles.heading}>{t('meaning', locale)}</Text>
    <Text style={styles.copy}>{content.meaning}</Text>
    <Text accessibilityRole="header" style={styles.heading}>{t('description', locale)}</Text>
    <Text style={styles.copy}>{content.description}</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  title: { color: '#252923', fontSize: 30, fontWeight: '600' },
  heading: { color: '#315b47', fontSize: 20, fontWeight: '600', marginTop: 8 },
  copy: { color: '#252923', fontSize: 18, lineHeight: 28 },
});
