import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { configuredDeck } from '../decks';
import { t } from '../i18n/locale';
import { useLocale } from '../i18n/useLocale';

export function HomeShell(): React.JSX.Element {
  const locale = useLocale();
  return (
    <SafeAreaView style={styles.screen} testID="home-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>{configuredDeck.name[locale]}</Text>
          <Link href={"/draw-preview" as never} style={styles.link}>{t('drawCards', locale)}</Link>
          <Link href={"/catalogue" as never} style={styles.link}>{t('browseCards', locale)}</Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeShell;

// The platform system font includes Czech glyphs and respects font scaling.
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f6f0' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  heading: { gap: 12 },
  title: { color: '#252923', fontSize: 32, fontWeight: '600' },
  link: { color: '#315b47', fontSize: 18, paddingVertical: 16 },
});
