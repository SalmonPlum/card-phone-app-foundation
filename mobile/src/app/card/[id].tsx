import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { configuredDeck } from '../../decks';
import { assetRegistry } from '../../decks/assets';
import { CardDetails } from '../../features/cards/CardDetails';
import { cardForRoute } from '../../features/cards/selectors';
import { useLocale } from '../../i18n/useLocale';
import { t } from '../../i18n/locale';
import { colors, type, spacing, radius } from '../../ui/theme';

export default function Details() {
  const params = useLocalSearchParams(), router = useRouter(), locale = useLocale();
  const card = cardForRoute(configuredDeck, params.id);
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/catalogue' as never); };
  return <SafeAreaView style={styles.screen}>
    <Pressable accessibilityRole="button" onPress={back} style={styles.back}><Text style={styles.link}>{t('back', locale)}</Text></Pressable>
    {card ? <CardDetails card={card} locale={locale} assetRegistry={assetRegistry} />
      : <Text accessibilityRole="alert" style={styles.message}>{t('cardNotFound', locale)}</Text>}
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  back: { minHeight: 48, alignSelf: 'flex-start', marginHorizontal: spacing.lg, marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.panel, borderRadius: radius.pill },
  link: { ...type.label, fontFamily: type.sans, color: colors.forest },
  message: { ...type.body, fontFamily: type.sans, padding: spacing.lg, color: colors.ink },
});
