import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { configuredDeck } from '../decks';
import { t } from '../i18n/locale';
import { useLocale } from '../i18n/useLocale';
import { colors, type, spacing, radius } from '../ui/theme';

export function HomeShell(): React.JSX.Element {
  const locale = useLocale();
  return (
    <SafeAreaView style={styles.screen} testID="home-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text accessible={false} style={styles.ornament}>✦</Text>
          <Text accessibilityRole="header" style={styles.title}>{configuredDeck.name[locale]}</Text>
          <View style={styles.rule} />
          <Link href={"/draw-preview" as never} style={[styles.link, styles.primary]}>{t('drawCards', locale)}</Link>
          <Link href={"/catalogue" as never} style={[styles.link, styles.secondary]}>{t('browseCards', locale)}</Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeShell;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  heading: { gap: spacing.lg, width: '100%', maxWidth: 480, alignSelf: 'center' },
  ornament: { color: colors.goldInk, fontSize: 28, textAlign: 'center' },
  title: { ...type.title, fontFamily: type.serif, color: colors.deepForest, textAlign: 'center' },
  rule: { backgroundColor: colors.brass, width: 48, height: 1, alignSelf: 'center', marginVertical: spacing.lg },
  link: { ...type.label, fontFamily: type.sans, textAlign: 'center', padding: spacing.lg, borderRadius: radius.pill, overflow: 'hidden', minHeight: 48 },
  primary: { color: colors.lightInk, backgroundColor: colors.deepForest },
  secondary: { color: colors.forest, backgroundColor: colors.panel },
});
