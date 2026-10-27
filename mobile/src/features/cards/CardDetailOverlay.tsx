import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import type { Card, Locale } from '../../domain/contracts';
import { localizeCard } from '../../domain/deck';
import type { AssetRegistry } from '../../decks/assets';
import { t } from '../../i18n/locale';
import { CardFace } from './CardTile';
import { CardDetailsText } from './CardDetails';
import { fitForegroundRect, type Rect } from './overlayGeometry';
import type { OverlayState } from './useCardOverlay';
import { colors, type, spacing, radius } from '../../ui/theme';

export type CardDetailOverlayProps = {
  card: Card; locale: Locale; assetRegistry: AssetRegistry; state: OverlayState;
  reducedMotion: boolean | null; topInset: number; bottomInset: number;
  onReady: (generation: number) => void; onComplete: (generation: number) => void; onClose: () => void;
};
type Motion = { from: Rect; to: Rect; dimFrom: number; dimTo: number; opacityFrom: number; opacityTo: number; visible: number; run: string };
function mix(from: number, to: number, progress: number) { 'worklet'; return from + (to - from) * progress; }
function rectAt(from: Rect, to: Rect, progress: number): Rect {
  'worklet';
  return { x: mix(from.x, to.x, progress), y: mix(from.y, to.y, progress), width: mix(from.width, to.width, progress), height: mix(from.height, to.height, progress) };
}

/** One native image survives preparation, expansion, reading and the return handoff. */
export function CardDetailOverlay({ card, locale, assetRegistry, state, reducedMotion, topInset, bottomInset, onReady, onComplete, onClose }: CardDetailOverlayProps) {
  const asset = assetRegistry[localizeCard(card, locale).faceAsset];
  const size = asset ? Image.resolveAssetSource(asset) : null;
  const assetWidth = size?.width ?? 0, assetHeight = size?.height ?? 0;
  const ratio = assetWidth > 0 && assetHeight > 0 ? assetWidth / assetHeight : 238 / 358;
  // Keep the base coordinate system stable even if the viewport changes while open.
  const [target] = useState(() => fitForegroundRect(state.host!, ratio, topInset, bottomInset));
  const baseWidth = 238, baseHeight = baseWidth / ratio;
  const initial = reducedMotion === false ? state.source ?? target : target;
  const motion = useSharedValue<Motion>({ from: initial, to: initial, dimFrom: 0, dimTo: 0, opacityFrom: 1, opacityTo: 1, visible: 0, run: '' });
  const progress = useSharedValue(0), detailsOpacity = useSharedValue(0);
  const [loaded, setLoaded] = useState(false), [laidOut, setLaidOut] = useState(false);
  const loadedFace = useCallback(() => setLoaded(true), []);
  const closeControl = useRef<ComponentRef<typeof View>>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const generation = state.generation, stage = state.stage, closeReady = state.closeReady, closeTarget = state.closeTarget;
  const source = state.source;
  useEffect(() => {
    if (stage !== 'preparing' || !loaded || !laidOut || reducedMotion === null) return;
    scheduleOnUI(() => {
      'worklet';
      const from = reducedMotion === false ? source ?? target : target;
      const opacity = reducedMotion === false && source === null ? 0 : 1;
      motion.value = { from, to: from, dimFrom: 0, dimTo: 0, opacityFrom: opacity, opacityTo: opacity, visible: 1, run: `ready:${generation}` };
      progress.value = 0;
      scheduleOnRN(onReady, generation);
    });
  }, [generation, laidOut, loaded, motion, onReady, progress, reducedMotion, source, stage, target]);
  useEffect(() => {
    if (stage !== 'opening' && stage !== 'closing') return;
    if (stage === 'closing') scroll.current?.scrollTo({ y: 0, animated: false });
    scheduleOnUI(() => {
      'worklet';
      const run = `${stage}:${generation}:${closeReady}`;
      if (motion.value.run === run) return;
      // Cancel, sample, and replace geometry in one UI job. RN never reads a per-frame value.
      cancelAnimation(progress);
      const old = motion.value, p = progress.value;
      const from = rectAt(old.from, old.to, p);
      const dim = mix(old.dimFrom, old.dimTo, p), opacity = mix(old.opacityFrom, old.opacityTo, p);
      if (stage === 'closing' && !closeReady) {
        motion.value = { ...old, from, to: from, dimFrom: dim, dimTo: dim, opacityFrom: opacity, opacityTo: opacity, run };
        progress.value = 0;
        return;
      }
      const returning = stage === 'closing';
      motion.value = {
        from, to: returning ? (reducedMotion === false ? closeTarget ?? from : from) : target,
        dimFrom: dim, dimTo: returning ? 0 : 1,
        opacityFrom: opacity, opacityTo: returning && (!closeTarget || reducedMotion !== false) ? 0 : 1,
        visible: 1, run,
      };
      progress.value = 0;
      progress.value = withTiming(1, { duration: reducedMotion === false ? (returning && !closeTarget ? 160 : 420) : 0,
        easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never }, done => {
        if (done) scheduleOnRN(onComplete, generation);
      });
    });
  }, [closeReady, closeTarget, generation, motion, onComplete, progress, reducedMotion, stage, target]);
  useEffect(() => () => {
    scheduleOnUI(() => { 'worklet'; cancelAnimation(progress); motion.value = { ...motion.value, visible: 0 }; });
  }, [motion, progress]);
  useEffect(() => {
    if (stage !== 'open') return;
    scheduleOnUI(() => {
      'worklet';
      detailsOpacity.value = withTiming(1, { duration: reducedMotion === false ? 160 : 0 });
    });
    closeControl.current?.focus();
    const node = findNodeHandle(closeControl.current);
    if (node != null) AccessibilityInfo.setAccessibilityFocus(node);
  }, [detailsOpacity, reducedMotion, stage]);
  const faceStyle = useAnimatedStyle(() => {
    const m = motion.value, p = progress.value, rect = rectAt(m.from, m.to, p);
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
    <Animated.View testID="overlay-face-surface" pointerEvents="none" onLayout={() => setLaidOut(true)}
      style={[{ position: 'absolute', width: baseWidth, height: baseHeight }, faceStyle]}>
      <CardFace card={card} locale={locale} assetRegistry={assetRegistry} testID={`overlay-face-${card.id}`} onLoadEnd={loadedFace} />
    </Animated.View>
    {stage === 'open' && <Animated.View testID="overlay-details-body" style={[StyleSheet.absoluteFill, detailsStyle]}>
      <Pressable ref={closeControl} accessibilityRole="button" onPress={onClose} style={[styles.close, { top: topInset + 8 }]}>
        <Text style={styles.link}>{t('close', locale)}</Text>
      </Pressable>
      <ScrollView ref={scroll} testID="overlay-details" style={{ position: 'absolute', left: 0, right: 0, top: target.y + target.height + 12, bottom: bottomInset }}
        contentContainerStyle={styles.details}>
        <CardDetailsText card={card} locale={locale} />
      </ScrollView>
    </Animated.View>}
  </View>;
}
const styles = StyleSheet.create({
  backdrop: { backgroundColor: `${colors.canvas}ed` },
  close: { position: 'absolute', right: 16, minHeight: 48, minWidth: 64, justifyContent: 'center', paddingHorizontal: spacing.lg, backgroundColor: colors.panel, borderRadius: radius.pill },
  link: { ...type.label, fontFamily: type.sans, color: colors.forest },
  details: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
});
