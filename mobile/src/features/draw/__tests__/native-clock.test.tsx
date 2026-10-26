import { act, renderHook } from '@testing-library/react-native';
import type { SessionState } from '../../../domain/contracts';
import { sampleDeck } from '../../../decks/sample';
import { usePreviewSession } from '../usePreviewSession';
import { useShuffleAnimation } from '../useShuffleAnimation';

// RN writes and UI jobs share a deferred FIFO; reads see the last UI value.
// Only native runtime scheduling is doubled. The hooks and reducer are real.
type Timing = { target: number; duration: number; easing: (n: number) => number; callback: (done: boolean) => void; start: number; elapsed: number };
type Value = { value: number; current: number; timing?: Timing };
const mockValues: Value[] = [];
const mockUiQueue: (() => void)[] = [];
const mockRnQueue: (() => void)[] = [];
let mockOnUi = false;
function mockRunUi(job: () => void) { mockOnUi = true; try { job(); } finally { mockOnUi = false; } }
function mockFlushUi() { while (mockUiQueue.length) mockRunUi(mockUiQueue.shift()!); }
function mockFlushRn() { while (mockRnQueue.length) mockRnQueue.shift()!(); }
function mockAdvance(ms: number) {
  mockRunUi(() => {
    for (const v of mockValues) {
      const a = v.timing;
      if (!a) continue;
      a.elapsed += ms;
      const t = Math.min(1, a.elapsed / a.duration);
      v.current = a.start + (a.target - a.start) * a.easing(t);
      if (t === 1) { v.timing = undefined; a.callback(true); }
    }
  });
}
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    Easing: { linear: (n: number) => n }, ReduceMotion: { Never: 'never' },
    useSharedValue: (initial: number) => {
      const ref = React.useRef(null);
      if (!ref.current) {
        const v: Value = {
          current: initial,
          get value() { return v.current; },
          set value(next: number) {
            const apply = () => {
              const old = v.timing; v.timing = undefined; old?.callback(false);
              if (typeof next === 'number') v.current = next;
              else {
                const a = next as unknown as Timing;
                if (a.duration === 0 || a.target === v.current) { v.current = a.target; a.callback(true); }
                else v.timing = { ...a, start: v.current, elapsed: 0 };
              }
            };
            if (mockOnUi) apply(); else mockUiQueue.push(apply);
          },
        };
        ref.current = v; mockValues.push(v);
      }
      return ref.current;
    },
    withTiming: (target: number, config: { duration: number; easing: (n: number) => number; reduceMotion?: string }, callback: (done: boolean) => void) => ({ target, ...config, callback }),
    cancelAnimation: (v: Value) => {
      const cancel = () => { v.value = v.value; };
      if (mockOnUi) cancel(); else mockUiQueue.push(cancel);
    },
  };
});
jest.mock('react-native-worklets', () => ({
  scheduleOnUI: (fn: (...args: unknown[]) => void, ...args: unknown[]) => mockUiQueue.push(() => fn(...args)),
  scheduleOnRN: (fn: (...args: unknown[]) => void, ...args: unknown[]) => mockRnQueue.push(() => fn(...args)),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'native-session', getRandomValues: (a: Uint32Array) => { a[0] = 0; return a; } }));
const base: SessionState = { sessionId: 'one', epoch: 0, phase: 'regrip', deckId: 'sample', deckVersion: '1', remainingIds: [0], drawnIds: [], sourceIds: [], receivedIds: [], flyingIds: [], selectedId: null, drawQueued: false, phaseOrigin: null };
beforeEach(() => { mockValues.length = 0; mockUiQueue.length = 0; mockRnQueue.length = 0; mockOnUi = false; });
async function settle() { await act(mockFlushRn); await act(mockFlushUi); }
async function advance(ms: number) { await act(() => mockAdvance(ms)); await settle(); }

test('native deferred writes preserve timed shuffle cycles and accept a late draw', async () => {
  const { result } = await renderHook(() => {
    const session = usePreviewSession(sampleDeck);
    const animation = useShuffleAnimation(session.state ?? base, !session.state, false, session.complete);
    return { session, animation };
  });
  await act(() => result.current.session.reset()); await settle();
  await advance(624);
  expect(result.current.session.state!.phase).toBe('ready');
  // RN observed the previous phase's 1 when its effects scheduled this reset.
  expect(result.current.animation.progress.value).toBe(0);
  await advance(72); expect(result.current.session.state!.phase).toBe('ready');
  expect(result.current.animation.progress.value).toBeCloseTo(.5);
  await advance(72);
  for (let packet = 0; packet < 8; packet++) {
    expect(result.current.session.state!.phase).toBe('strip');
    await advance(248); expect(result.current.animation.progress.value).toBeCloseTo(.5);
    await advance(248); expect(result.current.session.state!.phase).toBe('contact');
    await advance(96);
  }
  expect(result.current.session.state!.phase).toBe('return');
  await advance(432); expect(result.current.animation.progress.value).toBeCloseTo(.5);
  await advance(432); expect(result.current.session.state!.phase).toBe('ready');
  await advance(144); expect(result.current.session.state!.phase).toBe('strip');
  await advance(200);
  await act(() => result.current.animation.samplePose(result.current.session.draw)); await settle();
  await settle();
  expect(result.current.session.state!.drawQueued).toBe(true);
  await advance(296); expect(result.current.session.state!.phase).toBe('contact');
  const landedTop = result.current.session.state!.receivedIds[0];
  expect(result.current.session.state!.drawnIds).toHaveLength(0);
  await advance(96); expect(result.current.session.state!.phase).toBe('lift');
  expect(result.current.session.state!.selectedId).toBe(landedTop);
  await advance(640); expect(result.current.session.state!.phase).toBe('flip');
  await advance(620); expect(result.current.session.state!.phase).toBe('reveal');
  expect(result.current.session.state!.drawnIds).toHaveLength(1);
  await advance(10000); expect(result.current.session.state!.phase).toBe('reveal');
});

test('native pause samples on UI after the final frame and resumes the remaining time', async () => {
  const complete = jest.fn();
  const { result, rerender } = await renderHook(({ paused }: { paused: boolean }) => useShuffleAnimation(base, paused, false, complete), { initialProps: { paused: false } });
  await settle(); await advance(200);
  await rerender({ paused: true });
  // A frame can run after RN requests a pause, before that UI job executes.
  await act(() => mockAdvance(112)); await settle();
  expect(result.current.progress.value).toBeCloseTo(.5);
  await advance(2000); expect(complete).not.toHaveBeenCalled();
  await rerender({ paused: false }); await settle();
  await advance(311); expect(complete).not.toHaveBeenCalled();
  await advance(1); expect(complete).toHaveBeenCalledWith('one', 0);
});
