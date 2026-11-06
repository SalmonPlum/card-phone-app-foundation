import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import type { Card, DetailTemplate, Locale } from '../../domain/contracts';
import { localizeCard } from '../../domain/deck';
import type { AssetRegistry } from '../../decks/assets';
import { t } from '../../i18n/locale';
import { CardFace } from './CardTile';
import { CardDetailReader } from './CardDetailReader';
import { compactFaceRect, fitForegroundRect, readingFaceRect, type Rect } from './overlayGeometry';
import type { OverlayState } from './useCardOverlay';
import { spacing, radius } from '../../ui/theme';
import { useThemeStyles, type ThemeColors, type ThemeTypography } from '../../ui/useThemeStyles';

export type CardDetailOverlayProps = {
  detailTemplate:DetailTemplate; card: Card; locale: Locale; assetRegistry: AssetRegistry; state: OverlayState;
  reducedMotion: boolean | null; topInset: number; bottomInset: number;
  onReady: (generation: number) => void; onComplete: (generation: number) => void; onClose: () => void;
};
type Motion = { from: Rect; to: Rect; dimFrom: number; dimTo: number; opacityFrom: number; opacityTo: number; visible: number; reading: boolean; run: string };
function mix(from: number, to: number, progress: number) { 'worklet'; return from + (to - from) * progress; }
function rectAt(from: Rect, to: Rect, progress: number): Rect {
  'worklet';
  return { x: mix(from.x, to.x, progress), y: mix(from.y, to.y, progress), width: mix(from.width, to.width, progress), height: mix(from.height, to.height, progress) };
}

/** One native image survives preparation, expansion, reading and the return handoff. */
export function CardDetailOverlay({ detailTemplate,card, locale, assetRegistry, state, reducedMotion, topInset, bottomInset, onReady, onComplete, onClose }: CardDetailOverlayProps) {
  const styles = useThemeStyles(makeStyles);
  const asset = assetRegistry[localizeCard(card, locale).faceAsset];
  const size = asset ? Image.resolveAssetSource(asset) : null;
  const assetWidth = size?.width ?? 0, assetHeight = size?.height ?? 0;
  const ratio = assetWidth > 0 && assetHeight > 0 ? assetWidth / assetHeight : 238 / 358;
  // Keep the host coordinate system stable; measure wrapping title before entry.
  const [host] = useState(state.host!);
  const [headerHeight,setHeaderHeight] = useState(64), [headerReady,setHeaderReady] = useState(false);
  const measureHeader=useCallback((height:number)=>{setHeaderHeight(height);setHeaderReady(true);},[]);
  const expanded=useMemo(()=>fitForegroundRect(host,ratio,topInset,bottomInset,headerHeight),[host,ratio,topInset,bottomInset,headerHeight]);
  const target=useMemo(()=>reducedMotion===true?compactFaceRect(expanded):expanded,[expanded,reducedMotion]);
  const baseWidth = 238, baseHeight = baseWidth / ratio;
  const initial = reducedMotion === false && state.stage !== 'open' ? state.source ?? target : target;
  const motion = useSharedValue<Motion>({ from: initial, to: initial, dimFrom: 0, dimTo: 0, opacityFrom: 1, opacityTo: 1, visible: state.stage==='open'?1:0, reading: false, run: '' });
  const progress = useSharedValue(0), detailsOpacity = useSharedValue(0), scrollOffset=useSharedValue(0);
  const [loaded, setLoaded] = useState(false), [laidOut, setLaidOut] = useState(false);
  const loadedFace = useCallback(() => setLoaded(true), []);
  const closeControl = useRef<ComponentRef<typeof View>>(null);
  const generation = state.generation, stage = state.stage, closeReady = state.closeReady, closeTarget = state.closeTarget;
  const source = state.source;
  useEffect(() => {
    if (stage !== 'preparing' || !loaded || !laidOut || !headerReady || reducedMotion === null) return;
    scheduleOnUI(() => {
      'worklet';
      const from = reducedMotion === false ? source ?? target : target;
      const opacity = reducedMotion === false && source === null ? 0 : 1;
      motion.value = { from, to: from, dimFrom: 0, dimTo: 0, opacityFrom: opacity, opacityTo: opacity, visible: 1, reading: false, run: `ready:${generation}` };
      progress.value = 0;
      scheduleOnRN(onReady, generation);
    });
  }, [generation, headerReady, laidOut, loaded, motion, onReady, progress, reducedMotion, source, stage, target]);
  useEffect(() => {
    if (stage !== 'opening' && stage !== 'closing') return;
    scheduleOnUI(() => {
      'worklet';
      const run = `${stage}:${generation}:${closeReady}`;
      if (motion.value.run === run) return;
      // Cancel, sample, and replace geometry in one UI job. RN never reads a per-frame value.
      cancelAnimation(progress);
      const old = motion.value, p = progress.value;
      const painted = rectAt(old.from, old.to, p);
      const from = old.reading ? readingFaceRect(painted,scrollOffset.value) : painted;
      if(stage==='closing') detailsOpacity.value=0;
      const dim = mix(old.dimFrom, old.dimTo, p), opacity = mix(old.opacityFrom, old.opacityTo, p);
      if (stage === 'closing' && !closeReady) {
        motion.value = { ...old, reading: false, from, to: from, dimFrom: dim, dimTo: dim, opacityFrom: opacity, opacityTo: opacity, run };
        progress.value = 0;
        return;
      }
      const returning = stage === 'closing';
      motion.value = {
        from, to: returning ? (reducedMotion === false ? closeTarget ?? from : from) : target,
        dimFrom: dim, dimTo: returning ? 0 : 1,
        opacityFrom: opacity, opacityTo: returning && (!closeTarget || reducedMotion !== false) ? 0 : 1,
        visible: 1, reading: false, run,
      };
      progress.value = 0;
      progress.value = withTiming(1, { duration: reducedMotion === false ? (returning && !closeTarget ? 160 : 420) : 0,
        easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never }, done => {
        if (done) scheduleOnRN(onComplete, generation);
      });
    });
  }, [closeReady, closeTarget, detailsOpacity, generation, motion, scrollOffset, onComplete, progress, reducedMotion, stage, target]);
  useEffect(() => () => {
    scheduleOnUI(() => { 'worklet'; cancelAnimation(progress); motion.value = { ...motion.value, visible: 0 }; });
  }, [motion, progress]);
  useEffect(() => {
    if (stage !== 'open') return;
    scheduleOnUI(() => {
      'worklet';
      motion.value={...motion.value,from:target,to:target,reading:reducedMotion===false};
      progress.value=1;
      detailsOpacity.value = withTiming(1, { duration: reducedMotion === false ? 160 : 0 });
    });
    closeControl.current?.focus();
    const node = findNodeHandle(closeControl.current);
    if (node != null) AccessibilityInfo.setAccessibilityFocus(node);
  }, [detailsOpacity, motion, progress, reducedMotion, stage, target]);
  const faceStyle = useAnimatedStyle(() => {
    const m = motion.value, p = progress.value, base = rectAt(m.from, m.to, p);
    const rect=m.reading?readingFaceRect(base,scrollOffset.value):base;
    return { opacity: m.visible * mix(m.opacityFrom, m.opacityTo, p), transform: [
      { translateX: rect.x + (rect.width - baseWidth) / 2 },
      { translateY: rect.y + (rect.height - baseHeight) / 2 },
      { scaleX: rect.width / baseWidth }, { scaleY: rect.height / baseHeight },
    ] };
  });
  const backdropStyle = useAnimatedStyle(() => ({ opacity: motion.value.visible * mix(motion.value.dimFrom, motion.value.dimTo, progress.value) }));
  const detailsStyle = useAnimatedStyle(() => ({ opacity: detailsOpacity.value }));
  return <View testID="card-detail-overlay" style={StyleSheet.absoluteFill} accessibilityViewIsModal importantForAccessibility="yes" onAccessibilityEscape={onClose}>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
    <Animated.View testID="overlay-details-body" style={[StyleSheet.absoluteFill, detailsStyle]}>
      <CardDetailReader detailTemplate={detailTemplate} card={card} locale={locale} expanded={expanded} scrollOffset={scrollOffset}
        headerHeight={headerHeight} onHeaderHeight={measureHeader} topInset={topInset} bottomInset={bottomInset}
        reducedMotion={reducedMotion===true} active={stage==='open'}
        action={<Pressable ref={closeControl} accessibilityRole="button" onPress={onClose} style={styles.close}>
          <Text style={styles.link}>{t('close',locale)}</Text>
        </Pressable>}/>
    </Animated.View>
    <Animated.View testID="overlay-face-surface" pointerEvents="none" onLayout={() => setLaidOut(true)}
      style={[{ position: 'absolute', width: baseWidth, height: baseHeight }, faceStyle]}>
      <CardFace card={card} locale={locale} assetRegistry={assetRegistry} testID={`overlay-face-${card.id}`} onLoadEnd={loadedFace} />
    </Animated.View>
  </View>;
}
const makeStyles = (colors: ThemeColors, typography: ThemeTypography) => StyleSheet.create({
  backdrop: { backgroundColor: `${colors.canvas}ed` },
  close: { maxWidth:'45%', minHeight: 48, minWidth: 64, justifyContent: 'center', paddingHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.pill },
  link: { ...typography.label, color: colors.primary },
});
