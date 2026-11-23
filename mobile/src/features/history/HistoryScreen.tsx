import {useCallback,useEffect,useState} from 'react';
import {Alert,BackHandler,FlatList,Pressable,StyleSheet,Text,View} from 'react-native';
import {Redirect,useIsFocused} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useHistory} from '../../history/HistoryProvider';
import type {HistorySession} from '../../history/archive';
import {ArtworkProvider} from '../../artwork/ArtworkProvider';
import {assetRegistry} from '../../decks/assets';
import {useLocale} from '../../i18n/useLocale';
import {t} from '../../i18n/locale';
import {useDockHeight} from '../../navigation/useDockHeight';
import {spacing,radius} from '../../ui/theme';
import {useThemeStyles,type ThemeColors,type ThemeTypography} from '../../ui/useThemeStyles';
import {CardCollectionScreen} from '../cards/CardCollectionScreen';
import {HistoryError} from './HistorySettings';
export function HistoryScreen(){
  const history=useHistory(),locale=useLocale(),styles=useThemeStyles(makeStyles),focused=useIsFocused(),dock=useDockHeight();
  const [selected,setSelected]=useState<string|null>(null),[selecting,setSelecting]=useState(false),[ids,setIds]=useState<string[]>([]);
  const entry=history.archive.sessions.find(item=>item.sessionId===selected);
  const entryId=entry?.sessionId;
  const back=useCallback(()=>setSelected(null),[]);
  useEffect(()=>{
    if(!focused||(!entryId&&!selecting))return;
    const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{if(entryId)back();else{setSelecting(false);setIds([]);}return true;});
    return()=>subscription.remove();
  },[focused,entryId,selecting,back]);
  if(!history.ready)return <SafeAreaView style={styles.screen}><Text style={styles.copy}>{t('historyLoading',locale)}</Text></SafeAreaView>;
  if(!history.archive.enabled)return <Redirect href="/"/>;
  const chosen=ids.filter(id=>history.archive.sessions.some(item=>item.sessionId===id));
  const status=(item:HistorySession)=>t(item.finished?'historyFinished':item.sessionId===history.recordingSessionId?'historyInProgress':'historyPartial',locale);
  const date=(item:HistorySession)=>new Intl.DateTimeFormat(locale==='cs'?'cs-CZ':'en-GB',{dateStyle:'medium',timeStyle:'short'}).format(item.firstRevealedAt);
  return <View style={styles.screen}>
    <SafeAreaView edges={['top','left','right']} style={[styles.screen,entry?styles.hidden:null]} accessibilityElementsHidden={!!entry} importantForAccessibility={entry?'no-hide-descendants':'auto'}>
      <View style={styles.header}>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={styles.button} onPress={()=>{setSelecting(value=>!value);setIds([]);}}><Text style={styles.buttonText}>{t(selecting?'cancel':'historySelect',locale)}</Text></Pressable>
          {selecting&&<Pressable accessibilityRole="button" style={styles.button} disabled={!chosen.length} onPress={()=>{
            const deleting=[...chosen];Alert.alert(t('historyDeleteTitle',locale),t('historyDeleteMessage',locale,{count:deleting.length}),[
              {text:t('cancel',locale),style:'cancel'},
              {text:t('historyDeleteSelected',locale,{count:deleting.length}),style:'destructive',onPress:()=>{void history.controller?.deleteSessions(deleting);setIds([]);setSelecting(false);}},
            ]);
          }}><Text style={styles.buttonText}>{t('historyDeleteSelected',locale,{count:chosen.length})}</Text></Pressable>}
        </View>
        <Text style={styles.copy}>{t('historyRetention',locale)}</Text><HistoryError/>
      </View>
      <FlatList testID="history-list" data={history.archive.sessions} keyExtractor={item=>item.sessionId}
        contentContainerStyle={[styles.list,{paddingBottom:dock+spacing.xl}]} ListEmptyComponent={<View style={styles.header}>
          <Text style={styles.copy}>{t('historyEmpty',locale)}</Text>
          {!history.recordingSessionId&&<Text style={styles.copy}>{t('historyStartsNextSession',locale)}</Text>}
        </View>}
        renderItem={({item})=><Pressable testID={`history-session-${item.sessionId}`} accessibilityRole={selecting?'checkbox':'button'}
          accessibilityState={selecting?{checked:chosen.includes(item.sessionId)}:undefined}
          accessibilityLabel={t('historySessionLabel',locale,{date:date(item),deck:item.deck.name[locale],count:item.draws.length,status:status(item)})}
          style={[styles.record,chosen.includes(item.sessionId)&&styles.selected]}
          onPress={()=>{if(selecting)setIds(old=>old.includes(item.sessionId)?old.filter(id=>id!==item.sessionId):[...old,item.sessionId]);else setSelected(item.sessionId);}}>
          <Text style={styles.heading}>{date(item)}</Text><Text style={styles.copy}>{item.deck.name[locale]}</Text>
          <Text style={styles.copy}>{t('drawnCount',locale,{count:item.draws.length})} · {status(item)}</Text>
          {selecting&&<Text style={styles.copy}>{chosen.includes(item.sessionId)?'☑':'☐'}</Text>}
        </Pressable>}/>
    </SafeAreaView>
    {entry&&<ArtworkProvider artwork={entry.deck.artwork}><CardCollectionScreen detailTemplate={entry.deck.detailTemplate} cards={entry.deck.cards} locale={locale} assetRegistry={assetRegistry}
      scrollKey={`history:${entry.sessionId}`} hostTestID="history-session-host" scrollHeader headerContent={<>
        <Pressable accessibilityRole="button" style={styles.button} onPress={back}><Text style={styles.buttonText}>{t('historyBack',locale)}</Text></Pressable>
        <Text style={styles.heading}>{date(entry)}</Text><Text style={styles.copy}>{entry.deck.name[locale]} · {status(entry)}</Text>
        <Text style={styles.copy}>{t('drawnCount',locale,{count:entry.draws.length})}</Text><HistoryError/>
      </>}/></ArtworkProvider>}
  </View>;
}
const makeStyles=(colors:ThemeColors,typography:ThemeTypography)=>StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.canvas},hidden:{display:'none'},header:{padding:spacing.lg,gap:spacing.md},list:{padding:spacing.lg,gap:spacing.md},
  heading:{...typography.sectionHeading,color:colors.primary},copy:{...typography.body,color:colors.text},
  actions:{flexDirection:'row',flexWrap:'wrap',gap:spacing.md},button:{alignSelf:'flex-start',justifyContent:'center',minHeight:48,padding:spacing.md,borderRadius:radius.pill,backgroundColor:colors.primary},buttonText:{...typography.label,color:colors.onPrimary},
  record:{minHeight:48,padding:spacing.lg,gap:spacing.sm,borderWidth:1,borderColor:colors.border,borderRadius:radius.panel,backgroundColor:colors.surface},selected:{borderColor:colors.primary,backgroundColor:colors.selectedSurface},
});
