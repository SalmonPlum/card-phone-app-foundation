import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { configuredDeck } from '../../decks';
import { assetRegistry } from '../../decks/assets';
import { CardDetails } from '../../features/cards/CardDetails';
import { DetailTransition, useDetailPresentation, useReducedMotion } from '../../features/cards/DetailTransition';
import { cardForRoute } from '../../features/cards/selectors';
import { useLocale } from '../../i18n/useLocale';
import { t } from '../../i18n/locale';

export default function Details() {
  const params = useLocalSearchParams(), router = useRouter(), locale = useLocale();
  const reduced = useReducedMotion(), presentation = useDetailPresentation(), card = cardForRoute(configuredDeck, params.id);
  const y = typeof params.y === 'string' ? Number(params.y) : NaN;
  const height = typeof params.height === 'string' ? Number(params.height) : NaN;
  const origin = params.origin === 'tile' && typeof params.scrollKey === 'string' && Number.isFinite(y) && Number.isFinite(height) && height > 0
    ? { scrollKey: params.scrollKey, rect: { x: 0, y, width: 0, height } } : null;
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/catalogue' as never); };
  return <SafeAreaView style={styles.screen}>
    <Pressable accessibilityRole="button" onPress={back} style={styles.back}><Text style={styles.link}>{t('back', locale)}</Text></Pressable>
    <DetailTransition origin={origin} reducedMotion={reduced} presentation={presentation}>
      {card ? <CardDetails card={card} locale={locale} assetRegistry={assetRegistry} />
        : <Text accessibilityRole="alert" style={styles.message}>{t('cardNotFound', locale)}</Text>}
    </DetailTransition>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f6f0' }, back: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12 },
  link: { color: '#315b47', fontSize: 18 }, message: { padding: 16, color: '#252923', fontSize: 18 },
});
