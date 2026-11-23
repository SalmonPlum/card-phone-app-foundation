import {Alert,Pressable,StyleSheet,Switch,Text,View} from 'react-native';
import {useHistory} from '../../history/HistoryProvider';
import {useLocale} from '../../i18n/useLocale';
import {t} from '../../i18n/locale';
import {spacing,radius} from '../../ui/theme';
import {useThemeStyles,type ThemeColors,type ThemeTypography} from '../../ui/useThemeStyles';
import {useThemeSettings} from '../../themes/ThemeProvider';
export function HistoryError(){
  const history=useHistory(),locale=useLocale(),styles=useThemeStyles(makeStyles);
  if(!history.error&&!history.saving)return null;
  return <View style={styles.section}>
    {history.saving&&<Text accessibilityLiveRegion="polite" style={styles.copy}>{t('historySaving',locale)}</Text>}
    {history.error&&<><Text accessibilityRole="alert" style={styles.copy}>{t(history.error==='load'?'historyLoadError':'historySaveError',locale)}</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={()=>{void history.controller?.retry();}}><Text style={styles.buttonText}>{t('retry',locale)}</Text></Pressable></>}
  </View>;
}
export function HistorySettings(){
  const history=useHistory(),locale=useLocale(),styles=useThemeStyles(makeStyles),{theme}=useThemeSettings();
  const enabled=history.archive.enabled;
  return <View style={styles.section}>
    <View style={styles.row}><Text accessibilityRole="header" style={styles.heading}>{t('saveHistory',locale)}</Text>
      <Switch accessible accessibilityRole="switch" accessibilityLabel={t('saveHistory',locale)} accessibilityState={{checked:enabled}} value={enabled}
        disabled={!history.ready||history.error==='load'} trackColor={{false:theme.colors.border,true:theme.colors.primary}}
        onValueChange={value=>{void history.controller?.setEnabled(value);}}/>
    </View>
    <Text style={styles.copy}>{t('historyRetention',locale)}</Text>
    {enabled&&!history.recordingSessionId&&<Text style={styles.copy}>{t('historyStartsNextSession',locale)}</Text>}
    <Pressable accessibilityRole="button" disabled={!history.ready||(!history.archive.sessions.length&&history.error!=='load')} style={styles.button}
      onPress={()=>Alert.alert(t('historyClearTitle',locale),t('historyClearMessage',locale),[
        {text:t('cancel',locale),style:'cancel'},
        {text:t('historyClear',locale),style:'destructive',onPress:()=>{void history.controller?.clear();}},
      ])}><Text style={styles.buttonText}>{t('historyClear',locale)}</Text></Pressable>
    <HistoryError/>
  </View>;
}
const makeStyles=(colors:ThemeColors,typography:ThemeTypography)=>StyleSheet.create({
  section:{gap:spacing.md},row:{flexDirection:'row',alignItems:'center',minHeight:48,gap:spacing.md},
  heading:{...typography.sectionHeading,color:colors.primary,flex:1},copy:{...typography.body,color:colors.text},
  button:{alignSelf:'flex-start',minHeight:48,justifyContent:'center',padding:spacing.md,borderRadius:radius.pill,backgroundColor:colors.primary},buttonText:{...typography.label,color:colors.onPrimary},
});
