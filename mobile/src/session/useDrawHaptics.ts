import {useCallback, useLayoutEffect, useRef} from 'react';
import {AppState} from 'react-native';
import type {SessionState} from '../domain/contracts';
import {pulseDrawHaptic} from '../platform/drawHaptics';
import {useHapticsSettings} from '../settings/HapticsProvider';

/** Called at the controller boundary, never from render or a replayable effect. */
export function useDrawHaptics() {
  const {enabled, ready} = useHapticsSettings();
  const preference = useRef({enabled, ready});
  useLayoutEffect(() => {preference.current = {enabled, ready};}, [enabled, ready]);
  return useCallback((previous: SessionState, next: SessionState) => {
    if (previous.sessionId !== next.sessionId
      || !preference.current.ready || !preference.current.enabled
      || AppState.currentState !== 'active') return;
    if (previous.phase === 'strip' && next.phase === 'contact') {
      pulseDrawHaptic('shuffle');
    } else if (previous.phase === 'flip' && next.phase === 'reveal'
      && next.selectedId !== null && previous.selectedId === next.selectedId) {
      pulseDrawHaptic('reveal');
    }
  }, []);
}
