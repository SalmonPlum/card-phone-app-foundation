import { Pressable, StyleSheet, Text, View } from 'react-native';
import { configuredDeck } from '../../decks';
import { assetRegistry } from '../../decks/assets';
import { t } from '../../i18n/locale';
import { useLocale } from '../../i18n/useLocale';
import { useSession } from '../../session/SessionProvider';
import {IconButton} from '../../ui/IconButton';
import { radius, spacing } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';
import { CardCollectionScreen } from '../cards/CardCollectionScreen';
import { cardsForIds } from '../cards/selectors';

export function ResultsScreen() {
  const styles = useThemeStyles(makeStyles);
  const { state, error, reset, retry } = useSession();
  const locale = useLocale();
  if (!state) return null;
  const cards = cardsForIds(configuredDeck, state.drawnIds);
  return <CardCollectionScreen detailTemplate={configuredDeck.detailTemplate} cards={cards} locale={locale} assetRegistry={assetRegistry}
    scrollKey={`results:${configuredDeck.id}:${state.sessionId}`} hostTestID="results-host" scrollHeader
    headerContent={<>
      <View testID="results-controls" style={styles.headerRow}>
        <Text style={[styles.copy,styles.count]}>{t('drawnCount', locale, { count: cards.length })}</Text>
        {cards.length>0&&<IconButton icon="cards-restart" variant="circle" label={t('newSession',locale)} onPress={reset}/>}
      </View>
      {error && <View style={styles.error}>
        <Text style={styles.copy}>{t('entropyError', locale)}</Text>
        <Pressable onPress={retry} accessibilityRole="button" style={styles.button}>
          <Text style={styles.buttonText}>{t('retry', locale)}</Text>
        </Pressable>
      </View>}
    </>}
    emptyContent={<View style={styles.empty}>
      <Text style={styles.copy}>{t('emptyResults', locale)}</Text>
      <Pressable onPress={reset} accessibilityRole="button" accessibilityLabel={t('drawCards', locale)} style={[styles.button,styles.compactButton]}>
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.backIcon}>
          <View style={styles.backShaft}/><View style={styles.backHead}/>
        </View>
        <Text style={[styles.buttonText,styles.drawLabel]}>{t('drawCards', locale)}</Text>
      </Pressable>
    </View>} />;
}

const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  headerRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:spacing.md},
  count:{flex:1,minWidth:0},
  compactButton:{alignSelf:'center',maxWidth:'100%',marginTop:spacing.lg,paddingHorizontal:spacing.lg,paddingVertical:spacing.sm,flexDirection:'row',gap:spacing.sm,justifyContent:'center'},
  drawLabel:{flexShrink:1},
  backIcon:{width:18,height:18,flexShrink:0},
  backShaft:{position:'absolute',left:1,top:8,width:16,height:2,borderRadius:1,backgroundColor:colors.onPrimary},
  backHead:{position:'absolute',left:2,top:4,width:10,height:10,borderLeftWidth:2,borderBottomWidth:2,borderColor:colors.onPrimary,transform:[{rotate:'45deg'}]},
  copy: { ...typography.body, color: colors.text },
  button: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: 48, alignItems: 'center' },
  buttonText: { ...typography.label, color: colors.onPrimary, textAlign: 'center' },
  empty: { padding: spacing.lg, gap: spacing.lg },
  error: { gap: spacing.sm },
});
