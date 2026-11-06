import {useDockHeight} from '../../navigation/useDockHeight';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useLanguageSettings} from '../../i18n/LanguageProvider';
import {useRevealModeSettings} from '../../settings/RevealModeProvider';
import {useThemeSettings} from '../../themes/ThemeProvider';
import {t} from '../../i18n/locale';
import { spacing, radius } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

export function SettingsScreen(){
  const styles = useThemeStyles(makeStyles);
  const dockHeight = useDockHeight();
  const {locale,setLanguage,saveError,retrySave}=useLanguageSettings();
  const reveal=useRevealModeSettings();
  const theme=useThemeSettings();
  return <SafeAreaView testID="settings-screen" edges={['top','left','right']} style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.content,{paddingBottom:spacing.xxl+dockHeight}]}>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>{t('language',locale)}</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('language',locale)} style={styles.choices}>
          {([['en','English'],['cs','Čeština']] as const).map(([value,label])=><Pressable key={value}
            accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{checked:locale===value}}
            onPress={()=>setLanguage(value)} style={[styles.choice,locale===value&&styles.selected]}>
            <View accessible={false} style={[styles.radio,locale===value&&styles.selectedRadio]}>{locale===value&&<View style={styles.dot}/>}</View>
            <Text style={[styles.option,locale===value&&styles.selectedText]}>{label}</Text>
          </Pressable>)}
        </View>
        {saveError&&<View style={styles.error}>
          <Text accessibilityRole="alert" style={styles.copy}>{t('languageSaveError',locale)}</Text>
          <Pressable accessibilityRole="button" onPress={retrySave} style={styles.retry}><Text style={styles.retryText}>{t('retry',locale)}</Text></Pressable>
        </View>}
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>{t('revealMode',locale)}</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('revealMode',locale)} style={styles.choices}>
          {(['automatic','manual'] as const).map(value=><Pressable key={value}
            accessibilityRole="radio" accessibilityLabel={t(value==='automatic'?'automaticMode':'manualMode',locale)} accessibilityState={{checked:reveal.mode===value}}
            onPress={()=>reveal.setRevealMode(value)} style={[styles.choice,reveal.mode===value&&styles.selected]}>
            <View accessible={false} style={[styles.radio,reveal.mode===value&&styles.selectedRadio]}>{reveal.mode===value&&<View style={styles.dot}/>}</View>
            <Text style={[styles.option,reveal.mode===value&&styles.selectedText]}>{t(value==='automatic'?'automaticMode':'manualMode',locale)}</Text>
          </Pressable>)}
        </View>
        {reveal.saveError&&<View style={styles.error}>
          <Text accessibilityRole="alert" style={styles.copy}>{t('revealSaveError',locale)}</Text>
          <Pressable accessibilityRole="button" onPress={reveal.retrySave} style={styles.retry}><Text style={styles.retryText}>{t('retry',locale)}</Text></Pressable>
        </View>}
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>{t('theme',locale)}</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('theme',locale)} style={styles.choices}>
          {theme.themes.map(option=>{
            const selected=theme.theme.id===option.id;
            return <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={option.name[locale]}
              accessibilityState={{checked:selected}} onPress={()=>theme.setTheme(option.id)} style={[styles.choice,selected&&styles.selected]}>
              <View accessible={false} style={[styles.radio,selected&&styles.selectedRadio]}>{selected&&<View style={styles.dot}/>}</View>
              <Text style={[styles.option,selected&&styles.selectedText]}>{option.name[locale]}</Text>
            </Pressable>;
          })}
        </View>
        {theme.saveError&&<View style={styles.error}>
          <Text accessibilityRole="alert" style={styles.copy}>{t('themeSaveError',locale)}</Text>
          <Pressable accessibilityRole="button" onPress={theme.retrySave} style={styles.retry}><Text style={styles.retryText}>{t('retry',locale)}</Text></Pressable>
        </View>}
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.canvas},
  content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},
  section:{gap:spacing.md},
  heading:{...typography.sectionHeading,color:colors.primary},
  choices:{gap:spacing.sm},
  choice:{minHeight:56,padding:spacing.lg,borderWidth:1,borderColor:colors.border,borderRadius:radius.panel,backgroundColor:colors.surface,flexDirection:'row',alignItems:'center',gap:spacing.md},
  selected:{borderColor:colors.primary,backgroundColor:colors.selectedSurface},
  selectedText:{color:colors.onSelected},
  selectedRadio:{borderColor:colors.onSelected},
  radio:{width:22,height:22,borderWidth:1.5,borderColor:colors.primary,borderRadius:11,alignItems:'center',justifyContent:'center'},
  dot:{width:12,height:12,borderRadius:6,backgroundColor:colors.onSelected},
  option:{...typography.body,color:colors.text,flexShrink:1},
  copy:{...typography.body,color:colors.text},
  error:{gap:spacing.sm},
  retry:{minHeight:48,alignSelf:'flex-start',padding:spacing.md,backgroundColor:colors.primary,borderRadius:radius.pill,justifyContent:'center'},
  retryText:{...typography.label,color:colors.onPrimary},
});
