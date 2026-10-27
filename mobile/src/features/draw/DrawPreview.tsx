import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getLocales } from 'expo-localization';
import { SafeAreaView } from 'react-native-safe-area-context';
import { configuredDeck } from '../../decks';
import { resolveLocale, t } from '../../i18n/locale';
import { ShuffleScene } from './ShuffleScene';
import { useSession } from '../../session/SessionProvider';
import { colors, type, spacing, radius } from '../../ui/theme';
export function DrawPreview() {
 const locale=resolveLocale(getLocales().map(x=>x.languageTag)), session=useSession();
 const [active,setActive]=useState(AppState.currentState==='active'), [focused,setFocused]=useState(false),[reduced,setReduced]=useState(false);
 const {complete:completePhase}=session;
 const activeRef=useRef(AppState.currentState==='active'), focusedRef=useRef(false), deferred=useRef<{sessionId:string;epoch:number}|null>(null);
 const complete=useCallback((sessionId:string,epoch:number)=>{if(!activeRef.current||!focusedRef.current){deferred.current={sessionId,epoch};return;} completePhase(sessionId,epoch);},[completePhase]);
 useEffect(()=>{if(active&&focused&&deferred.current){const token=deferred.current;deferred.current=null;complete(token.sessionId,token.epoch);}},[active,focused,complete]);
 useEffect(()=>{const subscription=AppState.addEventListener('change',s=>{activeRef.current=s==='active';setActive(activeRef.current);}); AccessibilityInfo.isReduceMotionEnabled().then(setReduced);const reduce=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{subscription.remove();reduce.remove();};},[]);
 useFocusEffect(useCallback(()=>{focusedRef.current=true;setFocused(true);return()=>{focusedRef.current=false;setFocused(false);};},[]));
 const s=session.state;
 return <SafeAreaView style={styles.screen}>
  {session.error && <View><Text style={styles.error}>{t('entropyError',locale)}</Text><Pressable onPress={session.retry} accessibilityRole="button" style={styles.button}><Text style={styles.buttonText}>{t('retry',locale)}</Text></Pressable></View>}
  {s?.phase==='results'?<ScrollView contentContainerStyle={styles.results}><Text style={styles.title}>{t('results',locale)}</Text>{s.drawnIds.length===0&&<Text style={styles.copy}>{t('emptyResults',locale)}</Text>}{s.drawnIds.map(id=>{const c=configuredDeck.cards.find(card=>card.id===id)!;return <View key={id} style={styles.result}><Text style={styles.resultName}>{c.translations[locale].name}</Text><Text style={styles.copy}>{c.translations[locale].meaning}</Text></View>;})}<Pressable onPress={session.reset} accessibilityRole="button" style={styles.button}><Text style={styles.buttonText}>{t('newSession',locale)}</Text></Pressable></ScrollView>:s&&<><ShuffleScene state={s} deck={configuredDeck} locale={locale} onDraw={session.draw} onConfirm={session.confirm} onPhaseComplete={complete} paused={!active||!focused||session.error} reducedMotion={reduced}/><View style={styles.controls}><Text style={styles.status}>{t('remainingCount',locale,{count:s.remainingIds.length})}</Text><Pressable onPress={session.stop} disabled={s.drawQueued||!['regrip','ready','strip','contact','return','resume','lower'].includes(s.phase)} accessibilityRole="button" style={styles.secondaryButton}><Text style={styles.secondaryText}>{t('stop',locale)}</Text></Pressable></View></>}
 </SafeAreaView>;
}
const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:colors.canvas,padding:spacing.lg,gap:spacing.md},
 controls:{alignItems:'center',gap:spacing.sm},
 copy:{fontFamily:type.sans,color:colors.ink,fontSize:16,lineHeight:24},
 status:{fontFamily:type.sans,color:colors.mutedInk,fontSize:16,lineHeight:24,textAlign:'center',backgroundColor:colors.panel,borderRadius:radius.pill,paddingHorizontal:spacing.lg,paddingVertical:spacing.xs},
 title:{...type.title,fontFamily:type.serif,color:colors.deepForest},
 button:{backgroundColor:colors.deepForest,borderRadius:radius.pill,paddingHorizontal:spacing.xl,paddingVertical:spacing.md,minHeight:48,alignItems:'center'},
 buttonText:{...type.label,fontFamily:type.sans,color:colors.lightInk,textAlign:'center'},
 secondaryButton:{backgroundColor:colors.panel,borderWidth:1,borderColor:colors.sage,borderRadius:radius.pill,paddingHorizontal:spacing.xl,paddingVertical:spacing.md,minHeight:48,width:'100%',maxWidth:360,alignItems:'center'},
 secondaryText:{...type.label,fontFamily:type.sans,color:colors.forest,textAlign:'center'},
 error:{...type.body,fontFamily:type.sans,color:colors.ink},
 results:{gap:spacing.lg,padding:spacing.md,paddingBottom:spacing.xxl},
 result:{gap:spacing.sm,backgroundColor:colors.panel,borderRadius:radius.panel,padding:spacing.lg},
 resultName:{fontFamily:type.serif,fontSize:24,lineHeight:32,color:colors.deepForest},
});
