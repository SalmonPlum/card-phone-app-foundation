import {useDockHeight} from '../../navigation/useDockHeight';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { configuredDeck } from '../../decks';
import { t } from '../../i18n/locale';
import { useLocale } from '../../i18n/useLocale';
import { ShuffleScene } from './ShuffleScene';
import { useSession } from '../../session/SessionProvider';
import { spacing, radius } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';
import { ResultsScreen } from '../results/ResultsScreen';
export function DrawPreview() {
  const styles = useThemeStyles(makeStyles);
  const dockHeight = useDockHeight();
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
  {s&&<ShuffleScene bottomClearance={dockHeight} state={s} deck={configuredDeck} locale={locale} onDraw={session.draw} onConfirm={session.confirm} onReveal={session.reveal} onPhaseComplete={complete} paused={!active||!focused||session.error||!session.preferencesReady} reducedMotion={reduced} footer={<View style={styles.controls}><Text style={styles.status}>{t('remainingCount',locale,{count:s.remainingIds.length})}</Text><Pressable onPress={session.stop} disabled={s.drawQueued||!['regrip','ready','strip','contact','return','resume','lower'].includes(s.phase)} accessibilityRole="button" style={styles.secondaryButton}><Text style={styles.secondaryText}>{t('stop',locale)}</Text></Pressable></View>}/>}
 </SafeAreaView>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
 screen:{flex:1,backgroundColor:colors.canvas,gap:spacing.md},
 controls:{alignItems:'center',gap:spacing.sm},
 status:{...typography.caption,color:colors.mutedText,textAlign:'center',backgroundColor:colors.surface,borderRadius:radius.pill,paddingHorizontal:spacing.lg,paddingVertical:spacing.xs},
 button:{backgroundColor:colors.primary,borderRadius:radius.pill,paddingHorizontal:spacing.xl,paddingVertical:spacing.md,minHeight:48,alignItems:'center'},
 buttonText:{...typography.label,color:colors.onPrimary,textAlign:'center'},
 secondaryButton:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.pill,paddingHorizontal:spacing.xl,paddingVertical:spacing.md,minHeight:48,width:'100%',maxWidth:360,alignItems:'center'},
 secondaryText:{...typography.label,color:colors.primary,textAlign:'center'},
 error:{...typography.body,color:colors.text},
});
