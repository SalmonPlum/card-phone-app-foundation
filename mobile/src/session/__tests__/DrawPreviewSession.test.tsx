import Info from '../../app/(tabs)/info';
import { loadArtwork } from '../../artwork/__tests__/helpers/nativeArtwork';
import Settings from '../../app/(tabs)/settings';
import { useLayoutEffect } from 'react';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import { advance, flushRn, resetClock, settle } from '../../features/cards/__tests__/helpers/overlayClock';
import RootLayout from '../../app/_layout';
import DrawPreview from '../../app/(tabs)/index';
import Tabs from '../../app/(tabs)/_layout';
import Catalogue from '../../app/(tabs)/catalogue';
import Details from '../../app/card/[id]';
import {localNotifications} from '../../platform/localNotifications';
import { useSession } from '../SessionProvider';

// Keep the real provider, controller, screen and scene; replace native entropy,
// configuration selection and animation scheduling at their external boundaries.
jest.mock('expo-router/build/testing-library/mocks', () => ({}));
jest.mock('../../config/appConfig', () => ({ appConfig: { deckId: 'alternate' } }));
// Capture the native completion boundary while retaining the real animation hook.
let mockPhaseComplete:(sessionId:string,epoch:number)=>void;
jest.mock('../../features/draw/useShuffleAnimation',()=>{
  const actual=jest.requireActual('../../features/draw/useShuffleAnimation') as typeof import('../../features/draw/useShuffleAnimation');
  return {...actual,useShuffleAnimation:(...args:Parameters<typeof actual.useShuffleAnimation>)=>{
    mockPhaseComplete=args[3];return actual.useShuffleAnimation(...args);
  }};
});
jest.mock('@react-native-community/datetimepicker',()=>{
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {View}=require('react-native');return {__esModule:true,default:(props:object)=><View {...props}/>};
});
const mockImpact=jest.fn(async()=>{});
jest.mock('expo-haptics',()=>({impactAsync:()=>mockImpact(),ImpactFeedbackStyle:{Light:'light',Heavy:'heavy'}}));
let mockId = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `draw-owner-${++mockId}`,
  getRandomValues: (values: Uint32Array) => { values.fill(0); return values; },
}));

let current: ReturnType<typeof useSession>;
function Idle() {
  const session = useSession();
  useLayoutEffect(() => { current = session; }, [session]);
  return <Catalogue />;
}
const nativeAppState = AppState.currentState;
const nativeSubscribe = jest.mocked(AppState.addEventListener).getMockImplementation()!;
const measure = jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default.measureInWindow as jest.Mock;
beforeEach(() => { jest.mocked(AppState.addEventListener).mockImplementation(nativeSubscribe); mockImpact.mockClear(); mockId = 0; resetClock(); AppState.currentState = 'active'; measure.mockImplementation((callback: (x: number, y: number, width: number, height: number) => void) => callback(0, 0, 360, 698)); });
afterEach(() => { AppState.currentState = nativeAppState; measure.mockReset(); });

test('Draw consumes the root session and configured artwork/results without resetting on mount', async () => {
  await renderRouter({ _layout: RootLayout, '(tabs)/info': Info, '(tabs)/_layout': Tabs, '(tabs)/index': DrawPreview, '(tabs)/catalogue': Idle, '(tabs)/settings': Settings, 'card/[id]': Details }, { initialUrl: '/catalogue' });
  expect(current.state).toMatchObject({ sessionId: 'draw-owner-1', deckId: 'alternate' });
  expect(screen.getByRole('button', { name: 'Wave' })).toBeVisible();
  const first = current.state!;
  await act(() => current.draw({ x: 620, y: 330, angle: .12, scale: 1 }, first.sessionId, first.epoch));
  for (let i = 0; i < 3; i++) {
    const state = current.state!;
    await act(() => current.complete(state.sessionId, state.epoch));
  }
  expect(current.state).toMatchObject({ phase: 'reveal', drawnIds: [7] });
  await act(() => router.navigate('/'));
  expect(screen.getByText('Wave')).toBeVisible();
  expect(current.state!.sessionId).toBe(first.sessionId);
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm card' }));
  await settle(); await advance(900); await settle();
  await fireEvent.press(screen.getByRole('button', { name: 'Stop' }));
  expect(screen.getByRole('button', { name: 'Wave' })).toBeVisible();
  expect(screen.queryByText('Movement, change, and your own rhythm.')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Wave' }));
  await loadArtwork(screen.getByTestId('overlay-face-7'));
  await fireEvent(screen.getByTestId('overlay-face-surface'), 'layout', { nativeEvent: { layout: { width: 238, height: 358 } } });
  await fireEvent(screen.getByTestId('detail-header',{includeHiddenElements:true}), 'layout', {nativeEvent:{layout:{height:64}}});
  await settle(); await advance(420); await flushRn();
  expect(screen.getByText('Movement, change, and your own rhythm.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  await settle(); await advance(420); await flushRn();
  expect(current.state).toMatchObject({ sessionId: first.sessionId, phase: 'results', drawnIds: [7] });
  await fireEvent.press(screen.getByRole('button', { name: 'New session' }));
  expect(current.state).toMatchObject({ sessionId: 'draw-owner-2', phase: 'regrip', drawnIds: [] });
});

test('Settings manual reveal survives tab and language changes; changing the preference affects only later draws',async()=>{
 await renderRouter({_layout:RootLayout,'(tabs)/info': Info, '(tabs)/_layout':Tabs,'(tabs)/index':DrawPreview,'(tabs)/catalogue':Idle,'(tabs)/settings':Settings,'card/[id]':Details},{initialUrl:'/catalogue'});
 await act(()=>router.navigate('/settings'));
 await fireEvent.press(screen.getByRole('radio',{name:'Tap to flip'}));
 await act(()=>router.navigate('/'));
 const first=current.state!;
 await act(()=>current.draw({x:620,y:330,angle:0,scale:1},first.sessionId,first.epoch));
 for(let i=0;i<2;i++){const state=current.state!;await act(()=>current.complete(state.sessionId,state.epoch));}
 expect(current.state!.phase).toBe('awaitingReveal');
 expect(screen.getByRole('button',{name:'Flip card'})).toBeVisible();expect(screen.queryByText('Wave')).toBeNull();
 const waiting=current.state!;
 await act(()=>router.navigate('/settings'));
 await fireEvent.press(screen.getByRole('radio',{name:'Automatic'}));
 await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));
 await act(()=>router.navigate('/'));
 expect(current.state).toBe(waiting);
 await fireEvent.press(screen.getByRole('button',{name:'Otočit kartu'}));expect(current.state!.phase).toBe('flip');
 await fireEvent.press(screen.getByRole('button',{name:'Potvrdit kartu'}));expect(current.state!.phase).toBe('flip');
 const flip=current.state!;await act(()=>current.complete(flip.sessionId,flip.epoch));
 expect(current.state!.phase).toBe('reveal');
 expect(screen.getByText('Vlna')).toBeVisible();
 await fireEvent.press(screen.getByRole('button',{name:'Potvrdit kartu'}));expect(current.state!.phase).toBe('resume');
 const resume=current.state!;await act(()=>current.complete(resume.sessionId,resume.epoch));
 const next=current.state!;await act(()=>current.draw({x:620,y:330,angle:0,scale:1},next.sessionId,next.epoch));
 for(let i=0;i<2;i++){const state=current.state!;await act(()=>current.complete(state.sessionId,state.epoch));}
 expect(current.state!.phase).toBe('flip');
});


test.each([['background','flip'],['tab','flip'],['background','strip'],['tab','strip']] as const)('deferred %s %s completion advances without delayed haptics',async(kind,phase)=>{
  const listeners=new Set<(state:AppStateStatus)=>void>();
  const subscribe=jest.spyOn(AppState,'addEventListener').mockImplementation((_event,listener)=>{
    listeners.add(listener);return {remove:()=>{listeners.delete(listener);}};
  });
  const change=async(state:AppStateStatus)=>act(()=>{AppState.currentState=state;listeners.forEach(listener=>listener(state));});
  try {
    await renderRouter({_layout:RootLayout,'(tabs)/info': Info, '(tabs)/_layout':Tabs,'(tabs)/index':DrawPreview,'(tabs)/catalogue':Idle,'(tabs)/settings':Settings,'card/[id]':Details},{initialUrl:'/catalogue'});
    await act(()=>router.navigate('/'));
    const initial=current.state!;
    if(phase==='flip') await act(()=>current.draw({x:620,y:330,angle:0,scale:1},initial.sessionId,initial.epoch));
    for(let i=0;i<2;i++){const state=current.state!;await act(()=>current.complete(state.sessionId,state.epoch));}
    const pending=current.state!;expect(pending.phase).toBe(phase);
    const callback=mockPhaseComplete;
    if(kind==='background')await change('background');else await act(()=>router.navigate('/catalogue'));
    await act(()=>callback(pending.sessionId,pending.epoch));
    expect(current.state!.phase).toBe(phase);
    expect(mockImpact).not.toHaveBeenCalled();
    if(kind==='background')await change('active');else await act(()=>router.navigate('/'));
    expect(current.state!.phase).toBe(phase==='flip'?'reveal':'contact');
    expect(mockImpact).not.toHaveBeenCalled();
    // Suppression applies to the deferred callback only, not later cards.
    await act(()=>current.reset());
    let state=current.state!;await act(()=>current.draw({x:620,y:330,angle:0,scale:1},state.sessionId,state.epoch));
    for(let i=0;i<3;i++){state=current.state!;await act(()=>current.complete(state.sessionId,state.epoch));}
    expect(current.state!.phase).toBe('reveal');
    expect(mockImpact).toHaveBeenCalledTimes(1);
  } finally {subscribe.mockRestore();}
});


test.each(['flip','reveal'] as const)('reminder tap opens Draw and preserves an existing %s session',async phase=>{
  let receive!:(response:{key:string})=>void;
  jest.mocked(localNotifications.subscribeResponses).mockImplementation(listener=>{receive=listener;return ()=>{};});
  try {
    await renderRouter({_layout:RootLayout,'(tabs)/info': Info, '(tabs)/_layout':Tabs,'(tabs)/index':DrawPreview,'(tabs)/catalogue':Idle,'(tabs)/settings':Settings,'card/[id]':Details},{initialUrl:'/catalogue'});
    const first=current.state!;await act(()=>current.draw({x:620,y:330,angle:0,scale:1},first.sessionId,first.epoch));
    for(let i=0;i<(phase==='flip'?2:3);i++){const s=current.state!;await act(()=>current.complete(s.sessionId,s.epoch));}
    const existing=current.state!;expect(existing.phase).toBe(phase);
    await act(()=>receive({key:'daily:tap'}));
    expect(screen.getByTestId('draw-screen')).toBeVisible();expect(current.state).toBe(existing);
    expect(localNotifications.clearResponse).toHaveBeenCalledWith('daily:tap');
  } finally {jest.mocked(localNotifications.subscribeResponses).mockImplementation(()=>()=>{});}
});

test('a cold reminder tap waits for root readiness and opens Draw without a second session',async()=>{
  jest.mocked(localNotifications.getLastResponse).mockResolvedValue({key:'daily:cold'});
  try {
    await renderRouter({_layout:RootLayout,'(tabs)/info': Info, '(tabs)/_layout':Tabs,'(tabs)/index':DrawPreview,'(tabs)/catalogue':Idle,'(tabs)/settings':Settings,'card/[id]':Details},{initialUrl:'/catalogue'});
    expect(screen.getByTestId('draw-screen')).toBeVisible();expect(current.state!.sessionId).toBe('draw-owner-1');expect(mockId).toBe(1);
  } finally {jest.mocked(localNotifications.getLastResponse).mockResolvedValue(null);}
});


test('a reminder tap closes a mounted Settings time picker before opening Draw',async()=>{
  let receive!:(response:{key:string})=>void;
  jest.mocked(localNotifications.subscribeResponses).mockImplementation(listener=>{receive=listener;return ()=>{};});
  try {
    await renderRouter({_layout:RootLayout,'(tabs)/info': Info, '(tabs)/_layout':Tabs,'(tabs)/index':DrawPreview,'(tabs)/catalogue':Idle,'(tabs)/settings':Settings,'card/[id]':Details},{initialUrl:'/catalogue'});
    await act(()=>router.navigate('/settings'));
    await fireEvent.press(screen.getByRole('button',{name:'Reminder time: 09:00'}));
    expect(screen.getByTestId('reminder-time-picker')).toBeVisible();
    const existing=current.state;
    await act(()=>receive({key:'daily:picker'}));
    expect(screen.getByTestId('draw-screen')).toBeVisible();expect(current.state).toBe(existing);
    expect(screen.queryByTestId('reminder-time-picker',{includeHiddenElements:true})).toBeNull();
  } finally {jest.mocked(localNotifications.subscribeResponses).mockImplementation(()=>()=>{});}
});
