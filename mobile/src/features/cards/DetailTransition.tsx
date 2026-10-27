import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, useWindowDimensions } from 'react-native';
import type { TileOrigin } from './CardTile';

/** Unknown preferences use no movement until the native preference is resolved. */
export function useReducedMotion(): boolean | null {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (live) setReduced(value); }, () => { if (live) setReduced(true); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { live = false; subscription.remove(); };
  }, []);
  return reduced;
}

/** Native stack owns fading in both directions; this adds only forward depth. */
export function DetailTransition({ children, origin, reducedMotion }: {
  children: ReactNode; origin: TileOrigin | null; reducedMotion: boolean | null;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const { height } = useWindowDimensions();
  const visibleOrigin = origin?.rect && origin.rect.y + origin.rect.height > 0 && origin.rect.y < height;
  const move = reducedMotion === false && !!visibleOrigin;
  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: move ? 260 : 0,
      easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [move, progress]);
  // Do not briefly paint full-size content before the preference lookup completes.
  return <Animated.View style={{ flex: 1, opacity: reducedMotion === null ? 0 : 1, transform: move ? [
    { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
    { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
  ] : [] }}>{children}</Animated.View>;
}
