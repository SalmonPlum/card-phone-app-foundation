import {useEffect,useLayoutEffect,useRef,type ReactNode} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import type { Card, DetailTemplate, Locale } from '../../domain/contracts';
import {t} from '../../i18n/locale';
import { localizeCard } from '../../domain/deck';
import { compactFaceRect, readingFaceRect, type Rect } from './overlayGeometry';
import { CardDetailsText } from './CardDetailsText';
import { spacing } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

export type CardDetailReaderProps = {
  detailTemplate:DetailTemplate; card: Card; locale: Locale; expanded: Rect; scrollOffset: SharedValue<number>;
  headerHeight: number; onHeaderHeight: (height: number) => void; action?: ReactNode;
  topInset: number; bottomInset: number; reducedMotion: boolean; active: boolean;
  actionPosition?:'start'|'end'; scrollTestID?: string; onArtworkPress?:()=>void; artworkActionKey?:string;
};

/** One native scroll viewport avoids layout/offset feedback as the artwork band shrinks. */
export function CardDetailReader({detailTemplate,card,locale,expanded,scrollOffset,headerHeight,onHeaderHeight,action,topInset,bottomInset,reducedMotion,active,actionPosition='end',scrollTestID='overlay-details',onArtworkPress,artworkActionKey=String(card.id)}: CardDetailReaderProps) {
  const styles = useThemeStyles(makeStyles);
  const dragged=useRef(false);
  const actionState=useRef({key:artworkActionKey,active,used:false,callback:onArtworkPress});
  useLayoutEffect(()=>{
    const previous=actionState.current;
    actionState.current={key:artworkActionKey,active,used:previous.key===artworkActionKey&&!(active&&!previous.active)&&previous.used,callback:onArtworkPress};
  },[artworkActionKey,active,onArtworkPress]);
  useEffect(()=>()=>{actionState.current.active=false;},[]);
  const closeArtwork=()=>{
    const current=actionState.current;
    if(current.key!==artworkActionKey||!current.active||current.used||dragged.current||!current.callback)return;
    current.used=true;current.callback();
  };
  const top=topInset+headerHeight;
  const initial=reducedMotion?compactFaceRect(expanded):expanded;
  const onScroll=useAnimatedScrollHandler({onScroll:event=>{
    scrollOffset.set(Math.max(0,event.contentOffset.y));
  }});
  const bandStyle=useAnimatedStyle(()=>{
    const rect=reducedMotion?compactFaceRect(expanded):readingFaceRect(expanded,scrollOffset.value);
    return {height:Math.max(0,rect.y+rect.height+12-top)};
  });
  const hitStyle=useAnimatedStyle(()=>{
    const offset=Math.max(0,scrollOffset.value);
    const rect=reducedMotion?compactFaceRect(expanded):readingFaceRect(expanded,offset);
    return {left:rect.x,top:rect.y-top+offset,width:rect.width,height:rect.height};
  });
  return <View style={StyleSheet.absoluteFill} pointerEvents={active?'auto':'none'}
    accessibilityElementsHidden={!active} importantForAccessibility={active?'auto':'no-hide-descendants'}>
    <View testID="detail-header" style={[styles.header,{top:topInset}]} onLayout={event=>{
      const height=event.nativeEvent.layout.height;
      if(Number.isFinite(height)&&height>0) onHeaderHeight(height);
    }}>
      {actionPosition==='start'&&action}
      <Text accessibilityRole="header" style={styles.title}>{localizeCard(card,locale).name}</Text>
      {actionPosition==='end'&&action}
    </View>
    <Animated.ScrollView testID={scrollTestID} style={[styles.scroll,{top,bottom:0}]} scrollEnabled={active}
      onScroll={onScroll} onScrollBeginDrag={()=>{dragged.current=true;}} onScrollEndDrag={()=>{dragged.current=false;}} scrollEventThrottle={16} contentContainerStyle={[styles.content,{paddingBottom:spacing.xxl+bottomInset}]}>
      <View testID="detail-artwork-spacer" style={{height:Math.max(0,initial.y+initial.height+12-top)}}/>
      <View style={styles.sections}><CardDetailsText detailTemplate={detailTemplate} card={card} locale={locale} includeName={false}/></View>
      {onArtworkPress&&<Animated.View testID="detail-artwork-hit-area" style={[styles.hitArea,hitStyle]}>
        <Pressable testID="detail-artwork-close" accessibilityRole="button" accessibilityLabel={t('closeCardDetails',locale)}
          accessibilityActions={[{name:'activate',label:t('closeCardDetails',locale)}]}
          onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate'){dragged.current=false;closeArtwork();}}}
          onAccessibilityTap={()=>{dragged.current=false;closeArtwork();}}
          disabled={!active} onPressIn={()=>{dragged.current=false;}} onPress={closeArtwork} style={StyleSheet.absoluteFill}/>
      </Animated.View>}
    </Animated.ScrollView>
    <Animated.View testID="detail-artwork-mask" pointerEvents="none" style={[styles.band,{top},bandStyle]}/>
  </View>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  hitArea:{position:'absolute'},
  header:{position:'absolute',left:0,right:0,flexDirection:'row',alignItems:'center',gap:spacing.md,paddingHorizontal:spacing.lg,paddingVertical:spacing.sm,backgroundColor:colors.canvas},
  title:{...typography.cardTitle,color:colors.primary,flex:1,minWidth:0},
  scroll:{position:'absolute',left:0,right:0},
  content:{paddingBottom:spacing.xxl},
  sections:{padding:spacing.lg,gap:spacing.lg},
  band:{position:'absolute',left:0,right:0,backgroundColor:colors.canvas},
});
