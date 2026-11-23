import {useState} from 'react';
import {Linking,Pressable,StyleSheet,Switch,Text,View} from 'react-native';
import {useReminderSettings} from '../../notifications/ReminderProvider';
import {useAppLocale} from '../../i18n/LanguageProvider';
import {t} from '../../i18n/locale';
import {useThemeSettings} from '../../themes/ThemeProvider';
import {spacing,radius} from '../../ui/theme';
import {useThemeStyles,type ThemeColors,type ThemeTypography} from '../../ui/useThemeStyles';
import {ReminderTimePicker} from './ReminderTimePicker';
export function ReminderSettings() {
  const reminder=useReminderSettings(),locale=useAppLocale(),styles=useThemeStyles(makeStyles),{theme}=useThemeSettings();
  const [picker,setPicker]=useState(false),[settingsError,setSettingsError]=useState(false);
  const {hour,minute,enabled}=reminder.preferences;
  const time=`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
  const status=reminder.busy?'reminderUpdating':reminder.error?'reminderNeedsAttention':reminder.active?'reminderScheduled':'reminderOff';
  return <View style={styles.section}>
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.heading}>{t('dailyReminder',locale)}</Text>
      <Switch accessible accessibilityState={{checked:enabled}} accessibilityLabel={t('dailyReminder',locale)} disabled={!reminder.ready} value={enabled}
        trackColor={{false:theme.colors.border,true:theme.colors.primary}} onValueChange={value=>{void reminder.setEnabled(value);}}/>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={t('reminderTimeValue',locale,{time})} disabled={!reminder.ready}
      onPress={()=>setPicker(true)} style={styles.time}><Text style={styles.copy}>{t('reminderTime',locale)}</Text><Text style={styles.value}>{time}</Text></Pressable>
    <Text accessibilityLiveRegion="polite" style={styles.copy}>{t(status,locale,{time})}</Text>
    <Text style={styles.hint}>{t('reminderApproximate',locale)}</Text>
    {reminder.permissionDenied&&<View style={styles.section}>
      <Text accessibilityRole="alert" style={styles.copy}>{t(reminder.canAskAgain?'reminderPermissionNeeded':'reminderPermissionBlocked',locale)}</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={()=>{setSettingsError(false);void Linking.openSettings().catch(()=>setSettingsError(true));}}><Text style={styles.buttonText}>{t('openAppSettings',locale)}</Text></Pressable>
    </View>}
    {(reminder.error||settingsError)&&<View style={styles.section}>
      <Text accessibilityRole="alert" style={styles.copy}>{t(settingsError?'openSettingsError':reminder.error==='unavailable'?'reminderUnavailable':reminder.error==='storage'?'reminderSaveError':'reminderUpdateError',locale)}</Text>
      {reminder.error&&<Pressable accessibilityRole="button" style={styles.button} onPress={()=>{void reminder.retry();}}><Text style={styles.buttonText}>{t('retry',locale)}</Text></Pressable>}
    </View>}
    {picker&&<ReminderTimePicker hour={hour} minute={minute} locale={locale} onSelect={(h,m)=>{void reminder.setTime(h,m);}} onClose={()=>setPicker(false)}/>}
  </View>;
}
const makeStyles=(colors:ThemeColors,typography:ThemeTypography)=>StyleSheet.create({
  section:{gap:spacing.md},row:{flexDirection:'row',alignItems:'center',minHeight:48,gap:spacing.md},
  heading:{...typography.sectionHeading,color:colors.primary,flex:1},copy:{...typography.body,color:colors.text},
  hint:{...typography.caption,color:colors.mutedText},time:{minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:radius.panel,padding:spacing.md,flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:spacing.md,backgroundColor:colors.surface},
  value:{...typography.label,color:colors.primary},button:{minHeight:48,alignSelf:'flex-start',justifyContent:'center',padding:spacing.md,borderRadius:radius.pill,backgroundColor:colors.primary},buttonText:{...typography.label,color:colors.onPrimary},
});
