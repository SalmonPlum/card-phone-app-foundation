import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { TestInstance } from 'test-renderer';
import { ShuffleScene } from '../ShuffleScene';
import { Stack } from '../Stack';
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    __esModule: true, default: { View: require('react-native').View },
    // Retain callable mapper snapshots to test either side of an async commit.
    useAnimatedStyle: (updater: () => unknown) => ({ __read: updater }),
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
              if (typeof next !== 'object' || next === null || !('target' in next)) v.current = next;
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


const handlers = { onDraw: jest.fn(), onConfirm: jest.fn(), onPhaseComplete: jest.fn() };
async function scene(state: SessionState) {
  const view = await render(<ShuffleScene state={state} deck={sampleDeck} locale="en" paused={false} {...handlers} />);
  await fireEvent(view.container.queryAll(n => typeof n.props.onLayout === 'function')[0], 'layout', { nativeEvent: { layout: { width: 900, height: 960 } } });
  await settle();
  return view;
}
function stacks(view: Awaited<ReturnType<typeof scene>>) {
  return view.container.queryAll(n => Array.isArray(n.props.style) && StyleSheet.flatten(n.props.style[0])?.width === 238 && typeof n.props.style[1]?.__read === 'function' && 'left' in n.props.style[1].__read());
}
function roleOf(host: TestInstance): string {
  // Test Renderer 1.3 exposes only hosts; walk ownership to label the real Stack.
  for (let owner = host.unstable_fiber; owner; owner = owner.return) if (owner.type === Stack) return owner.memoizedProps.role;
  throw new Error('Stack owner missing');
}
function mapper(view: Awaited<ReturnType<typeof scene>>, role: string) {
  const host = stacks(view).find(s => roleOf(s) === role)!;
  return (host.props.style[1] as { __read: () => Record<string, unknown> }).__read;
}
function backImages(view: Awaited<ReturnType<typeof scene>>) {
  return stacks(view).map(stack => ({ role: roleOf(stack), images: stack.queryAll(n => n.type === 'Image') }));
}
const full = { ...base, remainingIds: [0, 1, 2, 3, 4, 5, 6, 7] };
const ready = { ...full, phase: 'ready' as const, sourceIds: full.remainingIds };
const strip = { ...full, epoch: 1, phase: 'strip' as const, sourceIds: [2, 3, 4, 5, 6, 7], flyingIds: [0, 1] };
const contact = { ...full, epoch: 2, phase: 'contact' as const, sourceIds: strip.sourceIds, receivedIds: [0, 1] };

test('React commit before UI phase reset keeps the previous visible surfaces and top depth', async () => {
  const view = await scene(ready);
  await act(() => mockAdvance(144));
  const before = mapper(view, 'source')();
  const beforeDepth = backImages(view).find(s => s.role === 'source')!.images[0].parent!.props.style[1].__read?.();
  await view.rerender(<ShuffleScene state={strip} deck={sampleDeck} locale="en" paused={false} {...handlers} />);
  // New RN closures must not paint a packet at the previous clock's endpoint.
  const flying = mapper(view, 'flying')();
  expect(flying.opacity === 0 ? 'previous frame' : flying.left).toBe('previous frame');
  expect(mapper(view, 'source')()).toEqual(before);
  expect(backImages(view).find(s => s.role === 'source')!.images[0].parent!.props.style[1].__read?.()).toEqual(beforeDepth);
  await settle();
  expect(mapper(view, 'flying')().opacity).toBe(1);
  expect(mapper(view, 'flying')().left).toBeGreaterThan(450);
});

test('UI phase reset before mapper replacement makes old mappers read the same phase and counts', async () => {
  const prior = { ...strip, sourceIds: [2, 3, 4, 5, 6], receivedIds: [7] };
  const landed = { ...contact, sourceIds: prior.sourceIds, receivedIds: [0, 1, 7] };
  const view = await scene(prior);
  await act(() => mockAdvance(496));
  const oldFlying = mapper(view, 'flying');
  const oldReceiver = mapper(view, 'receiver');
  await view.rerender(<ShuffleScene state={landed} deck={sampleDeck} locale="en" paused={false} {...handlers} />);
  await settle();
  await act(() => mockAdvance(24));
  expect(oldReceiver()).toEqual(mapper(view, 'receiver')());
  expect(oldFlying().opacity).toBe(0);
});

test('back images survive packets, intact return, and resume order changes without native fade', async () => {
  const view = await scene(ready);
  const initial = backImages(view);
  expect(initial).toHaveLength(5);
  for (const { images } of initial) {
    expect(images).toHaveLength(1);
    expect(images[0].props.fadeDuration).toBe(0);
  }
  const states: SessionState[] = [strip, contact, { ...strip, epoch: 3 }, { ...full, phase: 'return', epoch: 4 }, { ...ready, epoch: 5 }, { ...contact, phase: 'resume', epoch: 6 }, { ...full, phase: 'return', epoch: 7 }];
  for (const state of states) {
    await view.rerender(<ShuffleScene state={state} deck={sampleDeck} locale="en" paused={false} {...handlers} />);
    await settle();
    const next = backImages(view);
    for (const saved of initial) expect(next.find(s => s.role === saved.role)!.images[0]).toBe(saved.images[0]);
  }
});


test('selected face stays mounted until UI leaves reveal and still supports asset error retry', async () => {
  const selected = { ...contact, phase: 'reveal' as const, epoch: 3, selectedId: 0, remainingIds: full.remainingIds.slice(1), receivedIds: [1], drawnIds: [0] };
  const view = await scene(selected);
  const image = () => backImages(view).find(s => s.role === 'selected')!.images;
  expect(image()).toHaveLength(2);
  expect(image()[1].props.fadeDuration).toBe(0);
  await fireEvent(image()[1], 'error');
  expect(image()).toHaveLength(1);
  await fireEvent.press(view.getAllByRole('button', { name: 'Try again' })[0]);
  expect(image()).toHaveLength(2);
  const face = image()[1];
  await view.rerender(<ShuffleScene state={{...selected,phase:'resume',epoch:4,selectedId:null}} deck={sampleDeck} locale="en" paused={false} {...handlers} />);
  expect(image()[1]).toBe(face);
  expect(mapper(view, 'selected')().opacity).toBe(1);
  await settle();
  expect(mapper(view, 'selected')().opacity).toBe(0);
});


test.each([1, 8, 100])('intact return waits for a coherent UI boundary for %i cards', async count => {
  const all = Array.from({length:count}, (_,i)=>i);
  const landed = { ...base, remainingIds: all, receivedIds: all, phase: 'contact' as const };
  const returning = { ...landed, receivedIds: [], epoch: 1, phase: 'return' as const };
  const next = { ...returning, sourceIds: all, epoch: 2, phase: 'ready' as const };
  const view = await scene(landed);
  await act(()=>mockAdvance(96));
  const prior = mapper(view,'receiver')();
  await view.rerender(<ShuffleScene state={returning} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  expect(mapper(view,'receiver')()).toEqual(prior);
  expect(mapper(view,'intact')().opacity).toBe(0);
  await settle();
  expect(mapper(view,'intact')()).toMatchObject({opacity:1,left:181,top:396});
  await act(()=>mockAdvance(864));
  const oldIntact=mapper(view,'intact');
  await view.rerender(<ShuffleScene state={next} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  expect(mapper(view,'intact')()).toMatchObject({opacity:1,left:501,top:151});
  expect(mapper(view,'source')().opacity).toBe(0);
  await settle();
  expect(oldIntact().opacity).toBe(0);
  expect(mapper(view,'source')()).toMatchObject({opacity:1,left:501,top:151});
  const edges=stacks(view).find(s=>roleOf(s)==='source')!.children.slice(0,12) as TestInstance[];
  expect(edges.filter(e=>e.props.style[1].__read().opacity===1)).toHaveLength(Math.min(count,12));
  expect(edges).toHaveLength(12);
});


test('native flying image identity survives its zero-count contact interval', async () => {
  const view=await scene(strip);
  const flying=()=>backImages(view).find(s=>s.role==='flying')?.images[0];
  const first=flying();
  expect(first).toBeDefined();
  await view.rerender(<ShuffleScene state={contact} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  await settle();
  await view.rerender(<ShuffleScene state={{...strip,epoch:3}} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  await settle();
  expect(flying() === first).toBe(true);
});

test('native source image identity survives the whole-deck return interval', async () => {
  const view=await scene(ready);
  const source=()=>backImages(view).find(s=>s.role==='source')?.images[0];
  const first=source();
  expect(first).toBeDefined();
  await view.rerender(<ShuffleScene state={{...full,epoch:1,phase:'return'}} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  await settle();
  await view.rerender(<ShuffleScene state={{...ready,epoch:2}} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  await settle();
  expect(source() === first).toBe(true);
});

test.each([true,false])('queue-only DRAW preserves the existing packet deadline (reduced=%s)', async reduced => {
  const complete=jest.fn();
  const {result,rerender}=await renderHook(({state}:{state:SessionState})=>useShuffleAnimation(state,false,reduced,complete),{initialProps:{state:strip}});
  await settle();
  await act(()=>mockAdvance(300));
  const poseProgress=result.current.progress.value;
  await rerender({state:{...strip,drawQueued:true}});
  await settle();
  expect(result.current.progress.value).toBe(poseProgress);
  const remaining=reduced?100:196;
  await advance(remaining-1);
  expect(complete).not.toHaveBeenCalled();
  await advance(1);
  expect(complete).toHaveBeenCalledTimes(1);
  expect(complete).toHaveBeenCalledWith(strip.sessionId,strip.epoch);
  await advance(1000);
  expect(complete).toHaveBeenCalledTimes(1);
});

test('reduced-motion late queued draw lands at the original deadline and commits once after contact', async () => {
  const {result}=await renderHook(()=>{
    const session=usePreviewSession(sampleDeck);
    const animation=useShuffleAnimation(session.state ?? base,!session.state,true,session.complete);
    return {session,animation};
  });
  await act(()=>result.current.session.reset());
  await settle();
  await advance(400);
  await advance(400);
  expect(result.current.session.state!.phase).toBe('strip');
  const packetTop=result.current.session.state!.flyingIds[0];
  const epoch=result.current.session.state!.epoch;
  await advance(300);
  await act(()=>result.current.animation.samplePose(result.current.session.draw));
  await settle();
  await settle();
  expect(result.current.session.state).toMatchObject({phase:'strip',epoch,drawQueued:true});
  await advance(99);
  expect(result.current.session.state!.phase).toBe('strip');
  await advance(1);
  expect(result.current.session.state).toMatchObject({phase:'contact',epoch:epoch+1});
  expect(result.current.session.state!.drawnIds).toHaveLength(0);
  await advance(400);
  expect(result.current.session.state).toMatchObject({phase:'lift',epoch:epoch+2,selectedId:packetTop});
  expect(result.current.session.state!.drawnIds).toHaveLength(1);
  await advance(400);
  await advance(400);
  await advance(1000);
  expect(result.current.session.state!.phase).toBe('reveal');
  expect(result.current.session.state!.drawnIds).toHaveLength(1);
});
