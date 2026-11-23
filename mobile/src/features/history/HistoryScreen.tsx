import {useCallback,useEffect,useRef,useState} from 'react';
import {Alert,BackHandler,FlatList,Pressable,StyleSheet,Text,View} from 'react-native';
import {Redirect,useIsFocused} from 'expo-router';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import {useHistory} from '../../history/HistoryProvider';
import type {HistorySession} from '../../history/archive';
import {ArtworkProvider} from '../../artwork/ArtworkProvider';
import {assetRegistry} from '../../decks/assets';
import {useLocale} from '../../i18n/useLocale';
import {t} from '../../i18n/locale';
import {useDockHeight} from '../../navigation/useDockHeight';
import {spacing,radius} from '../../ui/theme';
import {IconButton} from '../../ui/IconButton';
import {useThemeStyles,type ThemeColors,type ThemeTypography} from '../../ui/useThemeStyles';
import {CardCollectionScreen} from '../cards/CardCollectionScreen';
import {HistoryError} from './HistorySettings';

export function HistoryScreen(){
  const insets=useSafeAreaInsets();
  const history=useHistory(),locale=useLocale(),styles=useThemeStyles(makeStyles),focused=useIsFocused(),dock=useDockHeight();
  const [selected,setSelected]=useState<string|null>(null);
  const [selection,setSelection]=useState({source:history.archive.sessions,ids:[] as string[]});
  let ids=selection.ids;
  // Reconcile on source changes before committing UI, without an effect/render cycle.
  if(selection.source!==history.archive.sessions){
    ids=ids.filter(id=>history.archive.sessions.some(item=>item.sessionId===id));
    setSelection({source:history.archive.sessions,ids});
  }
  const setIds=useCallback((next:string[]|((current:string[])=>string[]))=>{
    setSelection(current=>({...current,ids:typeof next==='function'?next(current.ids):next}));
  },[]);
  const [toolbarHeight,setToolbarHeight]=useState(64);
  const heldRecord=useRef<string|null>(null);
  const chosen=ids.filter(id=>history.archive.sessions.some(item=>item.sessionId===id));
  const selecting=chosen.length>0;
  const entry=history.archive.sessions.find(item=>item.sessionId===selected);
  const entryId=entry?.sessionId;
  const back=useCallback(()=>setSelected(null),[]);
  const cancelSelection=useCallback(()=>{setIds([]);heldRecord.current=null;},[setIds]);
  useEffect(()=>{
    if(!focused||(!entryId&&!selecting))return;
    const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{if(entryId)back();else cancelSelection();return true;});
    return()=>subscription.remove();
  },[focused,entryId,selecting,back,cancelSelection]);
  if(!history.ready)return <SafeAreaView style={styles.screen}><Text style={styles.copy}>{t('historyLoading',locale)}</Text></SafeAreaView>;
  if(!history.archive.enabled)return <Redirect href="/"/>;
  const selectRecord=(id:string,held=false)=>{
    heldRecord.current=held?id:null;
    setIds(old=>selecting?(old.includes(id)?old:[...old,id]):[id]);
  };
  const date=(item:HistorySession)=>new Intl.DateTimeFormat(locale==='cs'?'cs-CZ':'en-GB',{dateStyle:'medium',timeStyle:'short'}).format(item.firstRevealedAt);
  const deleteSelected=()=>{
    if(!chosen.length)return;
    const deleting=[...chosen];
    Alert.alert(t('historyDeleteTitle',locale),t('historyDeleteMessage',locale,{count:deleting.length}),[
      {text:t('cancel',locale),style:'cancel'},
      {text:t('historyDeleteSelected',locale,{count:deleting.length}),style:'destructive',onPress:()=>{void history.controller?.deleteSessions(deleting);cancelSelection();}},
    ]);
  };
  return <View style={styles.screen}>
    <SafeAreaView edges={['top','left','right']} style={[styles.screen,entry?styles.hidden:null]} accessibilityElementsHidden={!!entry} importantForAccessibility={entry?'no-hide-descendants':'auto'}>
      <View testID="history-list-header" style={[styles.header,{minHeight:toolbarHeight+spacing.md}]}>
        <Text accessibilityElementsHidden={selecting} importantForAccessibility={selecting?'no-hide-descendants':'auto'} style={[styles.hint,selecting&&styles.invisible]}>{t('historyRetention',locale)}</Text>
      </View>
      <View style={styles.errors}><HistoryError/></View>
      <FlatList testID="history-list" data={history.archive.sessions} keyExtractor={item=>item.sessionId}
        contentContainerStyle={[styles.list,{paddingBottom:dock+spacing.xl}]} ListEmptyComponent={<View style={styles.header}>
          <Text style={styles.copy}>{t('historyEmpty',locale)}</Text>
          {!history.recordingSessionId&&<Text style={styles.copy}>{t('historyStartsNextSession',locale)}</Text>}
        </View>}
        renderItem={({item})=><Pressable testID={`history-session-${item.sessionId}`} accessibilityRole={selecting?'checkbox':'button'}
          accessibilityState={selecting?{checked:chosen.includes(item.sessionId)}:undefined}
          accessibilityLabel={t('historySessionLabel',locale,{date:date(item),count:item.draws.length})}
          style={[styles.record,chosen.includes(item.sessionId)&&styles.selected]}
          delayLongPress={500} onPressIn={()=>{heldRecord.current=null;}} onLongPress={()=>selectRecord(item.sessionId,true)}
          onPressOut={()=>{if(heldRecord.current===item.sessionId)heldRecord.current=null;}}
          accessibilityActions={[{name:'select',label:t('historySelect',locale)}]}
          onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='select')selectRecord(item.sessionId);}}
          onPress={()=>{if(heldRecord.current===item.sessionId){heldRecord.current=null;return;}if(selecting)setIds(old=>old.includes(item.sessionId)?old.filter(id=>id!==item.sessionId):[...old,item.sessionId]);else setSelected(item.sessionId);}}>
          <Text style={[styles.date,chosen.includes(item.sessionId)&&styles.selectedText]}>{date(item)}</Text>
          <Text style={[styles.hint,chosen.includes(item.sessionId)&&styles.selectedText]}>{t('drawnCount',locale,{count:item.draws.length})}</Text>
        </Pressable>}/>
      <View testID="history-selection-toolbar" pointerEvents={selecting?'auto':'none'}
        accessibilityElementsHidden={!selecting} importantForAccessibility={selecting?'auto':'no-hide-descendants'}
        style={[styles.toolbar,{top:insets.top+spacing.sm,left:insets.left+spacing.lg,right:insets.right+spacing.lg},!selecting&&styles.invisible]}
        onLayout={event=>{const height=event.nativeEvent.layout.height;if(Number.isFinite(height)&&height>0)setToolbarHeight(previous=>Math.max(previous,height));}}>
        <IconButton icon="close" label={t('cancel',locale)} onPress={cancelSelection} disabled={!selecting}/>
        <Text accessibilityLiveRegion="polite" style={styles.count}>{t('historySelectedCount',locale,{count:chosen.length})}</Text>
        <IconButton icon="trash" label={t('historyDeleteSelected',locale,{count:chosen.length})} onPress={deleteSelected} disabled={!selecting}/>
      </View>
    </SafeAreaView>
    {entry&&<ArtworkProvider artwork={entry.deck.artwork}><CardCollectionScreen detailTemplate={entry.deck.detailTemplate} cards={entry.deck.cards} locale={locale} assetRegistry={assetRegistry}
      scrollKey={`history:${entry.sessionId}`} hostTestID="history-session-host" scrollHeader headerContent={<>
        <View testID="history-reading-header" style={styles.readingHeader}>
          <IconButton variant="circle" icon="back" label={t('historyBack',locale)} onPress={back}/>
          <View style={styles.readingInfo}><Text style={styles.date}>{date(entry)}</Text>
            <Text style={styles.hint}>{t('drawnCount',locale,{count:entry.draws.length})}</Text></View>
        </View><HistoryError/>
      </>}/></ArtworkProvider>}
  </View>;
}
const makeStyles=(colors:ThemeColors,typography:ThemeTypography)=>StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.canvas},hidden:{display:'none'},invisible:{opacity:0},
  header:{padding:spacing.lg,gap:spacing.sm,justifyContent:'center'},errors:{paddingHorizontal:spacing.lg},list:{padding:spacing.lg,gap:spacing.sm},
  date:{...typography.label,color:colors.primary},copy:{...typography.body,color:colors.text},hint:{...typography.caption,color:colors.mutedText},selectedText:{color:colors.onSelected},
  count:{...typography.label,color:colors.primary,textAlign:'center',flex:1,minWidth:0},
  toolbar:{position:'absolute',minHeight:64,padding:spacing.sm,gap:spacing.sm,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:colors.border,borderRadius:radius.pill,backgroundColor:colors.surface,
    shadowColor:colors.shadow,shadowOpacity:.12,shadowOffset:{width:0,height:2},shadowRadius:6,elevation:4},
  readingHeader:{flexDirection:'row',alignItems:'center',gap:spacing.sm},readingInfo:{flex:1,minWidth:0,gap:2},
  record:{minHeight:48,padding:spacing.lg,gap:spacing.xs,borderWidth:1,borderColor:colors.border,borderRadius:radius.panel,backgroundColor:colors.surface},selected:{borderColor:colors.primary,backgroundColor:colors.selectedSurface},
});
