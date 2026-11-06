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
type Value = { value: number; current: number;set:(next:unknown)=>void; timing?: Timing };
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
    __esModule: true, default: { View: require('react-native').View, ScrollView: require('react-native').ScrollView },
    useAnimatedScrollHandler:(handlers:{onScroll:(event:unknown)=>void})=>(event:{nativeEvent?:unknown})=>mockRunUi(()=>handlers.onScroll(event.nativeEvent ?? event)),
    // Retain callable mapper snapshots to test either side of an async commit.
    useAnimatedStyle: (updater: () => unknown) => ({ __read: updater }),
    Easing: { linear: (n: number) => n }, ReduceMotion: { Never: 'never' },
    useSharedValue: (initial: number) => {
      const ref = React.useRef(null);
      if (!ref.current) {
        const v: Value = {
          current: initial,
          set:(next:unknown)=>{v.value=next as number;},
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
  for (let packet = 0; packet < sampleDeck.cards.length; packet++) {
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
  await advance(899); expect(result.current.session.state!.phase).toBe('lift');
  await advance(1); expect(result.current.session.state!.phase).toBe('flip');
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
async function scene(state: SessionState, reducedMotion=false) {
  const view = await render(<ShuffleScene state={state} deck={sampleDeck} locale="en" paused={false} reducedMotion={reducedMotion} {...handlers} />);
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
  expect(mapper(view, 'selected')().opacity).toBe(1);
  await advance(900);
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
  // The native 2:3 card is 238×357, centered at the receiver (300,575).
  expect(mapper(view,'intact')()).toMatchObject({opacity:1,left:181,top:396.5});
  await act(()=>mockAdvance(864));
  const oldIntact=mapper(view,'intact');
  await view.rerender(<ShuffleScene state={next} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  expect(mapper(view,'intact')()).toMatchObject({opacity:1,left:501,top:151.5});
  expect(mapper(view,'source')().opacity).toBe(0);
  await settle();
  expect(oldIntact().opacity).toBe(0);
  expect(mapper(view,'source')()).toMatchObject({opacity:1,left:501,top:151.5});
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

// The selected surface is measured in the full draw host, independently of the mat.
test('drawn card grows to the usable foreground before flip and keeps its native image through confirmation', async () => {
  const selected: SessionState = { ...contact, phase: 'lift', epoch: 3, selectedId: 0, remainingIds: full.remainingIds.slice(1), receivedIds: [1], drawnIds: [0] };
  const view = await scene(selected);
  const initial = backImages(view).find(s => s.role === 'selected')!.images;
  const start = mapper(view, 'selected')();
  expect(start.left).toBeCloseTo(179.76421584071988);
  expect(start.top).toBeCloseTo(392.4069769715194);
  await advance(450);
  const midway = mapper(view, 'selected')();
  await advance(450);
  const enlarged = mapper(view, 'selected')();
  const scale = (pose: Record<string, unknown>) => (pose.transform as {scaleX?:number}[])[0].scaleX!;
  expect(scale(enlarged) * 238).toBeGreaterThan(450);
  expect(scale(midway)).toBeGreaterThan(scale(start));
  expect(scale(midway)).toBeLessThan(scale(enlarged));
  expect(enlarged.top as number).toBeLessThan(396.5);
  const flip = { ...selected, phase: 'flip' as const, epoch: 4 };
  await view.rerender(<ShuffleScene state={flip} deck={sampleDeck} locale="en" paused={false} {...handlers} />);
  await settle();
  expect(mapper(view, 'selected')()).toEqual(enlarged);
  await advance(620);
  await view.rerender(<ShuffleScene state={{ ...flip, phase: 'reveal', epoch: 5 }} deck={sampleDeck} locale="en" paused={false} {...handlers} />);
  await settle();
  expect(mapper(view, 'selected')()).toEqual(enlarged);
  await advance(10000);
  expect(mapper(view, 'selected')()).toEqual(enlarged);
  const images = backImages(view).find(s => s.role === 'selected')!.images;
  expect(images[0]).toBe(initial[0]);
  expect(images[1]).toBe(initial[1]);
  await view.rerender(<ShuffleScene state={{ ...flip, phase: 'resume', epoch: 6, selectedId: null }} deck={sampleDeck} locale="en" paused={false} {...handlers} />);
  expect(mapper(view, 'selected')().opacity).toBe(1);
  await settle();
  expect(mapper(view, 'selected')().opacity).toBe(1);
  await advance(900);
  expect(mapper(view, 'selected')().opacity).toBe(0);
  expect(backImages(view).find(s => s.role === 'selected')!.images[1]).toBe(initial[1]);
});

test('selected surface joins the scrolled mat and refits a held reveal above a wrapped caption without remounting', async () => {
  const selected: SessionState = { ...contact, phase: 'lift', epoch: 3, selectedId: 0, remainingIds: full.remainingIds.slice(1), receivedIds: [1], drawnIds: [0] };
  const view = await scene({...selected,phase:'contact',selectedId:null});
  const face = backImages(view).find(s => s.role === 'selected')!.images[1];
  await fireEvent(view.getByTestId('draw-stage'), 'layout', {nativeEvent:{layout:{width:320,height:480}}});
  await fireEvent(view.getByTestId('shuffle-mat'), 'layout', {nativeEvent:{layout:{x:16,y:16,width:288,height:300}}});
  const scroll=view.container.queryAll(n=>n.type==='RCTScrollView')[0];
  await fireEvent.scroll(scroll, {nativeEvent:{contentOffset:{x:0,y:40}}});
  await fireEvent(view.getByTestId('draw-reveal-hints',{includeHiddenElements:true}), 'layout', {nativeEvent:{layout:{height:140}}});
  await view.rerender(<ShuffleScene state={selected} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  await settle();
  const start=mapper(view,'selected')();
  const sceneScale=300/960;
  expect((start.left as number)+119).toBeCloseTo(16+(288-900*sceneScale)/2+298.76421584071988*sceneScale);
  expect((start.top as number)+178.5).toBeCloseTo(16+570.9069769715194*sceneScale-40);
  await advance(900);
  await view.rerender(<ShuffleScene state={{...selected,phase:'reveal',epoch:4}} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  await settle();
  const checkFit=(width:number,height:number)=>{
    const pose=mapper(view,'selected')();
    const scale=(pose.transform as {scaleX:number}[])[0].scaleX;
    const x=(pose.left as number)+119,y=(pose.top as number)+178.5;
    expect(x-119*scale).toBeGreaterThanOrEqual(0);
    expect(x+119*scale).toBeLessThanOrEqual(width);
    expect(y-178.5*scale).toBeGreaterThanOrEqual(72);
    expect(y+178.5*scale).toBeLessThanOrEqual(height-16);
    expect(238*scale).toBeLessThanOrEqual(width*.9);
  };
  checkFit(320,480);
  await fireEvent(view.getByTestId('draw-stage'), 'layout', {nativeEvent:{layout:{width:280,height:360}}});
  checkFit(280,360);
  expect(backImages(view).find(s=>s.role==='selected')!.images[1]).toBe(face);
  expect(view.getByTestId('draw-foreground-confirm')).toBeEnabled();
});

test('oversized reveal caption leaves visible artwork and remains scrollable on a short host', async () => {
  const selected: SessionState = {...contact,phase:'reveal',epoch:3,selectedId:0,drawnIds:[0]};
  const view=await scene(selected);
  await fireEvent(view.getByTestId('draw-stage'),'layout',{nativeEvent:{layout:{width:280,height:300}}});
  await fireEvent(view.getByTestId('draw-reveal-hints'),'layout',{nativeEvent:{layout:{height:700}}});
  const pose=mapper(view,'selected')();
  expect((pose.transform as {scaleX:number}[])[0].scaleX*357).toBeGreaterThan(100);
  const captionScroll=view.getByTestId('draw-reveal-scroll');
  expect(captionScroll.props.scrollEnabled).not.toBe(false);
  expect(StyleSheet.flatten(captionScroll.props.style).bottom).toBe(0);
});

test('opaque drawing cover follows enlargement, pauses with its clock and fades after the coherent confirmation boundary', async () => {
  const selected: SessionState={...contact,phase:'lift',epoch:3,selectedId:0,drawnIds:[0]};
  const view=await scene(ready);
  const dim=()=>view.getByTestId('draw-foreground-dim',{includeHiddenElements:true});
  const opacity=()=>dim().props.style[1].__read().opacity;
  expect(opacity()).toBe(0);
  await view.rerender(<ShuffleScene state={selected} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  expect(opacity()).toBe(0); // RN cannot dim the prior shuffle frame early.
  await settle();
  await advance(450);
  expect(opacity()).toBeCloseTo(.5);
  await view.rerender(<ShuffleScene state={selected} deck={sampleDeck} locale="en" paused {...handlers}/>);
  await settle();
  await advance(1000);
  expect(opacity()).toBeCloseTo(.5);
  await view.rerender(<ShuffleScene state={selected} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  await settle();
  await advance(450);
  expect(opacity()).toBeCloseTo(1);
  for(const [phase,epoch] of [['flip',4],['reveal',5]] as const){
    await view.rerender(<ShuffleScene state={{...selected,phase,epoch}} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
    await settle();
    expect(opacity()).toBeCloseTo(1);
  }
  await view.rerender(<ShuffleScene state={{...selected,phase:'resume',epoch:6,selectedId:null}} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  expect(opacity()).toBeCloseTo(1); // Old image and backdrop leave together on UI.
  await settle();
  await advance(130);
  expect(opacity()).toBeGreaterThan(0);
  expect(opacity()).toBeLessThan(1);
  await advance(770);
  expect(opacity()).toBe(0);
});

test('confirmation retains the face and caption while they fade upward and the cover clears slowly', async()=>{
  const revealed:SessionState={...contact,phase:'reveal',epoch:3,selectedId:0,drawnIds:[0]};
  const view=await scene(revealed);
  const original=mapper(view,'selected')();
  const face=backImages(view).find(s=>s.role==='selected')!.images[1];
  const front=()=>face.parent!.props.style[1].__read().opacity;
  const reverse=backImages(view).find(s=>s.role==='selected')!.images[0];
  const backOpacity=()=>reverse.parent!.props.style[1].__read().opacity;
  const selectedStack=stacks(view).find(s=>roleOf(s)==='selected')!;
  const edges=selectedStack.queryAll(n=>Array.isArray(n.props.style)&&StyleSheet.flatten(n.props.style[0])?.backgroundColor==='#f0eee8');
  expect(edges).toHaveLength(12);
  for(const edge of edges)expect(edge.props.style[1].__read().opacity).toBe(0);
  expect(backOpacity()).toBe(0);
  const caption=()=>view.getByTestId('draw-reveal-caption',{includeHiddenElements:true}).props.style[1].__read();
  const cover=()=>view.getByTestId('draw-foreground-dim',{includeHiddenElements:true}).props.style[1].__read().opacity;
  const resumed={...revealed,phase:'resume' as const,epoch:4,selectedId:null};
  await view.rerender(<ShuffleScene state={resumed} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  expect(mapper(view,'selected')()).toEqual(original);
  await settle();
  expect(mapper(view,'selected')()).toEqual(original);
  expect(front()).toBe(1);
  expect(backOpacity()).toBe(0);
  expect(caption().opacity).toBe(1);
  await advance(450);
  const halfway=mapper(view,'selected')();
  expect(halfway.opacity).toBeCloseTo(.5);
  expect(halfway.top).toBeCloseTo((original.top as number)-8);
  expect(front()).toBe(1);
  expect(backOpacity()).toBe(0);
  expect(caption().opacity).toBeCloseTo(.5);
  expect(caption().transform).toEqual([{translateY:-8}]);
  expect(cover()).toBeCloseTo(.5);
  await view.rerender(<ShuffleScene state={resumed} deck={sampleDeck} locale="en" paused {...handlers}/>);
  await settle();
  await advance(1000);
  expect(mapper(view,'selected')()).toEqual(halfway);
  await view.rerender(<ShuffleScene state={resumed} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  await settle();
  await advance(225);
  expect(mapper(view,'selected')().opacity).toBeGreaterThan(0);
  expect(caption().opacity).toBeGreaterThan(0);
  expect(cover()).toBeGreaterThan(0);
  await advance(225);
  expect(mapper(view,'selected')().opacity).toBe(0);
  expect(caption().opacity).toBe(0);
  expect(cover()).toBe(0);
  expect(backImages(view).find(s=>s.role==='selected')!.images[1]).toBe(face);
});

test('reduced-motion exhausted confirmation holds one stepped exit then opens results without another draw',async()=>{
  const deck={...sampleDeck,cards:[sampleDeck.cards[0]]};
  const {result}=await renderHook(()=>{
    const session=usePreviewSession(deck);
    const animation=useShuffleAnimation(session.state ?? base,!session.state,true,session.complete);
    return {session,animation};
  });
  await act(()=>result.current.session.reset()); await settle();
  const first=result.current.session.state!;
  await act(()=>result.current.session.draw({x:620,y:330,angle:0,scale:1},first.sessionId,first.epoch)); await settle();
  for(const phase of ['lift','flip','reveal']){await advance(400);expect(result.current.session.state!.phase).toBe(phase);}
  await act(()=>result.current.session.confirm()); await settle();
  const exit=result.current.session.state;
  expect(exit!.phase).toBe('resume');
  await act(()=>result.current.session.confirm());
  expect(result.current.session.state).toBe(exit);
  await advance(399);
  expect(result.current.animation.progress.value).toBe(0);
  expect(result.current.session.state).toBe(exit);
  await advance(1);
  expect(result.current.session.state).toMatchObject({phase:'results',drawnIds:[0],remainingIds:[]});
});


test('reveal scroll collapses the same face, keeps its tap target aligned and restores large at the top',async()=>{
  const revealed:SessionState={...contact,phase:'reveal',epoch:3,selectedId:0,drawnIds:[0]};
  const view=await scene(revealed);
  const image=backImages(view).find(s=>s.role==='selected')!.images[1];
  const original=mapper(view,'selected')();
  const scale=(pose:Record<string,unknown>)=>(pose.transform as {scaleX:number}[])[0].scaleX;
  const viewport=StyleSheet.flatten(view.getByTestId('draw-reveal-scroll').props.style);
  const spacer=view.getByTestId('draw-reading-artwork-band').props.style[1].height;
  expect(viewport.top+spacer+view.getByTestId('draw-reading-info').props.style.minHeight).toBeGreaterThanOrEqual(960);
  expect(scale(original)*238).toBeGreaterThan(450);
  await fireEvent.scroll(view.getByTestId('draw-reveal-scroll'),{nativeEvent:{contentOffset:{x:0,y:100}}});await settle();
  const small=mapper(view,'selected')();
  expect(scale(small)*357).toBeCloseTo(scale(original)*357-100);
  expect((small.top as number)+178.5-178.5*scale(small)).toBeCloseTo((original.top as number)+178.5-178.5*scale(original));
  const hit=view.getByTestId('draw-reading-hitbox').props.style[1].__read();
  expect(hit.width).toBeCloseTo(238*scale(small));
  expect(hit.height).toBeCloseTo(357*scale(small));
  expect(hit.top+viewport.top).toBeCloseTo((small.top as number)+178.5-178.5*scale(small));
  expect(view.getByTestId('draw-reading-artwork-band').props.style[2].__read().transform).toEqual([{translateY:100}]);
  expect(backImages(view).find(s=>s.role==='selected')!.images[1]).toBe(image);
  await fireEvent.scroll(view.getByTestId('draw-reveal-scroll'),{nativeEvent:{contentOffset:{x:0,y:0}}});await settle();
  expect(mapper(view,'selected')()).toEqual(original);
});

test('confirmation fades from the collapsed reading pose and ignores later scroll events',async()=>{
  const revealed:SessionState={...contact,phase:'reveal',epoch:3,selectedId:0,drawnIds:[0]};
  const view=await scene(revealed);
  await fireEvent.scroll(view.getByTestId('draw-reveal-scroll'),{nativeEvent:{contentOffset:{y:180}}});await settle();
  const collapsed=mapper(view,'selected')();
  const scroll=view.getByTestId('draw-reveal-scroll').props.onScroll;
  await view.rerender(<ShuffleScene state={{...revealed,phase:'resume',epoch:4,selectedId:null}} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  expect(mapper(view,'selected')()).toEqual(collapsed);
  await settle();expect(mapper(view,'selected')()).toEqual(collapsed);
  await act(()=>scroll({nativeEvent:{contentOffset:{y:300}}}));
  expect(mapper(view,'selected')()).toEqual(collapsed);
  await advance(450);
  expect(mapper(view,'selected')().opacity).toBeCloseTo(.5);
  expect(mapper(view,'selected')().top).toBeCloseTo((collapsed.top as number)-8);
});

test.each([['new-session',0],['one',7]] as const)('new reveal %s/%i resets reading and rejects the old native scroll callback',async(sessionId,selectedId)=>{
  const revealed:SessionState={...contact,phase:'reveal',epoch:3,selectedId:0,drawnIds:[0]};
  const view=await scene(revealed);
  const original=mapper(view,'selected')();
  const oldScroll=view.getByTestId('draw-reveal-scroll').props.onScroll;
  await fireEvent.scroll(view.getByTestId('draw-reveal-scroll'),{nativeEvent:{contentOffset:{y:180}}});await settle();
  const collapsed=mapper(view,'selected')();
  await view.rerender(<ShuffleScene state={{...revealed,sessionId,epoch:6,selectedId,drawnIds:[selectedId]}} deck={sampleDeck} locale="en" paused={false} {...handlers}/>);
  expect(mapper(view,'selected')()).toEqual(collapsed);
  await settle();expect(mapper(view,'selected')()).toEqual(original);
  await act(()=>oldScroll({nativeEvent:{contentOffset:{y:300}}}));
  expect(mapper(view,'selected')()).toEqual(original);
});

test('reduced motion keeps the initial face large and changes reading size without continuous animation',async()=>{
  const revealed:SessionState={...contact,phase:'reveal',epoch:3,selectedId:0,drawnIds:[0]};
  const view=await scene(revealed,true);
  const original=mapper(view,'selected')();
  await fireEvent.scroll(view.getByTestId('draw-reveal-scroll'),{nativeEvent:{contentOffset:{y:1}}});await settle();
  const small=mapper(view,'selected')();
  expect((small.transform as {scaleX:number}[])[0].scaleX*357).toBeCloseTo(112);
  await fireEvent.scroll(view.getByTestId('draw-reveal-scroll'),{nativeEvent:{contentOffset:{y:0}}});await settle();
  expect(mapper(view,'selected')()).toEqual(original);
});

test('reading position and native image survive pause and locale changes for the same card',async()=>{
  const revealed:SessionState={...contact,phase:'reveal',epoch:3,selectedId:0,drawnIds:[0]};
  const view=await scene(revealed);
  await fireEvent.scroll(view.getByTestId('draw-reveal-scroll'),{nativeEvent:{contentOffset:{y:180}}});await settle();
  const collapsed=mapper(view,'selected')();
  const image=backImages(view).find(s=>s.role==='selected')!.images[1];
  const scroll=view.getByTestId('draw-reveal-scroll');
  await view.rerender(<ShuffleScene state={revealed} deck={sampleDeck} locale="cs" paused {...handlers}/>);await settle();
  expect(mapper(view,'selected')()).toEqual(collapsed);
  expect(view.getByTestId('draw-reveal-scroll')).toBe(scroll);
  expect(view.getByTestId('draw-reveal-scroll').props.scrollEnabled).toBe(false);
  expect(view.getByText(sampleDeck.cards[0].translations.cs.sections.meaning)).toBeDefined();
  // A delivered native event describes content that really moved (e.g. momentum
  // during a tab transition). Keep the face/hitbox aligned even while disabled.
  await fireEvent.scroll(scroll,{nativeEvent:{contentOffset:{y:200}}});await settle();
  const settledPose=mapper(view,'selected')();
  expect(settledPose).not.toEqual(collapsed);
  expect(view.getByTestId('draw-reading-artwork-band').props.style[2].__read().transform).toEqual([{translateY:200}]);
  await view.rerender(<ShuffleScene state={revealed} deck={sampleDeck} locale="cs" paused={false} {...handlers}/>);await settle();
  expect(mapper(view,'selected')()).toEqual(settledPose);
  expect(backImages(view).find(s=>s.role==='selected')!.images[1]).toBe(image);
});

test.each([false,true])('manual waiting holds back/cover without a clock or image replacement, reduced motion %s',async(reducedMotion)=>{
 const lift:SessionState={...contact,phase:'lift',epoch:3,selectedId:0,drawnIds:[0],revealMode:'manual'};
 const view=await scene(lift,reducedMotion);await advance(900);
 const pose=mapper(view,'selected')(),image=backImages(view).find(s=>s.role==='selected')!.images[1];
 const waiting:SessionState={...lift,phase:'awaitingReveal',epoch:4};
 await view.rerender(<ShuffleScene state={waiting} deck={sampleDeck} locale="en" paused={false} reducedMotion={reducedMotion} {...handlers}/>);await settle();
 expect(mapper(view,'selected')()).toEqual(pose);
 expect(view.getByTestId('draw-foreground-dim',{includeHiddenElements:true}).props.style[1].__read().opacity).toBe(1);
 expect(view.getByTestId('draw-reveal-caption').props.style[1].__read().opacity).toBe(1);
 const front=backImages(view).find(s=>s.role==='selected')!.images[1].parent!;
 const back=backImages(view).find(s=>s.role==='selected')!.images[0].parent!;
 expect(back.props.style[1].__read().opacity).toBe(1);
 expect(front.props.style[1].__read().opacity).toBe(0);
 handlers.onPhaseComplete.mockClear();
 await advance(60000);expect(handlers.onPhaseComplete).not.toHaveBeenCalled();
 expect(mapper(view,'selected')()).toEqual(pose);
 await view.rerender(<ShuffleScene state={waiting} deck={sampleDeck} locale="cs" paused reducedMotion={reducedMotion} {...handlers}/>);await settle();
 expect(view.getByTestId('draw-flip-card').props.accessibilityState.disabled).toBe(true);
 await view.rerender(<ShuffleScene state={{...waiting,phase:'flip',epoch:5}} deck={sampleDeck} locale="en" paused={false} reducedMotion={reducedMotion} {...handlers}/>);await settle();
 expect(front.props.style[1].__read().opacity).toBe(0);
 await advance(reducedMotion?400:310);expect(front.props.style[1].__read().opacity).toBe(1);
 expect(back.props.style[1].__read().opacity).toBe(0);
 expect(backImages(view).find(s=>s.role==='selected')!.images[1]).toBe(image);
});

test('fabric remains a static noninteractive background through shuffle, reveal and confirmation without replacing card images',async()=>{
 const view=await scene(ready);await settle();
 const fabric=view.getByTestId('shuffle-fabric',{includeHiddenElements:true});
 const source=fabric.props.source, images=backImages(view);
 expect(fabric.props.resizeMode).toBe('repeat');
 expect(view.getByTestId('shuffle-surface',{includeHiddenElements:true}).props.pointerEvents).toBe('none');
 for(const state of [strip,contact,{...full,phase:'return' as const,epoch:3},
  {...full,phase:'reveal' as const,epoch:4,selectedId:0,drawnIds:[0]},
  {...full,phase:'resume' as const,epoch:5,selectedId:0,drawnIds:[0]}]){
  await view.rerender(<ShuffleScene state={state} deck={sampleDeck} locale="en" paused={false} onDraw={()=>{}} onConfirm={()=>{}} onPhaseComplete={()=>{}}/>);await settle();
  expect(view.getByTestId('shuffle-fabric',{includeHiddenElements:true})).toBe(fabric);
  expect(fabric.props.source).toBe(source);
  for(const saved of images)expect(backImages(view).find(stack=>stack.role===saved.role)!.images[0]).toBe(saved.images[0]);
 }
});
