import { artworkSize, useArtworkDefinitions } from '../../artwork/ArtworkProvider';
import { useEffect,useLayoutEffect,useRef,useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import type { Card, DetailTemplate, Locale } from '../../domain/contracts';
import type { AssetRegistry } from '../../decks/assets';
import { localizeCard } from '../../domain/deck';
import { t } from '../../i18n/locale';
import { CardFace } from './CardTile';
import { CardDetailReader } from './CardDetailReader';
import { compactFaceRect, fitForegroundRect, readingFaceRect } from './overlayGeometry';
import { useReducedMotion } from './useReducedMotion';
import {IconButton} from '../../ui/IconButton';
import { useThemeStyles, type ThemeColors } from '../../ui/useThemeStyles';
export { CardDetailsText } from './CardDetailsText';

export type CardDetailsProps = {detailTemplate:DetailTemplate;card:Card;locale:Locale;assetRegistry:AssetRegistry;onBack?:()=>void;active?:boolean};
export function CardDetails({detailTemplate,card,locale,assetRegistry,onBack,active=true}:CardDetailsProps) {
  const styles = useThemeStyles(makeStyles);
  const identity=String(card.id);
  const returnState=useRef({identity,active,used:false,callback:onBack});
  useLayoutEffect(()=>{
    const previous=returnState.current;
    returnState.current={identity,active,used:previous.identity===identity&&!(active&&!previous.active)&&previous.used,callback:onBack};
  },[identity,active,onBack]);
  useEffect(()=>()=>{returnState.current.active=false;},[]);
  const returnOnce=()=>{
    const current=returnState.current;
    if(current.identity!==identity||!current.active||current.used||!current.callback)return;
    current.used=true;current.callback();
  };
  const definitions = useArtworkDefinitions();
  const window=useWindowDimensions();
  const [host,setHost]=useState({width:window.width,height:window.height});
  const [headerHeight,setHeaderHeight]=useState(64);
  const scrollOffset=useSharedValue(0), reduced=useReducedMotion()!==false;
  const {width,height}=artworkSize(localizeCard(card,locale).faceAsset,assetRegistry,definitions);
  const ratio=width>0&&height>0?width/height:238/358;
  const expanded=fitForegroundRect(host,ratio,0,0,headerHeight);
  const baseWidth=238,baseHeight=baseWidth/ratio;
  const faceStyle=useAnimatedStyle(()=>{
    const rect=reduced?compactFaceRect(expanded):readingFaceRect(expanded,scrollOffset.value);
    return {transform:[{translateX:rect.x+(rect.width-baseWidth)/2},{translateY:rect.y+(rect.height-baseHeight)/2},{scaleX:rect.width/baseWidth},{scaleY:rect.height/baseHeight}]};
  });
  return <View testID="direct-detail-host" style={styles.screen} onLayout={event=>setHost(event.nativeEvent.layout)}>
    <CardDetailReader detailTemplate={detailTemplate} card={card} locale={locale} expanded={expanded} scrollOffset={scrollOffset}
      headerHeight={headerHeight} onHeaderHeight={setHeaderHeight} topInset={0} bottomInset={0} active={active} reducedMotion={reduced}
      scrollTestID="direct-detail-scroll" onArtworkPress={onBack?returnOnce:undefined}
      actionPosition="start" action={onBack?<IconButton variant="circle" icon="back" label={t('back',locale)} onPress={returnOnce} disabled={!active}/>:undefined}/>
    <Animated.View testID="direct-detail-face-surface" pointerEvents="none" style={[{position:'absolute',width:baseWidth,height:baseHeight},faceStyle]}>
      <CardFace card={card} locale={locale} assetRegistry={assetRegistry} testID={`detail-face-${card.id}`}/>
    </Animated.View>
  </View>;
}
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.canvas},
});
