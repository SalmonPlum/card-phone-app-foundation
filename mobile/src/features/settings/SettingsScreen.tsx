import {useDockHeight} from '../../navigation/useDockHeight';
import {Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useLanguageSettings} from '../../i18n/LanguageProvider';
import {useRevealModeSettings} from '../../settings/RevealModeProvider';
import {useThemeSettings} from '../../themes/ThemeProvider';
import {t} from '../../i18n/locale';
import { spacing, radius } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

export function SettingsScreen(){
  const styles = useThemeStyles(makeStyles);
  const {width,fontScale}=useWindowDimensions();
  const stacked=width<360 || fontScale>=1.3;
  const dockHeight = useDockHeight();
  const {locale,setLanguage,saveError,retrySave}=useLanguageSettings();
  const reveal=useRevealModeSettings();
  const theme=useThemeSettings();
  return <SafeAreaView testID="settings-screen" edges={['top','left','right']} style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.content,{paddingBottom:spacing.xxl+dockHeight}]}>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>{t('language',locale)}</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('language',locale)} style={[styles.segments,stacked&&styles.stacked]}>
          {([['en','English'],['cs','Čeština']] as const).map(([value,label])=><SegmentChoice key={value}
            label={label} selected={locale===value} stacked={stacked}
            onPress={()=>setLanguage(value)} styles={styles}/>)}
        </View>
        {saveError&&<View style={styles.error}>
          <Text accessibilityRole="alert" style={styles.copy}>{t('languageSaveError',locale)}</Text>
          <Pressable accessibilityRole="button" onPress={retrySave} style={styles.retry}><Text style={styles.retryText}>{t('retry',locale)}</Text></Pressable>
        </View>}
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>{t('revealMode',locale)}</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('revealMode',locale)} style={[styles.segments,stacked&&styles.stacked]}>
          {(['automatic','manual'] as const).map(value=><SegmentChoice key={value}
            label={t(value==='automatic'?'automaticMode':'manualMode',locale)} selected={reveal.mode===value}
            stacked={stacked} onPress={()=>reveal.setRevealMode(value)} styles={styles}/>)}
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
              accessibilityState={{checked:selected}} onPress={()=>theme.setTheme(option.id)}
              style={({pressed})=>[styles.themeCard,selected&&styles.selected,pressed&&styles.pressed]}>
              <View style={styles.themeHeader}>
                <Text style={[styles.option,selected&&styles.selectedText]}>{option.name[locale]}</Text>
                <SelectionMark selected={selected} styles={styles}/>
              </View>
              <View testID={`theme-preview-${option.id}`} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.preview}>
                {(['canvas','primary','accent','mat'] as const).map(role=><View key={role}
                  testID={`theme-swatch-${role}`} style={[styles.swatch,{backgroundColor:option.colors[role]}]}/>)}
              </View>
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

type SettingsStyles = ReturnType<typeof makeStyles>;

function SelectionMark({selected,styles}:{selected:boolean;styles:SettingsStyles}) {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.radio,selected&&styles.selectedRadio]}>
    {selected&&<View style={styles.dot}/>}
  </View>;
}

function SegmentChoice({label,selected,stacked,onPress,styles}:{
  label:string;selected:boolean;stacked:boolean;onPress:()=>void;styles:SettingsStyles;
}) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{checked:selected}}
    onPress={onPress} style={({pressed})=>[styles.segment,stacked&&styles.stackedChoice,selected&&styles.selected,pressed&&styles.pressed]}>
    <SelectionMark selected={selected} styles={styles}/>
    <Text style={[styles.segmentLabel,selected&&styles.selectedText]}>{label}</Text>
  </Pressable>;
}

const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.canvas},
  content:{paddingHorizontal:20,paddingTop:spacing.xl,paddingBottom:spacing.xxl,gap:32},
  section:{gap:spacing.md},
  heading:{...typography.sectionHeading,color:colors.primary},
  segments:{flexDirection:'row',padding:spacing.xs,gap:spacing.xs,borderRadius:radius.panel,backgroundColor:colors.surface},
  stacked:{flexDirection:'column'},
  segment:{flex:1,minWidth:0,minHeight:48,paddingHorizontal:spacing.md,paddingVertical:spacing.md,borderWidth:1,borderColor:'transparent',borderRadius:radius.panel-spacing.xs,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm},
  stackedChoice:{flex:0},
  segmentLabel:{...typography.label,color:colors.text,flexShrink:1,textAlign:'center'},
  choices:{gap:spacing.md},
  themeCard:{minHeight:48,padding:spacing.lg,borderWidth:1,borderColor:colors.border,borderRadius:radius.panel,backgroundColor:colors.surface,gap:spacing.md},
  themeHeader:{flexDirection:'row',alignItems:'center',gap:spacing.md},
  preview:{flexDirection:'row',gap:spacing.xs},
  swatch:{flex:1,height:28,borderRadius:6,borderWidth:1,borderColor:colors.border},
  selected:{borderColor:colors.primary,backgroundColor:colors.selectedSurface},
  selectedText:{color:colors.onSelected},
  selectedRadio:{borderColor:colors.onSelected},
  radio:{width:18,height:18,flexShrink:0,borderWidth:1.5,borderColor:colors.mutedText,borderRadius:9,alignItems:'center',justifyContent:'center'},
  dot:{width:8,height:8,borderRadius:4,backgroundColor:colors.onSelected},
  pressed:{opacity:0.8},
  option:{...typography.body,color:colors.text,flex:1},
  copy:{...typography.body,color:colors.text},
  error:{gap:spacing.sm},
  retry:{minHeight:48,alignSelf:'flex-start',padding:spacing.md,backgroundColor:colors.primary,borderRadius:radius.pill,justifyContent:'center'},
  retryText:{...typography.label,color:colors.onPrimary},
});
