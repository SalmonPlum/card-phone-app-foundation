import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

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
