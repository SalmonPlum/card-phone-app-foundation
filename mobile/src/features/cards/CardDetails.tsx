import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import type { Card, DetailTemplate, Locale } from '../../domain/contracts';
import type { AssetRegistry } from '../../decks/assets';
import { localizeCard } from '../../domain/deck';
import { t } from '../../i18n/locale';
import { CardFace } from './CardTile';
import { CardDetailReader } from './CardDetailReader';
import { compactFaceRect, fitForegroundRect, readingFaceRect } from './overlayGeometry';
import { useReducedMotion } from './useReducedMotion';
import { spacing, radius } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';
export { CardDetailsText } from './CardDetailsText';

export type CardDetailsProps = {detailTemplate:DetailTemplate;card:Card;locale:Locale;assetRegistry:AssetRegistry;onBack?:()=>void};
export function CardDetails({detailTemplate,card,locale,assetRegistry,onBack}:CardDetailsProps) {
  const styles = useThemeStyles(makeStyles);
  const window=useWindowDimensions();
  const [host,setHost]=useState({width:window.width,height:window.height});
  const [headerHeight,setHeaderHeight]=useState(64);
  const scrollOffset=useSharedValue(0), reduced=useReducedMotion()!==false;
  const source=assetRegistry[localizeCard(card,locale).faceAsset];
  const size=source?Image.resolveAssetSource(source):null;
  const width=size?.width ?? 0,height=size?.height ?? 0;
  const ratio=width>0&&height>0?width/height:238/358;
  const expanded=fitForegroundRect(host,ratio,0,0,headerHeight);
  const baseWidth=238,baseHeight=baseWidth/ratio;
  const faceStyle=useAnimatedStyle(()=>{
    const rect=reduced?compactFaceRect(expanded):readingFaceRect(expanded,scrollOffset.value);
    return {transform:[{translateX:rect.x+(rect.width-baseWidth)/2},{translateY:rect.y+(rect.height-baseHeight)/2},{scaleX:rect.width/baseWidth},{scaleY:rect.height/baseHeight}]};
  });
  return <View testID="direct-detail-host" style={styles.screen} onLayout={event=>setHost(event.nativeEvent.layout)}>
    <CardDetailReader detailTemplate={detailTemplate} card={card} locale={locale} expanded={expanded} scrollOffset={scrollOffset}
      headerHeight={headerHeight} onHeaderHeight={setHeaderHeight} topInset={0} bottomInset={0} active reducedMotion={reduced}
      scrollTestID="direct-detail-scroll"
      action={onBack?<Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><Text style={styles.link}>{t('back',locale)}</Text></Pressable>:undefined}/>
    <Animated.View testID="direct-detail-face-surface" pointerEvents="none" style={[{position:'absolute',width:baseWidth,height:baseHeight},faceStyle]}>
      <CardFace card={card} locale={locale} assetRegistry={assetRegistry} testID={`detail-face-${card.id}`}/>
    </Animated.View>
  </View>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.canvas},
  back:{maxWidth:'45%',minHeight:48,minWidth:64,paddingHorizontal:spacing.lg,justifyContent:'center',backgroundColor:colors.surface,borderRadius:radius.pill},
  link:{...typography.label,color:colors.primary},
});
