import { StyleSheet, Text, View } from 'react-native';
import type { Card, DetailTemplate, Locale } from '../../domain/contracts';
import { localizeCard,localizeCardSections } from '../../domain/deck';
import { spacing, radius } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

export function CardDetailsText({ detailTemplate,card, locale, includeName=true }: {detailTemplate:DetailTemplate;card:Card;locale:Locale;includeName?:boolean}) {
  const styles = useThemeStyles(makeStyles);
  const content = localizeCard(card, locale);
  return <>
    {includeName && <Text accessibilityRole="header" style={styles.title}>{content.name}</Text>}
    {localizeCardSections({detailTemplate},card,locale).map(section=><View key={section.id} style={styles.panel}>
      <Text accessibilityRole="header" style={styles.heading}>{section.title}</Text>
      <Text style={styles.copy}>{section.content}</Text>
    </View>)}
  </>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  title: { ...typography.cardTitle, color: colors.primary },
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, padding: spacing.lg, gap: spacing.sm },
  heading: { ...typography.sectionHeading, color: colors.accent },
  copy: { ...typography.body, color: colors.text },
});
