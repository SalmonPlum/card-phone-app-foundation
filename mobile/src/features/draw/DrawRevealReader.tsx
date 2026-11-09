import {useRef} from 'react';
import {ScrollView,Pressable,StyleSheet,Text,View} from 'react-native';
import Animated,{useAnimatedScrollHandler,useAnimatedStyle,useSharedValue,type SharedValue} from 'react-native-reanimated';
import type {Card,DetailTemplate,Locale,Pose,SessionState} from '../../domain/contracts';
import {t} from '../../i18n/locale';
import {CardDetailsText} from '../cards/CardDetailsText';
import type {RenderFrame} from './renderFrame';
import {drawReadingPose,type DrawReadingState} from './revealReading';
import { spacing } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

type Props={
  detailTemplate:DetailTemplate;card?:Card;locale:Locale;phase:SessionState['phase'];paused:boolean;reducedMotion:boolean;
  frame:SharedValue<RenderFrame>;reading:SharedValue<DrawReadingState>;readingKey:string;
  target:Pose;artworkHeight?:number;hostHeight:number;headerHeight:number;bottomClearance?:number;
  onHeaderHeight:(height:number)=>void;onHintsHeight:(height:number)=>void;
  onConfirm:()=>void;onReveal?:()=>void;assetFailed:boolean;onRetry:()=>void;
};
/** The visual face stays in Stack. This scroll descendant owns only its pinned tap target. */
export function DrawRevealReader({detailTemplate,card,locale,phase,paused,reducedMotion,frame,reading,readingKey,target,artworkHeight=357,hostHeight,headerHeight,onHeaderHeight,onHintsHeight,onConfirm,onReveal,assetFailed,onRetry,bottomClearance=0}:Props){
  const styles = useThemeStyles(makeStyles);
  const nativeOffset=useSharedValue(0),dragged=useRef(false);
  const foreground=['lift','awaitingReveal','flip','reveal','resume'].includes(phase);
  const waiting=phase==='awaitingReveal';
  const enabled=phase==='reveal'&&!paused;
  const expandedBottom=target.y+artworkHeight/2*target.scale;
  const spacer=Math.max(0,expandedBottom+12-headerHeight);
  const onScroll=useAnimatedScrollHandler({onScroll:event=>{
    const offset=Math.max(0,event.contentOffset.y);
    // Track delivered native movement even while gestures are disabled during
    // a pause; freezing only the face would misalign it with moving content.
    nativeOffset.value=offset;
    if(frame.value.phase==='reveal'&&reading.value.key===readingKey) reading.set({key:readingKey,offset});
  }});
  // Translation pins the hit target inside the native scroll responder. Absolute
  // children shrink without changing the expanded spacer/content height.
  const stickyStyle=useAnimatedStyle(()=>({transform:[{translateY:nativeOffset.value}]}));
  const bandStyle=useAnimatedStyle(()=>{
    const pose=drawReadingPose(target,reading.value.offset,reducedMotion,artworkHeight);
    return {height:Math.max(0,pose.y+artworkHeight/2*pose.scale+12-headerHeight)};
  });
  const hitStyle=useAnimatedStyle(()=>{
    const pose=drawReadingPose(target,reading.value.offset,reducedMotion,artworkHeight);
    return {left:pose.x-119*pose.scale,top:pose.y-artworkHeight/2*pose.scale-headerHeight,width:238*pose.scale,height:artworkHeight*pose.scale};
  });
  return <View style={StyleSheet.absoluteFill} pointerEvents={foreground?'box-none':'none'}
    accessibilityElementsHidden={!foreground} importantForAccessibility={foreground?'auto':'no-hide-descendants'}>
    <View testID="draw-reveal-header" style={[styles.header,waiting&&{opacity:0}]} accessibilityElementsHidden={phase!=='reveal'} importantForAccessibility={phase==='reveal'?'auto':'no-hide-descendants'}
      onLayout={event=>{const height=event.nativeEvent.layout.height;if(Number.isFinite(height)&&height>0)onHeaderHeight(height);}}>
      <Text accessibilityRole="header" style={styles.name}>{card?.translations[locale].name}</Text>
    </View>
    <Animated.ScrollView testID="draw-reveal-scroll" style={[styles.scroll,{top:headerHeight}]} pointerEvents={waiting?'none':'auto'}
      accessibilityElementsHidden={waiting} importantForAccessibility={waiting?'no-hide-descendants':'auto'} scrollEnabled={enabled}
      scrollsToTop={phase==='reveal'} removeClippedSubviews={false} onScroll={onScroll} scrollEventThrottle={16}
      onScrollBeginDrag={()=>{dragged.current=true;}} contentContainerStyle={[styles.content,{paddingBottom:spacing.xxl+bottomClearance}]}>
      <Animated.View testID="draw-reading-artwork-band" collapsable={false} pointerEvents="box-none" style={[styles.artworkHeader,{height:spacer},stickyStyle]}>
        <Animated.View pointerEvents="none" style={[styles.band,bandStyle]}/>
        <Animated.View testID="draw-reading-hitbox" pointerEvents="box-none" style={[styles.hitbox,hitStyle]}>
          <Pressable testID="draw-foreground-confirm" style={StyleSheet.absoluteFill} accessibilityRole="button"
            accessibilityLabel={t('confirm',locale)} accessibilityHint={t('swipeUpForDetails',locale)} disabled={!enabled}
            onPressIn={()=>{dragged.current=false;}} onPress={()=>{if(!dragged.current)onConfirm();}}
            accessibilityActions={[{name:'activate',label:t('confirm',locale)}]}
            onAccessibilityTap={onConfirm} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')onConfirm();}}/>
        </Animated.View>
      </Animated.View>
      <View testID="draw-reading-info" style={{minHeight:Math.max(0,hostHeight-expandedBottom-12)}}
        accessibilityElementsHidden={phase!=='reveal'} importantForAccessibility={phase==='reveal'?'auto':'no-hide-descendants'}>
        <View testID="draw-reveal-hints" style={[styles.hints,waiting&&{opacity:0}]} onLayout={event=>onHintsHeight(event.nativeEvent.layout.height)}>
          <Text style={styles.hint}>{t('swipeUpForDetails',locale)}</Text>
          <Text style={styles.hint}>{t('tapCardToConfirm',locale)}</Text>
          {assetFailed&&<Pressable accessibilityRole="button" accessibilityLabel={t('retry',locale)} onPress={onRetry} style={styles.retry}>
            <Text style={styles.error}>{t('assetError',locale)} {t('retry',locale)}</Text>
          </Pressable>}
        </View>
      </View>
      {card&&(phase==='reveal'||phase==='resume')&&<View testID="draw-card-information" style={styles.sections}
        accessibilityElementsHidden={phase!=='reveal'} importantForAccessibility={phase==='reveal'?'auto':'no-hide-descendants'}>
        <CardDetailsText detailTemplate={detailTemplate} card={card} locale={locale} includeName={false}/>
      </View>}
    </Animated.ScrollView>
    {waiting&&<View testID="draw-manual-reveal" style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable key="flip-action" testID="draw-flip-card" accessibilityRole="button" accessibilityLabel={t('flipCard',locale)}
        accessibilityHint={t('tapCardToReveal',locale)} disabled={paused}
        style={{position:'absolute',left:target.x-119*target.scale,top:target.y-artworkHeight/2*target.scale,width:238*target.scale,height:artworkHeight*target.scale}}
        onPress={onReveal} onAccessibilityTap={onReveal}
        accessibilityActions={[{name:'activate',label:t('flipCard',locale)}]}
        onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')onReveal?.();}}/>
      <ScrollView style={{position:'absolute',left:0,right:0,top:expandedBottom+12,bottom:0}} contentContainerStyle={styles.hints}>
        <Text style={styles.hint}>{t('tapCardToReveal',locale)}</Text>
      </ScrollView>
    </View>}
  </View>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  header:{position:'absolute',left:0,right:0,top:0,minHeight:64,paddingHorizontal:spacing.lg,paddingVertical:spacing.sm,justifyContent:'center',backgroundColor:colors.canvas},
  name:{...typography.cardTitle,color:colors.primary,textAlign:'center'},
  scroll:{position:'absolute',left:0,right:0,bottom:0},
  content:{paddingBottom:spacing.xxl},
  artworkHeader:{zIndex:2},
  band:{position:'absolute',left:0,right:0,top:0,backgroundColor:colors.canvas},
  hitbox:{position:'absolute'},
  hints:{padding:spacing.sm,gap:spacing.xs,alignItems:'center'},
  hint:{...typography.caption,color:colors.mutedText,textAlign:'center'},
  sections:{padding:spacing.lg,gap:spacing.lg},
  retry:{minHeight:48,padding:spacing.sm,justifyContent:'center'},
  error:{...typography.body,color:colors.text,textAlign:'center'},
});
