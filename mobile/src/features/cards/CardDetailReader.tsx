import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import type { Card, DetailTemplate, Locale } from '../../domain/contracts';
import { localizeCard } from '../../domain/deck';
import { compactFaceRect, readingFaceRect, type Rect } from './overlayGeometry';
import { CardDetailsText } from './CardDetailsText';
import { spacing } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

export type CardDetailReaderProps = {
  detailTemplate:DetailTemplate; card: Card; locale: Locale; expanded: Rect; scrollOffset: SharedValue<number>;
  headerHeight: number; onHeaderHeight: (height: number) => void; action?: ReactNode;
  topInset: number; bottomInset: number; reducedMotion: boolean; active: boolean;
  scrollTestID?: string;
};

/** One native scroll viewport avoids layout/offset feedback as the artwork band shrinks. */
export function CardDetailReader({detailTemplate,card,locale,expanded,scrollOffset,headerHeight,onHeaderHeight,action,topInset,bottomInset,reducedMotion,active,scrollTestID='overlay-details'}: CardDetailReaderProps) {
  const styles = useThemeStyles(makeStyles);
  const top=topInset+headerHeight;
  const initial=reducedMotion?compactFaceRect(expanded):expanded;
  const onScroll=useAnimatedScrollHandler({onScroll:event=>{
    scrollOffset.set(Math.max(0,event.contentOffset.y));
  }});
  const bandStyle=useAnimatedStyle(()=>{
    const rect=reducedMotion?compactFaceRect(expanded):readingFaceRect(expanded,scrollOffset.value);
    return {height:Math.max(0,rect.y+rect.height+12-top)};
  });
  return <View style={StyleSheet.absoluteFill} pointerEvents={active?'auto':'none'}
    accessibilityElementsHidden={!active} importantForAccessibility={active?'auto':'no-hide-descendants'}>
    <View testID="detail-header" style={[styles.header,{top:topInset}]} onLayout={event=>{
      const height=event.nativeEvent.layout.height;
      if(Number.isFinite(height)&&height>0) onHeaderHeight(height);
    }}>
      <Text accessibilityRole="header" style={styles.title}>{localizeCard(card,locale).name}</Text>
      {action}
    </View>
    <Animated.ScrollView testID={scrollTestID} style={[styles.scroll,{top,bottom:0}]} scrollEnabled={active}
      onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={[styles.content,{paddingBottom:spacing.xxl+bottomInset}]}>
      <View testID="detail-artwork-spacer" style={{height:Math.max(0,initial.y+initial.height+12-top)}}/>
      <View style={styles.sections}><CardDetailsText detailTemplate={detailTemplate} card={card} locale={locale} includeName={false}/></View>
    </Animated.ScrollView>
    <Animated.View testID="detail-artwork-mask" pointerEvents="none" style={[styles.band,{top},bandStyle]}/>
  </View>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  header:{position:'absolute',left:0,right:0,flexDirection:'row',alignItems:'center',gap:spacing.md,paddingHorizontal:spacing.lg,paddingVertical:spacing.sm,backgroundColor:colors.canvas},
  title:{...typography.cardTitle,color:colors.primary,flex:1,minWidth:0},
  scroll:{position:'absolute',left:0,right:0},
  content:{paddingBottom:spacing.xxl},
  sections:{padding:spacing.lg,gap:spacing.lg},
  band:{position:'absolute',left:0,right:0,backgroundColor:colors.canvas},
});
