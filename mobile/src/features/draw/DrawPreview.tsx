import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { configuredDeck } from '../../decks';
import { t } from '../../i18n/locale';
import { useLocale } from '../../i18n/useLocale';
import { ShuffleScene } from './ShuffleScene';
import { useSession } from '../../session/SessionProvider';
import { colors, type, spacing, radius } from '../../ui/theme';
import { ResultsScreen } from '../results/ResultsScreen';
export function DrawPreview() {
 const locale=useLocale(), session=useSession();
 const [active,setActive]=useState(AppState.currentState==='active'), [focused,setFocused]=useState(false),[reduced,setReduced]=useState(false);
 const {complete:completePhase}=session;
 const activeRef=useRef(AppState.currentState==='active'), focusedRef=useRef(false), deferred=useRef<{sessionId:string;epoch:number}|null>(null);
 const complete=useCallback((sessionId:string,epoch:number)=>{if(!activeRef.current||!focusedRef.current){deferred.current={sessionId,epoch};return;} completePhase(sessionId,epoch);},[completePhase]);
 useEffect(()=>{if(active&&focused&&deferred.current){const token=deferred.current;deferred.current=null;complete(token.sessionId,token.epoch);}},[active,focused,complete]);
 useEffect(()=>{const subscription=AppState.addEventListener('change',s=>{activeRef.current=s==='active';setActive(activeRef.current);}); AccessibilityInfo.isReduceMotionEnabled().then(setReduced);const reduce=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{subscription.remove();reduce.remove();};},[]);
 useFocusEffect(useCallback(()=>{focusedRef.current=true;setFocused(true);return()=>{focusedRef.current=false;setFocused(false);};},[]));
 const s=session.state;
 if(s?.phase==='results') return <ResultsScreen />;
 return <SafeAreaView testID="draw-screen" edges={['top','left','right']} style={styles.screen}>
  {session.error && <View><Text style={styles.error}>{t('entropyError',locale)}</Text><Pressable onPress={session.retry} accessibilityRole="button" style={styles.button}><Text style={styles.buttonText}>{t('retry',locale)}</Text></Pressable></View>}
  {s&&<ScrollView style={styles.drawingScroll} contentContainerStyle={styles.drawing}><ShuffleScene state={s} deck={configuredDeck} locale={locale} onDraw={session.draw} onConfirm={session.confirm} onPhaseComplete={complete} paused={!active||!focused||session.error} reducedMotion={reduced}/><View style={styles.controls}><Text style={styles.status}>{t('remainingCount',locale,{count:s.remainingIds.length})}</Text><Pressable onPress={session.stop} disabled={s.drawQueued||!['regrip','ready','strip','contact','return','resume','lower'].includes(s.phase)} accessibilityRole="button" style={styles.secondaryButton}><Text style={styles.secondaryText}>{t('stop',locale)}</Text></Pressable></View></ScrollView>}
 </SafeAreaView>;
}
const styles=StyleSheet.create({
 drawingScroll:{flex:1},
 drawing:{flexGrow:1,gap:spacing.md},
 screen:{flex:1,backgroundColor:colors.canvas,padding:spacing.lg,gap:spacing.md},
 controls:{alignItems:'center',gap:spacing.sm},
 status:{fontFamily:type.sans,color:colors.mutedInk,fontSize:16,lineHeight:24,textAlign:'center',backgroundColor:colors.panel,borderRadius:radius.pill,paddingHorizontal:spacing.lg,paddingVertical:spacing.xs},
 button:{backgroundColor:colors.deepForest,borderRadius:radius.pill,paddingHorizontal:spacing.xl,paddingVertical:spacing.md,minHeight:48,alignItems:'center'},
 buttonText:{...type.label,fontFamily:type.sans,color:colors.lightInk,textAlign:'center'},
 secondaryButton:{backgroundColor:colors.panel,borderWidth:1,borderColor:colors.sage,borderRadius:radius.pill,paddingHorizontal:spacing.xl,paddingVertical:spacing.md,minHeight:48,width:'100%',maxWidth:360,alignItems:'center'},
 secondaryText:{...type.label,fontFamily:type.sans,color:colors.forest,textAlign:'center'},
 error:{...type.body,fontFamily:type.sans,color:colors.ink},
});
