import { loadArtwork } from '../../artwork/__tests__/helpers/nativeArtwork';
import Settings from '../../app/(tabs)/settings';
import { useLayoutEffect } from 'react';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { AppState } from 'react-native';
import { advance, flushRn, resetClock, settle } from '../../features/cards/__tests__/helpers/overlayClock';
import RootLayout from '../../app/_layout';
import DrawPreview from '../../app/(tabs)/index';
import Tabs from '../../app/(tabs)/_layout';
import Catalogue from '../../app/(tabs)/catalogue';
import Details from '../../app/card/[id]';
import { useSession } from '../SessionProvider';

// Keep the real provider, controller, screen and scene; replace native entropy,
// configuration selection and animation scheduling at their external boundaries.
jest.mock('expo-router/build/testing-library/mocks', () => ({}));
jest.mock('../../config/appConfig', () => ({ appConfig: { deckId: 'alternate' } }));
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
const measure = jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default.measureInWindow as jest.Mock;
beforeEach(() => { mockId = 0; resetClock(); AppState.currentState = 'active'; measure.mockImplementation((callback: (x: number, y: number, width: number, height: number) => void) => callback(0, 0, 360, 698)); });
afterEach(() => { AppState.currentState = nativeAppState; measure.mockReset(); });

test('Draw consumes the root session and configured artwork/results without resetting on mount', async () => {
  await renderRouter({ _layout: RootLayout, '(tabs)/_layout': Tabs, '(tabs)/index': DrawPreview, '(tabs)/catalogue': Idle, '(tabs)/settings': Settings, 'card/[id]': Details }, { initialUrl: '/catalogue' });
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
 await renderRouter({_layout:RootLayout,'(tabs)/_layout':Tabs,'(tabs)/index':DrawPreview,'(tabs)/catalogue':Idle,'(tabs)/settings':Settings,'card/[id]':Details},{initialUrl:'/catalogue'});
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
