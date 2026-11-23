import {useState} from 'react';
import {Modal,Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import type {Locale} from '../../domain/contracts';
import {t} from '../../i18n/locale';
import {useThemeSettings} from '../../themes/ThemeProvider';
import {useThemeStyles,type ThemeColors,type ThemeTypography} from '../../ui/useThemeStyles';
import {spacing,radius} from '../../ui/theme';

type Props={hour:number;minute:number;locale:Locale;onSelect:(hour:number,minute:number)=>void;onClose:()=>void};
export function ReminderTimePicker({hour,minute,locale,onSelect,onClose}:Props) {
  const styles=useThemeStyles(makeStyles),{theme}=useThemeSettings();
  const [draft,setDraft]=useState(()=>new Date(2000,0,15,hour,minute));
  const [failed,setFailed]=useState(false);
  let Picker:typeof import('@react-native-community/datetimepicker').default|undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Picker=(require('@react-native-community/datetimepicker') as typeof import('@react-native-community/datetimepicker')).default;
  } catch { /* Show a recoverable message when the native client is too old. */ }
  const error=<View style={styles.panel}><Text accessibilityRole="alert" style={styles.copy}>{t('reminderUnavailable',locale)}</Text><Pressable accessibilityRole="button" style={styles.button} onPress={onClose}><Text style={styles.buttonText}>{t('close',locale)}</Text></Pressable></View>;
  if(!Picker||failed)return error;
  const picker=<Picker testID="reminder-time-picker" accessibilityLabel={t('reminderTime',locale)} value={draft} mode="time" is24Hour
    display={Platform.OS==='ios'?'spinner':'default'} locale={Platform.OS==='ios'?(locale==='cs'?'cs-CZ':'en-GB'):undefined}
    themeVariant={theme.appearance} onDismiss={onClose} onError={()=>setFailed(true)}
    onValueChange={(_event,date)=>{
      if(!date||!Number.isFinite(date.getTime()))return;
      if(Platform.OS==='ios')setDraft(date);else {onSelect(date.getHours(),date.getMinutes());onClose();}
    }}/>;
  if(Platform.OS!=='ios')return picker;
  return <Modal transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.backdrop}><View accessibilityViewIsModal style={styles.panel}>
      <Text accessibilityRole="header" style={styles.copy}>{t('reminderTime',locale)}</Text>{picker}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={styles.button} onPress={onClose}><Text style={styles.buttonText}>{t('cancel',locale)}</Text></Pressable>
        <Pressable accessibilityRole="button" style={styles.button} onPress={()=>{onSelect(draft.getHours(),draft.getMinutes());onClose();}}><Text style={styles.buttonText}>{t('done',locale)}</Text></Pressable>
      </View>
    </View></View>
  </Modal>;
}
const makeStyles=(colors:ThemeColors,typography:ThemeTypography)=>StyleSheet.create({
  backdrop:{flex:1,justifyContent:'center',padding:spacing.lg,backgroundColor:'#00000066'},
  panel:{padding:spacing.lg,gap:spacing.md,borderRadius:radius.panel,backgroundColor:colors.surface},
  copy:{...typography.body,color:colors.text},actions:{flexDirection:'row',justifyContent:'flex-end',gap:spacing.md},
  button:{minHeight:48,padding:spacing.md,justifyContent:'center'},buttonText:{...typography.label,color:colors.primary},
});
