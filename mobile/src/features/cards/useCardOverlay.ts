import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { CardId } from '../../domain/contracts';
import type { TileOrigin } from './CardTile';
import { toLocalRect, validRect, type Rect } from './overlayGeometry';

export type OverlayState = {
  stage: 'closed' | 'preparing' | 'opening' | 'open' | 'closing';
  id: CardId | null; generation: number; host: Rect | null; source: Rect | null;
  closeTarget: Rect | null; closeReady: boolean;
};
export type OverlayOptions = {
  active: boolean; layoutKey: string;
  measureHost: (callback: (rect: Rect | null) => void) => void;
  measureCard: (id: CardId, callback: (rect: Rect | null) => void) => void;
  focusCard: (id: CardId) => void;
};
const closed = (generation: number): OverlayState => ({
  stage: 'closed', id: null, generation, host: null, source: null, closeTarget: null, closeReady: false,
});
function visible(rect: Rect | null, host: Rect): rect is Rect {
  return !!rect && rect.x + rect.width > 0 && rect.y + rect.height > 0 && rect.x < host.width && rect.y < host.height;
}

/** Native callbacks are bounded, generation-guarded, and never own navigation. */
export function useCardOverlay(options: OverlayOptions) {
  const latest = useRef(options);
  useLayoutEffect(() => { latest.current = options; });
  const [state, setState] = useState<OverlayState>(() => closed(0));
  const current = useRef(state), live = useRef(true), serial = useRef(0);
  const pendingFocus = useRef<CardId | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const commit = useCallback((next: OverlayState) => {
    current.current = next;
    if (live.current) setState(next);
  }, []);
  const clear = useCallback(() => { for (const timer of timers.current) clearTimeout(timer); timers.current.clear(); }, []);
  const cancel = useCallback(() => { pendingFocus.current = null; clear(); commit(closed(++serial.current)); }, [clear, commit]);
  const bounded = useCallback((measure: (done: (rect: Rect | null) => void) => void, generation: number, callback: (rect: Rect | null) => void) => {
    let done = false;
    const deliver = (rect: Rect | null) => {
      if (done) return;
      done = true; clearTimeout(timer); timers.current.delete(timer);
      if (live.current && current.current.generation === generation) callback(rect && validRect(rect) ? rect : null);
    };
    const timer = setTimeout(() => deliver(null), 150);
    timers.current.add(timer);
    measure(deliver);
  }, []);
  const open = useCallback((id: CardId, origin: TileOrigin) => {
    if (!live.current || !latest.current.active || current.current.stage !== 'closed') return;
    const generation = ++serial.current;
    commit({ ...closed(generation), stage: 'preparing', id });
    bounded(latest.current.measureHost, generation, host => {
      if (!host) { cancel(); return; }
      const local = origin.rect ? toLocalRect(origin.rect, host) : null;
      commit({ ...current.current, host, source: visible(local, host) ? local : null });
    });
  }, [bounded, cancel, commit]);
  const ready = useCallback((generation: number) => {
    const now = current.current;
    if (live.current && now.generation === generation && now.stage === 'preparing' && now.host) commit({ ...now, stage: 'opening' });
  }, [commit]);
  const complete = useCallback((generation: number) => {
    const now = current.current;
    if (!live.current || now.generation !== generation) return;
    if (now.stage === 'opening') commit({ ...now, stage: 'open' });
    else if (now.stage === 'closing' && now.closeReady) {
      const id = now.id;
      pendingFocus.current = id;
      clear(); commit(closed(++serial.current));
    }
  }, [clear, commit]);
  const close = useCallback((fade = false) => {
    const now = current.current;
    if (now.stage === 'closed') return;
    if (now.stage === 'closing') {
      if (fade) { clear(); commit({ ...now, generation: ++serial.current, closeReady: true, closeTarget: null }); }
      return;
    }
    if (now.stage === 'preparing' || !now.host || now.id === null) { cancel(); return; }
    clear();
    const generation = ++serial.current;
    commit({ ...now, stage: 'closing', generation, closeReady: fade, closeTarget: null });
    if (fade) return;
    let measuredHost: Rect | null = null, measuredSource: Rect | null = null, count = 0;
    const measured = () => {
      if (++count !== 2) return;
      // A moved/resized host means the original coordinate system is no longer safe.
      const sameHost = measuredHost && Object.keys(now.host!).every(key => measuredHost![key as keyof Rect] === now.host![key as keyof Rect]);
      const target = sameHost && measuredSource ? toLocalRect(measuredSource, measuredHost!) : null;
      commit({ ...current.current, closeReady: true, closeTarget: visible(target, now.host!) ? target : null });
    };
    bounded(latest.current.measureHost, generation, rect => { measuredHost = rect; measured(); });
    bounded(callback => latest.current.measureCard(now.id!, callback), generation, rect => { measuredSource = rect; measured(); });
  }, [bounded, cancel, clear, commit]);
  useEffect(() => {
    // Focus only after the source is visible and its ancestor is accessible again.
    if (state.stage === 'closed' && pendingFocus.current !== null) {
      const id = pendingFocus.current; pendingFocus.current = null;
      if (options.active) latest.current.focusCard(id);
    }
  }, [options.active, state.generation, state.stage]);
  const previous = useRef({ active: options.active, layoutKey: options.layoutKey });
  useLayoutEffect(() => {
    const changed = previous.current.layoutKey !== options.layoutKey;
    previous.current = { active: options.active, layoutKey: options.layoutKey };
    if (!options.active || changed) {
      if (current.current.stage === 'preparing') cancel();
      else if (current.current.stage !== 'closed') close(true);
    }
  }, [options.active, options.layoutKey, cancel, close]);
  useEffect(() => {
    live.current = true;
    const subscription = AppState.addEventListener('change', status => { if (status !== 'active') cancel(); });
    return () => { live.current = false; clear(); subscription.remove(); };
  }, [cancel, clear]);
  return { state, hiddenCardId: state.stage === 'opening' || state.stage === 'open' || state.stage === 'closing' ? state.id : null, open, ready, complete, close, cancel };
}
