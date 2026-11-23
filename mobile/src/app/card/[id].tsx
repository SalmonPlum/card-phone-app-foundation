import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { configuredDeck } from '../../decks';
import { assetRegistry } from '../../decks/assets';
import {IconButton} from '../../ui/IconButton';
import { CardDetails } from '../../features/cards/CardDetails';
import { cardForRoute } from '../../features/cards/selectors';
import { useLocale } from '../../i18n/useLocale';
import { t } from '../../i18n/locale';
import { spacing } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

export default function Details() {
  const styles = useThemeStyles(makeStyles);
  const params = useLocalSearchParams(), router = useRouter(), locale = useLocale();
  const focused=useIsFocused();
  const card = cardForRoute(configuredDeck, params.id);
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/catalogue' as never); };
  return <SafeAreaView style={styles.screen}>
    {card ? <CardDetails detailTemplate={configuredDeck.detailTemplate} key={`${configuredDeck.id}:${card.id}:${locale}`} card={card} locale={locale} assetRegistry={assetRegistry} onBack={back} active={focused}/>
      : <><IconButton variant="circle" icon="back" label={t('back',locale)} onPress={back} style={styles.back}/><Text accessibilityRole="alert" style={styles.message}>{t('cardNotFound', locale)}</Text></>}
  </SafeAreaView>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  back: { alignSelf:'flex-start',marginHorizontal:spacing.lg,marginTop:spacing.sm },
  message: { ...typography.body, padding: spacing.lg, color: colors.text },
});
