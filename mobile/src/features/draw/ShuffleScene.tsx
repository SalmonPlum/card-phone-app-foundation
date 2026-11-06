import {useCallback,useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import type { DeckManifest, Locale, Pose, SessionState } from '../../domain/contracts';
import { assetRegistry, type AssetRegistry } from '../../decks/assets';
import { t } from '../../i18n/locale';
import {DrawRevealReader} from './DrawRevealReader';
import {drawReadingKey,type DrawReadingState} from './revealReading';
import { Stack } from './Stack';
import { ShuffleSurface } from './ShuffleSurface';
import { useShuffleAnimation } from './useShuffleAnimation';
import { confirmationExit, ease } from './motion';
import { fitDrawForeground } from './foreground';
import { spacing, radius } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

type Props={state:SessionState;deck:DeckManifest;locale:Locale;onDraw:(pose:Pose,sessionId:string,epoch:number)=>void;onConfirm:()=>void;onReveal?:(sessionId:string,epoch:number)=>void;onPhaseComplete:(sessionId:string,epoch:number)=>void;paused:boolean;reducedMotion?:boolean;footer?:ReactNode;bottomClearance?:number};
export function ShuffleScene({state,deck,locale,onDraw,onConfirm,onReveal,onPhaseComplete,paused,reducedMotion=false,footer,bottomClearance=0}:Props) {
  const styles = useThemeStyles(makeStyles);
  const [size,setSize]=useState({width:0,height:0});
  const [mat,setMat]=useState<{x:number;y:number;width:number;height:number}|null>(null);
  const [captionHeight,setCaptionHeight]=useState(0),[headerHeight,setHeaderHeight]=useState(64);
  const [failedId,setFailedId]=useState<number|null>(null);
  const scrollOffset=useSharedValue(0);
  const readingKey=drawReadingKey(state);
  const reading=useSharedValue<DrawReadingState>({key:readingKey,offset:0});
  const latest=useRef({state,paused}),live=useRef(true);
  useLayoutEffect(()=>{latest.current={state,paused};},[state,paused]);
  useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
  const confirm=useCallback(()=>{
    const current=latest.current;
    if(live.current&&!current.paused&&current.state.phase==='reveal'&&current.state.sessionId===state.sessionId&&current.state.epoch===state.epoch) onConfirm();
  },[onConfirm,state.sessionId,state.epoch]);
  const reveal=useCallback(()=>{
    const current=latest.current;
    if(live.current&&!current.paused&&current.state.phase==='awaitingReveal'&&current.state.sessionId===state.sessionId&&current.state.epoch===state.epoch) onReveal?.(state.sessionId,state.epoch);
  },[onReveal,state.sessionId,state.epoch]);
  const {fontScale}=useWindowDimensions();
  // Keep the last revealed artwork through the RN→UI confirmation boundary.
  const displayId=state.selectedId ?? state.drawnIds.at(-1) ?? null;
  const assetFailed=displayId!==null && failedId===displayId;
  const {progress,frame,samplePose}=useShuffleAnimation(state,paused,reducedMotion,onPhaseComplete,reading);
  const selected=deck.cards.find(c=>c.id===displayId), name=selected?.translations[locale].name;
  const faceKey=selected?.translations[locale].faceAsset ?? selected?.faceAsset;
  const assets:AssetRegistry=assetRegistry;
  const back=assets[deck.localizedBackAssets?.[locale] ?? deck.backAsset];
  const usableSize={width:size.width,height:Math.max(0,size.height-bottomClearance)};
  const bounds=mat ?? {...usableSize,x:0,y:0};
  const scale=Math.min(bounds.width/900,bounds.height/960);
  const scene={x:bounds.x+(bounds.width-900*scale)/2,y:bounds.y+(bounds.height-960*scale)/2,scale};
  // Reserve hints for the large first view; long hints/info share the reader scroll.
  const captionLimit=usableSize.height>0?usableSize.height*.25:48*fontScale+20;
  const panelHeight=Math.min(captionHeight || 48*fontScale+20,captionLimit);
  const target=fitDrawForeground(usableSize,panelHeight,headerHeight);
  const foreground=['lift','awaitingReveal','flip','reveal','resume'].includes(state.phase);
  const canDraw=['regrip','ready','strip','contact','return','lower'].includes(state.phase)&&!state.drawQueued&&!paused;
  // Visibility follows the same UI frame as the selected image, so RN cannot
  // hide its caption early or leave it behind after confirmation.
  const captionStyle=useAnimatedStyle(()=>{
    const exit=confirmationExit(progress.value);
    const resuming=frame.value.phase==='resume';
    return {opacity:resuming?exit.opacity:frame.value.phase==='reveal'||frame.value.phase==='awaitingReveal'?1:0,transform:[{translateY:resuming?-exit.rise:0}]};
  });
  const dimStyle=useAnimatedStyle(()=>{
    const phase=frame.value.phase;
    const opacity=phase==='lift'?ease(progress.value):phase==='awaitingReveal'||phase==='flip'||phase==='reveal'?1:phase==='resume'?(frame.value.remaining===0?1:confirmationExit(progress.value).coverOpacity):0;
    return {opacity};
  });
  return <View testID="draw-stage" style={styles.stage} onLayout={e=>setSize(e.nativeEvent.layout)}>
    <ScrollView testID="shuffle-scroll" style={[styles.scroll,{marginBottom:bottomClearance}]} contentContainerStyle={styles.content} scrollEnabled={!foreground} scrollsToTop={!foreground}
      pointerEvents={foreground?'none':'auto'} accessibilityElementsHidden={foreground} importantForAccessibility={foreground?'no-hide-descendants':'auto'}
      onScroll={e=>{scrollOffset.value=e.nativeEvent.contentOffset.y;}} scrollEventThrottle={16}>
      <View testID="shuffle-mat" style={styles.mat} onLayout={e=>setMat(e.nativeEvent.layout)}>
        <ShuffleSurface/>
        {scale>0 && <View pointerEvents="none" style={{position:'absolute',width:900,height:960,left:(bounds.width-900)/2,top:(bounds.height-960)/2,transform:[{scale}]}}>
          {(['intact','source','receiver','flying'] as const).map(role=><Stack key={role} role={role} frame={frame} progress={progress} back={back}/>)}
        </View>}
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t('draw',locale)} disabled={!canDraw} onPress={()=>samplePose(onDraw)}>
          <Text style={[styles.drawHint,{opacity:canDraw?1:0}]} accessibilityElementsHidden={!canDraw}
            importantForAccessibility={canDraw?'auto':'no-hide-descendants'}>{t('tapToDraw',locale)}</Text>
        </Pressable>
      </View>
      {footer}
    </ScrollView>
    <Animated.View testID="draw-foreground-dim" pointerEvents="none" accessible={false}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.dim,dimStyle]}/>
    <Animated.View testID="draw-reveal-caption" pointerEvents={(state.phase==='reveal'||state.phase==='awaitingReveal')&&!paused?'box-none':'none'} style={[StyleSheet.absoluteFill,captionStyle]}>
      <DrawRevealReader detailTemplate={deck.detailTemplate} key={readingKey} card={selected} locale={locale} phase={state.phase} paused={paused} reducedMotion={reducedMotion}
        frame={frame} reading={reading} readingKey={readingKey} target={target} hostHeight={usableSize.height} bottomClearance={bottomClearance} headerHeight={headerHeight}
        onHeaderHeight={setHeaderHeight} onHintsHeight={setCaptionHeight} onConfirm={confirm} onReveal={reveal} assetFailed={assetFailed} onRetry={()=>setFailedId(null)}/>
    </Animated.View>
    {/* The selected image never changes parent when the user starts reading. */}
    <View pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:scale>0?1:0}]}>
      <Stack role="selected" frame={frame} progress={progress} back={back}
        face={!assetFailed&&faceKey?assets[faceKey]:undefined} name={name} onAssetError={()=>setFailedId(displayId)}
        viewport={{scene,target,scrollOffset,reading,reducedMotion}}/>
    </View>
  </View>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  stage:{flex:1,overflow:'hidden'},
  dim:{...StyleSheet.absoluteFill,backgroundColor:colors.canvas},
  scroll:{flex:1},
  content:{flexGrow:1,padding:spacing.lg,gap:spacing.md},
  mat:{flex:1,overflow:'hidden',backgroundColor:colors.mat,borderRadius:radius.mat,minHeight:260},
  drawHint:{...typography.caption,color:colors.onMat,textAlign:'center',position:'absolute',bottom:spacing.lg,left:spacing.lg,right:spacing.lg},
});
