import { Link, useIsFocused, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { configuredDeck } from '../decks';
import { assetRegistry } from '../decks/assets';
import { CardGrid } from '../features/cards/CardGrid';
import { t } from '../i18n/locale';
import { useLocale } from '../i18n/useLocale';

export default function Catalogue() {
  const locale = useLocale(), router = useRouter(), active = useIsFocused();
  return <SafeAreaView style={styles.screen}>
    <View style={styles.heading}>
      <Link href="/" style={styles.link}>{t('home', locale)}</Link>
      <Text accessibilityRole="header" style={styles.title}>{t('catalogue', locale)}</Text>
    </View>
    <CardGrid cards={configuredDeck.cards} locale={locale} assetRegistry={assetRegistry}
      scrollKey={`catalogue:${configuredDeck.id}`} active={active}
      onOpen={(id, origin) => router.push({ pathname: '/card/[id]' as never, params: {
        id: String(id), origin: origin.rect ? 'tile' : 'fade', scrollKey: origin.scrollKey,
        ...(origin.rect ? { y: String(origin.rect.y), height: String(origin.rect.height) } : {}),
      } })} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f6f0' }, heading: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  title: { color: '#252923', fontSize: 28, fontWeight: '600' },
  link: { color: '#315b47', fontSize: 18, paddingVertical: 12 },
});
