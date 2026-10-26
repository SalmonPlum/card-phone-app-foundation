import { useCallback, useEffect, useMemo, useRef } from 'react';
import { cancelAnimation, Easing, ReduceMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import type { Pose, SessionState } from '../../domain/contracts';
import { renderFrame } from './renderFrame';
import { phaseDurationMs, regripPose, returnPose, SOURCE } from './motion';

export function useShuffleAnimation(state: SessionState, paused: boolean, reducedMotion: boolean, onComplete: (sessionId: string, epoch: number) => void) {
  const progress = useSharedValue(0);
  const { sessionId, epoch, phase } = state;
  const { total, remaining, source, received, flying, selected } = renderFrame(state);
  const hasOrigin = state.phaseOrigin !== null;
  const { x = 0, y = 0, angle = 0, scale = 1 } = state.phaseOrigin ?? {};
  // A queue-only DRAW changes the session object, not its visual boundary.
  // Keep this identity stable so it cannot cancel/restart a stepped hold.
  const nextFrame = useMemo(() => ({
    phase, phaseOrigin: hasOrigin ? { x, y, angle, scale } : null,
    total, remaining, source, received, flying, selected,
  }), [phase, hasOrigin, x, y, angle, scale, total, remaining, source, received, flying, selected]);
  const frame = useSharedValue(nextFrame);
  const generation = useSharedValue(0);
  const sequence = useRef(0);
  useEffect(() => {
    const token = ++sequence.current;
    return () => {
      sequence.current = token + 1;
      scheduleOnUI(() => {
        'worklet';
        if (generation.value !== token) return;
        generation.value = token + 1;
        cancelAnimation(progress);
      });
    };
  }, [generation, progress, sessionId, epoch]);
  useEffect(() => {
    let active = true;
    const token = sequence.current;
    const deliver = (id: string, token: number) => { if (active) onComplete(id, token); };
    const phaseDuration = phaseDurationMs(phase);
    const duration = reducedMotion ? 400 : phaseDuration;
    scheduleOnUI(() => {
      'worklet';
      // RN shared-value writes are deferred. Reset, sample the remaining clock,
      // and start timing in one UI job so a completed prior phase cannot leak 1.
      cancelAnimation(progress);
      if (generation.value !== token) {
        generation.value = token;
        progress.value = 0;
      }
      // Mappers may be replaced before or after this job. Both versions read
      // this same UI snapshot, paired with the reset clock, never RN closures.
      frame.value = nextFrame;
      if (paused || !phaseDuration) return;
      progress.value = withTiming(1, {duration: duration * (1-progress.value), reduceMotion: ReduceMotion.Never, easing: reducedMotion ? (t: number) => { 'worklet'; return t < 1 ? 0 : 1; } : Easing.linear}, finished => {
        if (finished && generation.value === token) scheduleOnRN(deliver, sessionId, epoch);
      });
    });
    return () => {
      active = false;
      scheduleOnUI(() => {
        'worklet';
        if (generation.value === token) cancelAnimation(progress);
      });
    };
  }, [progress, generation, frame, nextFrame, sessionId, epoch, phase, paused, reducedMotion, onComplete]);
  const samplePose = useCallback((callback: (pose: Pose, sessionId: string, epoch: number) => void) => {
    const token = sequence.current;
    const deliver = (pose: Pose, id: string, currentEpoch: number) => {
      if (sequence.current === token) callback(pose, id, currentEpoch);
    };
    scheduleOnUI((value: SharedValue<number>, currentGeneration: SharedValue<number>) => {
      'worklet';
      if (currentGeneration.value !== token) return;
      if (phase === 'regrip' || phase === 'return') cancelAnimation(value);
      const pose = phase === 'return' ? returnPose(value.value) : phase === 'regrip' ? regripPose(value.value) : SOURCE;
      scheduleOnRN(deliver, pose, sessionId, epoch);
    }, progress, generation);
  }, [progress, generation, phase, sessionId, epoch]);
  return {progress, frame, samplePose};
}
