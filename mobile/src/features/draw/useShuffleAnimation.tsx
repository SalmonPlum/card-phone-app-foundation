import { useCallback, useEffect, useRef } from 'react';
import { cancelAnimation, Easing, ReduceMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import type { Pose, SessionState } from '../../domain/contracts';
import { phaseDurationMs, regripPose, returnPose, SOURCE } from './motion';

export function useShuffleAnimation(state: SessionState, paused: boolean, reducedMotion: boolean, onComplete: (sessionId: string, epoch: number) => void) {
  const progress = useSharedValue(0);
  const generation = useSharedValue(0);
  const sequence = useRef(0);
  const { sessionId, epoch, phase } = state;
  useEffect(() => { const token = ++sequence.current; generation.value = token; progress.value = 0; return () => { sequence.current = token + 1; generation.value = token + 1; cancelAnimation(progress); }; }, [generation, progress, sessionId, epoch]);
  useEffect(() => {
    if (paused || !phaseDurationMs(phase)) { cancelAnimation(progress); return; }
    let active = true;
    const deliver = (id: string, token: number) => { if (active) onComplete(id, token); };
    const duration = reducedMotion ? 400 : phaseDurationMs(phase);
    // Reanimated shared values are mutable by design.
    // eslint-disable-next-line react-hooks/immutability
    progress.value = withTiming(1, {duration: duration * (1-progress.value), reduceMotion: ReduceMotion.Never, easing: reducedMotion ? (t: number) => { 'worklet'; return t < 1 ? 0 : 1; } : Easing.linear}, finished => {
      if (finished) scheduleOnRN(deliver, sessionId, epoch);
    });
    return () => { active = false; cancelAnimation(progress); };
  }, [progress, sessionId, epoch, phase, paused, reducedMotion, onComplete]);
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
  return {progress, samplePose};
}
