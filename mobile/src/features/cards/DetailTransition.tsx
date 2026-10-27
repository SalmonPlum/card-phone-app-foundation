import { useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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

type DetailPresentation = 'opening' | 'presented' | 'closing';

/** Native onAppear is the point at which the stack's fade has finished. */
export function useDetailPresentation(): DetailPresentation {
  const navigation = useNavigation<NativeStackNavigationProp<{ 'card/[id]': undefined }>>();
  const [presentation, setPresentation] = useState<DetailPresentation>('opening');
  useEffect(() => {
    const start = navigation.addListener('transitionStart', event => {
      if (event.data.closing) setPresentation('closing');
    });
    const end = navigation.addListener('transitionEnd', event => {
      setPresentation(current => event.data.closing || current === 'closing' ? 'closing' : 'presented');
    });
    return () => { start(); end(); };
  }, [navigation]);
  return presentation;
}

/** Native stack owns fading in both directions; forward depth runs once it is visible. */
export function DetailTransition({ children, origin, reducedMotion, presentation = 'presented' }: {
  children: ReactNode; origin: TileOrigin | null; reducedMotion: boolean | null; presentation?: DetailPresentation;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const entered = useRef(false);
  const { height } = useWindowDimensions();
  const visibleOrigin = origin?.rect && origin.rect.y + origin.rect.height > 0 && origin.rect.y < height;
  const move = reducedMotion === false && !!visibleOrigin;
  useEffect(() => {
    if (presentation === 'closing' || reducedMotion === true) entered.current = true;
    if (!move || presentation === 'closing') { progress.setValue(1); return; }
    if (entered.current) return;
    progress.setValue(0);
    if (presentation !== 'presented') return;
    entered.current = true;
    const animation = Animated.timing(progress, { toValue: 1, duration: 420,
      easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [move, presentation, progress, reducedMotion]);
  // Do not briefly paint full-size content before the preference lookup completes.
  return <Animated.View style={{ flex: 1, opacity: reducedMotion === null ? 0 : 1, transform: move ? [
    { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
  ] : [] }}>{children}</Animated.View>;
}
