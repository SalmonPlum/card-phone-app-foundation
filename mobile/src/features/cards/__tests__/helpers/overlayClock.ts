// Only the native UI/RN schedulers and animation clock are replaced.
import { act } from '@testing-library/react-native';
type Timing = { target: number; duration: number; easing: (n: number) => number; callback: (done: boolean) => void; start: number; elapsed: number };
type Value = { value: unknown; current: unknown; set: (next:unknown)=>void; timing?: Timing };
const mockValues: Value[] = [], mockUi: (() => void)[] = [], mockRn: (() => void)[] = [];
let mockOnUi = false;
function mockRunUi(job: () => void) { mockOnUi = true; try { job(); } finally { mockOnUi = false; } }
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    __esModule: true, default: { View: require('react-native').View, ScrollView: require('react-native').ScrollView },
    useAnimatedScrollHandler: (handlers: {onScroll:(event:unknown)=>void}) => (event:{nativeEvent?:unknown}) => mockRunUi(()=>handlers.onScroll(event.nativeEvent ?? event)),
    useAnimatedStyle: (read: () => unknown) => ({ __read: read }),
    Easing: { linear: (n: number) => n, cubic: (n: number) => n ** 3, out: (fn: (n: number) => number) => (n: number) => 1 - fn(1 - n) },
    ReduceMotion: { Never: 'never' },
    useSharedValue: (initial: unknown) => {
      const ref = React.useRef(null);
      if (!ref.current) {
        const v: Value = {
          current: initial,
          set: (next:unknown) => {v.value=next;},
          get value() { return v.current; },
          set value(next: unknown) {
            const apply = () => {
              const old = v.timing; v.timing = undefined; old?.callback(false);
              if (typeof next === 'object' && next !== null && 'target' in next) {
                const timing = next as Timing;
                if (timing.duration === 0) { v.current = timing.target; timing.callback(true); }
                else v.timing = { ...timing, start: v.current as number, elapsed: 0 };
              } else v.current = next;
            };
            if (mockOnUi) apply(); else mockUi.push(apply);
          },
        };
        ref.current = v; mockValues.push(v);
      }
      return ref.current;
    },
    withTiming: (target: number, config: { duration: number; easing?: Timing['easing'] }, callback: Timing['callback'] = () => {}) => ({ target, easing: (n: number) => n, ...config, callback }),
    cancelAnimation: (v: Value) => {
      const cancel = () => { const old = v.timing; v.timing = undefined; old?.callback(false); };
      if (mockOnUi) cancel(); else mockUi.push(cancel);
    },
  };
});
jest.mock('react-native-worklets', () => ({
  runOnUISync: (fn: (...args: unknown[]) => void, ...args: unknown[]) => mockRunUi(() => fn(...args)),
  scheduleOnUI: (fn: (...args: unknown[]) => void, ...args: unknown[]) => mockUi.push(() => fn(...args)),
  scheduleOnRN: (fn: (...args: unknown[]) => void, ...args: unknown[]) => mockRn.push(() => fn(...args)),
}));
export function resetClock() { mockValues.length = 0; mockUi.length = 0; mockRn.length = 0; mockOnUi = false; }
export async function flushUi() { await act(() => { while (mockUi.length) mockRunUi(mockUi.shift()!); }); }
export async function flushRn() { await act(() => { while (mockRn.length) mockRn.shift()!(); }); }
export async function settle() { await flushUi(); await flushRn(); await flushUi(); }
export async function advance(ms: number) {
  await act(() => mockRunUi(() => {
    for (const v of mockValues) {
      const timing = v.timing;
      if (!timing) continue;
      timing.elapsed += ms;
      const t = Math.min(1, timing.elapsed / timing.duration);
      v.current = timing.start + (timing.target - timing.start) * timing.easing(t);
      if (t === 1) { v.timing = undefined; timing.callback(true); }
    }
  }));
}

export function runningClocks() { return mockValues.filter(v => v.timing).map(v => ({ value: v.current as number, duration: v.timing!.duration })); }
