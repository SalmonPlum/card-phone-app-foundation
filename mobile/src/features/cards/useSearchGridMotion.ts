import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Card } from '../../domain/contracts';
import type { Rect } from './overlayGeometry';
import { SEARCH_MOVE_DURATION, SEARCH_START_WINDOW } from './searchMotionTiming';

export type SearchGridMotionOptions = {
  cards: readonly Card[];
  enabled: boolean;
  layoutKey: string;
  publishMotion?: (deadline: number, ids: number[]) => void;
  measureTiles: (done: (origins: Record<number, Rect>) => void) => void;
};
type Snapshot = { cards: readonly Card[]; origins: Record<number, Rect>; generation: number; deadline: number };
const membership = (cards: readonly Card[]) => cards.map(card => card.id).join(',');

/** Snapshot only mounted tiles; one short native measurement window, latest edit wins. */
export function useSearchGridMotion({ cards, enabled, layoutKey, measureTiles, publishMotion }: SearchGridMotionOptions) {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({ cards, origins: {}, generation: 0, deadline: 0 }));
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const latest = useRef({ measureTiles, publishMotion });
  const settleUntil = useRef(0);
  const previousLayout = useRef(layoutKey), serial = useRef(0);
  const current = useRef(snapshot);
  const ids = membership(cards), displayedIds = membership(snapshot.cards);
  const allowed = enabled && foreground;
  const status = useRef({ allowed, pending: false, deadline: 0 });
  useLayoutEffect(() => {
    latest.current = { measureTiles, publishMotion };
    current.current = snapshot;
    status.current = { allowed, pending: ids !== displayedIds, deadline: snapshot.deadline };
  });
  useLayoutEffect(() => {
    const generation = ++serial.current;
    const layoutChanged = previousLayout.current !== layoutKey;
    previousLayout.current = layoutKey;
    if (!allowed || layoutChanged) {
      if (current.current.deadline > 0 && Date.now() < current.current.deadline + SEARCH_MOVE_DURATION) settleUntil.current = current.current.deadline + SEARCH_MOVE_DURATION;
      latest.current.publishMotion?.(0, cards.map(card => card.id));
      setSnapshot(old => old.cards === cards && old.deadline === 0 ? old : { cards, origins: {}, generation: old.generation, deadline: 0 });
      return;
    }
    if (ids === membership(current.current.cards)) {
      latest.current.publishMotion?.(current.current.deadline, cards.map(card => card.id));
      return;
    }
    let finished = false;
    const finish = (origins: Record<number, Rect>) => {
      if (finished || generation !== serial.current) return;
      finished = true;
      clearTimeout(timer);
      const deadline = Date.now() + SEARCH_START_WINDOW;
      // Publish on the UI runtime before React commits entering/exiting views.
      latest.current.publishMotion?.(deadline, cards.map(card => card.id));
      setSnapshot(old => ({ cards, origins, generation: old.generation + 1, deadline }));
    };
    const timer = setTimeout(() => finish({}), 32);
    latest.current.measureTiles(finish);
    return () => { finished = true; clearTimeout(timer); };
  }, [cards, ids, allowed, layoutKey]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      ++serial.current;
      setForeground(state === 'active');
    });
    return () => listener.remove();
  }, []);
  // Eligibility lasts 200ms; a native animation starting near its end can run
  // another 450ms. Keep geometry conservative through that complete window.
  const isMoving = useCallback(() => {
    const now = status.current;
    return Date.now() < settleUntil.current || now.allowed && (now.pending || (now.deadline > 0 && Date.now() < now.deadline + SEARCH_MOVE_DURATION));
  }, []);
  return { cards: allowed && ids !== displayedIds ? snapshot.cards : cards, origins: snapshot.origins,
    generation: snapshot.generation, deadline: allowed ? snapshot.deadline : 0, isMoving,
    pending: allowed && ids !== displayedIds };
}
