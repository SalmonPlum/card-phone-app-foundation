import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { CellRendererProps } from '@react-native/virtualized-lists';
import Animated from 'react-native-reanimated';
import type { Card } from '../../domain/contracts';
import type { Rect } from './overlayGeometry';
import { searchCardEntering, searchCardExiting, searchRowLayout, type SearchMotionControl } from './searchGridAnimations';

export const SearchGridMotionContext = createContext<SearchMotionControl | null>(null);

/** Preserve FlatList's row measurement/focus plumbing and row identity. */
export function SearchGridCell({ children, style, onLayout, onFocusCapture }: CellRendererProps<Card>) {
  const control = useContext(SearchGridMotionContext)!;
  const layout = useMemo(() => searchRowLayout(control), [control]);
  return <Animated.View collapsable={false} style={style} onLayout={onLayout} onFocusCapture={onFocusCapture} layout={layout}>
    {children}
  </Animated.View>;
}

export function SearchGridTransition({ id, origin, included, children }: {
  id: number; origin?: Rect; included: boolean; children: ReactNode;
}) {
  const control = useContext(SearchGridMotionContext)!;
  const entering = useMemo(() => searchCardEntering(origin, control), [origin, control]);
  const exiting = useMemo(() => searchCardExiting(id, control), [id, control]);
  return <Animated.View collapsable={false} entering={entering} exiting={exiting}
    pointerEvents={included ? 'auto' : 'none'} accessibilityElementsHidden={!included}
    importantForAccessibility={included ? 'auto' : 'no-hide-descendants'}>
    {children}
  </Animated.View>;
}
