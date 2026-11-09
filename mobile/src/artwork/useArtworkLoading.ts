import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ArtworkDefinition } from '../domain/artwork';

type Phase = 'layers' | 'fallback' | 'failed';
type Options = { assetKey: string; definition: ArtworkDefinition; retryKey?: number; onLoadEnd?: () => void; onError?: () => void };
type Token = { assetKey: string; definition: ArtworkDefinition; retryKey: number };
type Run = { token: Token; phase: Phase; loaded: Set<string>; finished: boolean };

/** A generation owns both bounded waits; tint changes never create a generation. */
export function useArtworkLoading({ assetKey, definition, retryKey = 0, onLoadEnd, onError }: Options) {
  const token = useMemo(() => ({ assetKey, definition, retryKey }), [assetKey, definition, retryKey]);
  const [state, setState] = useState<{ token: Token; phase: Phase; ready: boolean }>({ token, phase: 'layers', ready: false });
  const run = useRef<Run | null>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedAssets = useRef(new Set<string>());
  const callbacks = useRef({ onLoadEnd, onError });
  useLayoutEffect(() => { callbacks.current = { onLoadEnd, onError }; });
  const clear = useCallback(() => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; }, []);
  const finish = useCallback((request: Run, failed = false) => {
    if (run.current !== request || request.finished) return;
    request.finished = true; clear();
    if (failed) request.phase = 'failed';
    setState({ token: request.token, phase: request.phase, ready: true });
    if (failed) callbacks.current.onError?.();
    callbacks.current.onLoadEnd?.();
  }, [clear]);
  const fallback = useCallback((request: Run) => {
    if (run.current !== request || request.finished || request.phase !== 'layers') return;
    clear(); request.phase = 'fallback';
    setState({ token: request.token, phase: 'fallback', ready: false });
    timer.current = setTimeout(() => finish(request, true), 1500);
  }, [clear, finish]);
  useLayoutEffect(() => {
    const request: Run = { token, phase: 'layers', loaded: new Set(definition.layers.filter(layer => loadedAssets.current.has(layer.asset)).map(layer => layer.id)), finished: false };
    run.current = request;
    timer.current = request.loaded.size === definition.layers.length
      ? setTimeout(() => finish(request), 0)
      : setTimeout(() => fallback(request), 1500);
    return () => { run.current = null; clear(); };
  }, [token, definition, fallback, finish, clear]);
  const current = (phase: Phase) => {
    const request = run.current;
    return request?.token === token && request.phase === phase && !request.finished ? request : null;
  };
  const effective = state.token === token ? state : { token, phase: 'layers' as const, ready: false };
  return {
    phase: effective.phase, ready: effective.ready,
    completeLayer: (id: string) => {
      const request = current('layers');
      if (!request || !definition.layers.some(layer => layer.id === id)) return;
      const layer = definition.layers.find(layer => layer.id === id)!;
      loadedAssets.current.add(layer.asset);
      request.loaded.add(id);
      if (request.loaded.size === definition.layers.length) finish(request);
    },
    failLayer: () => { const request = current('layers'); if (request) fallback(request); },
    completeFallback: () => { const request = current('fallback'); if (request) finish(request); },
    failFallback: () => { const request = current('fallback'); if (request) finish(request, true); },
  };
}
