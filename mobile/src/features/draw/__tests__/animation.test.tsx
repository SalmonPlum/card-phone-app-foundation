import { act, renderHook } from '@testing-library/react-native';
import { usePreviewSession } from '../usePreviewSession';
import { sampleDeck } from '../../../decks/sample';
import { useShuffleAnimation } from '../useShuffleAnimation';
import { regripPose, returnPose } from '../motion';
import type { SessionState } from '../../../domain/contracts';

// A deterministic clock models timing progress, cancellation and delayed UI→RN delivery.
type Timing={target:number;duration:number;easing:(n:number)=>number;callback:(done:boolean)=>void;start:number;elapsed:number};
type Value={value:number; current:number; timing?:Timing};
const mockValues:Value[]=[];
const mockQueue:(()=>void)[]=[];
const mockUiQueue:(()=>void)[]=[];
let mockSystemReduce = false;
function mockFlushUi(){while(mockUiQueue.length)mockUiQueue.shift()!();}
function mockAdvance(ms:number) {
 mockFlushUi();
 for(const v of mockValues) {const a=v.timing;if(!a)continue; a.elapsed+=ms;const t=Math.min(1,a.elapsed/a.duration);v.current=a.start+(a.target-a.start)*a.easing(t);if(t===1){v.timing=undefined;a.callback(true);}}
}
function mockFlush(){while(mockQueue.length)mockQueue.shift()!();}
jest.mock('react-native-reanimated',()=>{
 // Jest mock factories execute before module imports.
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const React=require('react');
 return {
  Easing:{linear:(n:number)=>n}, ReduceMotion:{Never:'never'},
  useSharedValue:(initial:number)=>{const ref=React.useRef(null);if(!ref.current){const v:Value={current:initial,get value(){return v.current;},set value(next:number){if(typeof next==='number'){v.current=next;v.timing=undefined;}else{const a=next as unknown as Timing;v.timing={...a,start:v.current,elapsed:0};}}};ref.current=v;mockValues.push(v);}return ref.current;},
  withTiming:(target:number, config:{duration:number;easing:(n:number)=>number;reduceMotion?:string},callback:(done:boolean)=>void)=>({target,...config,duration:mockSystemReduce && config.reduceMotion !== 'never' ? 1 : config.duration,callback}),
  cancelAnimation:(v:Value)=>{const a=v.timing;v.timing=undefined;if(a)a.callback(false);},
 };
});
jest.mock('react-native-worklets',()=>({scheduleOnRN:(fn:(...args:unknown[])=>void,...args:unknown[])=>mockQueue.push(()=>fn(...args)),scheduleOnUI:(fn:(...args:unknown[])=>void,...args:unknown[])=>mockUiQueue.push(()=>fn(...args))}));
const base:SessionState={sessionId:'one',epoch:0,phase:'regrip',deckId:'sample',deckVersion:'1',remainingIds:[0],drawnIds:[],sourceIds:[],receivedIds:[],flyingIds:[],selectedId:null,drawQueued:false,phaseOrigin:null};
beforeEach(()=>{mockValues.length=0;mockQueue.length=0;mockUiQueue.length=0;mockSystemReduce=false;});
test('pause cancels completion and resumes from the current progress',async()=>{
 const complete=jest.fn();const {result,rerender}=await renderHook(({paused}:{paused:boolean})=>useShuffleAnimation(base,paused,false,complete),{initialProps:{paused:false}});await act(mockFlushUi);
 await act(()=>mockAdvance(312));expect(result.current.progress.value).toBeCloseTo(.5);
 await rerender({paused:true});await act(()=>{mockAdvance(2000);mockFlush();});expect(complete).not.toHaveBeenCalled();expect(result.current.progress.value).toBeCloseTo(.5);
 await rerender({paused:false});await act(()=>{mockAdvance(311);mockFlush();});expect(complete).not.toHaveBeenCalled();
 await act(()=>{mockAdvance(1);mockFlush();});expect(complete).toHaveBeenCalledTimes(1);expect(complete).toHaveBeenCalledWith('one',0);
});
test('queued completion is discarded after epoch change and unmount',async()=>{
 const complete=jest.fn();const {rerender,unmount}=await renderHook(({state}:{state:SessionState})=>useShuffleAnimation(state,false,false,complete),{initialProps:{state:base}});await act(mockFlushUi);
 await act(()=>mockAdvance(624));await rerender({state:{...base,epoch:1,phase:'ready'}});await act(mockFlush);expect(complete).not.toHaveBeenCalled();
 await act(()=>mockAdvance(144));await unmount();await act(mockFlush);expect(complete).not.toHaveBeenCalled();
});
test('reduced motion holds its pose for 400ms and delivers one boundary',async()=>{
 mockSystemReduce=true;const complete=jest.fn();const {result}=await renderHook(()=>useShuffleAnimation(base,false,true,complete));await act(mockFlushUi);
 await act(()=>{mockAdvance(399);mockFlush();});expect(result.current.progress.value).toBe(0);expect(complete).not.toHaveBeenCalled();
 await act(()=>{mockAdvance(1);mockFlush();});expect(result.current.progress.value).toBe(1);expect(complete).toHaveBeenCalledTimes(1);
 await act(()=>{mockAdvance(10000);mockFlush();});expect(complete).toHaveBeenCalledTimes(1);
});

jest.mock('expo-crypto',()=>({randomUUID:()=> 'reduced-session',getRandomValues:(a:Uint32Array)=>{a[0]=0;return a;}}));
test('reduced motion draws once and holds reveal without a busy loop',async()=>{
 const {result}=await renderHook(()=>{const session=usePreviewSession(sampleDeck);const animation=useShuffleAnimation(session.state ?? base,!session.state,true,session.complete);return {session,animation};});
 await act(()=>result.current.session.reset());const s=result.current.session.state!;
 await act(()=>result.current.session.draw({x:620,y:330,angle:.12,scale:1},s.sessionId,s.epoch));
 expect(result.current.session.state!.phase).toBe('lower');
 for(const expected of ['lift','flip','reveal']){await act(()=>{mockAdvance(400);mockFlush();});expect(result.current.session.state!.phase).toBe(expected);}
 expect(result.current.session.state!.drawnIds).toHaveLength(1);
 await act(()=>{mockAdvance(10000);mockFlush();});expect(result.current.session.state!.phase).toBe('reveal');expect(result.current.session.state!.drawnIds).toHaveLength(1);
});

test.each(['regrip','return'] as const)('sample freezes %s before deferred RN delivery',async phase=>{
 const complete=jest.fn(),draw=jest.fn();const state={...base,phase};
 const {result}=await renderHook(()=>useShuffleAnimation(state,false,false,complete));await act(mockFlushUi);
 await act(()=>mockAdvance(200));await act(()=>result.current.samplePose(draw));
 await act(()=>mockUiQueue.shift()!());const frozen=result.current.progress.value;
 await act(()=>mockAdvance(1000));expect(result.current.progress.value).toBe(frozen);expect(draw).not.toHaveBeenCalled();
 await act(mockFlush);expect(draw).toHaveBeenCalledTimes(1);expect(draw).toHaveBeenCalledWith(phase==='return'?returnPose(frozen):regripPose(frozen),state.sessionId,state.epoch);
});
test('delayed UI sampling cannot cancel a newer phase or deliver after unmount',async()=>{
 const draw=jest.fn(),complete=jest.fn();const {result,rerender,unmount}=await renderHook(({state}:{state:SessionState})=>useShuffleAnimation(state,false,false,complete),{initialProps:{state:base}});await act(mockFlushUi);
 await act(()=>result.current.samplePose(draw));await rerender({state:{...base,sessionId:'two',epoch:1}});
 await act(()=>mockUiQueue.shift()!());await act(()=>mockAdvance(312));expect(result.current.progress.value).toBeCloseTo(.5);await act(mockFlush);expect(draw).not.toHaveBeenCalled();
 await act(()=>result.current.samplePose(draw));await unmount();await act(()=>mockUiQueue.shift()!());await act(mockFlush);expect(draw).not.toHaveBeenCalled();
});

test('sampled pose survives delayed delivery and commits just one draw',async()=>{
 const {result}=await renderHook(()=>{const session=usePreviewSession(sampleDeck);const animation=useShuffleAnimation(session.state ?? base,!session.state,false,session.complete);return {session,animation};});
 await act(()=>result.current.session.reset());await act(()=>mockAdvance(200));
 await act(()=>{result.current.animation.samplePose(result.current.session.draw);result.current.animation.samplePose(result.current.session.draw);});
 await act(()=>{mockUiQueue.shift()!();mockUiQueue.shift()!();});const frozen=result.current.animation.progress.value;
 await act(()=>mockAdvance(1000));expect(result.current.animation.progress.value).toBe(frozen);
 await act(mockFlush);expect(result.current.session.state!.phase).toBe('lower');expect(result.current.session.state!.phaseOrigin).toEqual(regripPose(frozen));
 await act(()=>{mockAdvance(360);mockFlush();});expect(result.current.session.state!.drawnIds).toHaveLength(1);
});
test('sampled delivery is invalidated if the epoch changes before RN receives it',async()=>{
 const draw=jest.fn(),complete=jest.fn();const {result,rerender}=await renderHook(({state}:{state:SessionState})=>useShuffleAnimation(state,false,false,complete),{initialProps:{state:base}});await act(mockFlushUi);
 await act(()=>result.current.samplePose(draw));await act(()=>mockUiQueue.shift()!());await rerender({state:{...base,epoch:1,phase:'ready'}});await act(mockFlush);expect(draw).not.toHaveBeenCalled();
});
test('sampled RN delivery is invalidated by unmount',async()=>{
 const draw=jest.fn(),complete=jest.fn();const {result,unmount}=await renderHook(()=>useShuffleAnimation(base,false,false,complete));await act(mockFlushUi);
 await act(()=>result.current.samplePose(draw));await act(()=>mockUiQueue.shift()!());await unmount();await act(mockFlush);expect(draw).not.toHaveBeenCalled();
});
