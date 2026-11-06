import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { AppState, Keyboard } from 'react-native';
import type { CardId } from '../../domain/contracts';
import type { TileOrigin } from './CardTile';
import type { Rect } from './overlayGeometry';

export type KeyboardCardOpenOptions = {
  enabled: boolean; active: boolean; contentKey: string; layoutKey: string;
  open: (id: CardId, origin: TileOrigin) => void;
  /** CardGrid's bounded native measurement; missing sources return null for a safe fade. */
  measureCard: (id: CardId, callback: (rect: Rect | null) => void) => void;
};
type Request = { id: CardId; origin: TileOrigin; contentKey: string; hidden: boolean; version: number };

/** Keep keyboard resizing outside the overlay's measured animation lifecycle. */
export function useKeyboardCardOpen(options: KeyboardCardOpenOptions) {
  const latest = useRef(options), pending = useRef<Request | null>(null), live = useRef(true);
  const foreground = useRef(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const frame = useRef<number | null>(null), fallback = useRef<ReturnType<typeof setTimeout> | null>(null);
  useLayoutEffect(() => { latest.current = options; });
  const cancel = useCallback(() => {
    pending.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (fallback.current !== null) clearTimeout(fallback.current);
    frame.current = null; fallback.current = null;
  }, []);
  const valid = useCallback((request: Request) => live.current && foreground.current &&
    latest.current.enabled && latest.current.active && pending.current === request &&
    request.contentKey === latest.current.contentKey, []);
  const settle = useCallback(() => {
    const request = pending.current;
    if (!request || !request.hidden || !valid(request)) return;
    const version = ++request.version;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    // Allow viewport and dock layout reports to commit before remeasuring the tile.
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        if (!valid(request) || request.version !== version) return;
        latest.current.measureCard(request.id, rect => {
          if (!valid(request) || request.version !== version) return;
          const open = latest.current.open;
          cancel();
          open(request.id, { ...request.origin, rect });
        });
      });
    });
  }, [cancel, valid]);
  useLayoutEffect(() => {
    if (!options.enabled || !options.active) cancel();
    return cancel;
  }, [options.enabled, options.active, options.contentKey, cancel]);
  useLayoutEffect(() => { if (pending.current?.hidden) settle(); }, [options.layoutKey, settle]);
  useEffect(() => {
    live.current = true;
    if (!options.enabled) return () => { live.current = false; cancel(); };
    const keyboard = Keyboard.addListener('keyboardDidHide', () => {
      if (!pending.current) return;
      pending.current.hidden = true;
      if (fallback.current !== null) clearTimeout(fallback.current);
      fallback.current = null;
      settle();
    });
    const app = AppState.addEventListener('change', state => {
      foreground.current = state !== 'background' && state !== 'inactive';
      if (!foreground.current) cancel();
    });
    return () => { live.current = false; cancel(); keyboard.remove(); app.remove(); };
  }, [options.enabled, cancel, settle]);
  return useCallback((id: CardId, origin: TileOrigin) => {
    const now = latest.current;
    if (!now.enabled) { now.open(id, origin); return; }
    if (!live.current || !foreground.current || !now.active) return;
    cancel();
    if (!Keyboard.isVisible()) { Keyboard.dismiss(); now.open(id, origin); return; }
    const request: Request = { id, origin, contentKey: now.contentKey, hidden: false, version: 0 };
    pending.current = request;
    // Some native configurations omit hide events. Never leave a selection waiting indefinitely.
    fallback.current = setTimeout(() => {
      fallback.current = null;
      if (valid(request)) { request.hidden = true; settle(); }
    }, 1500);
    Keyboard.dismiss();
  }, [cancel, settle, valid]);
}
