import { useLayoutEffect } from 'react';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { AppState, StyleSheet } from 'react-native';
import { advance, flushRn, resetClock, settle } from '../../features/cards/__tests__/helpers/overlayClock';
import Root from '../../app/_layout';
import Tabs from '../../app/(tabs)/_layout';
import Draw from '../../app/(tabs)/index';
import Catalogue from '../../app/(tabs)/catalogue';
import Settings from '../../app/(tabs)/settings';
import Details from '../../app/card/[id]';
import { useSession } from '../../session/SessionProvider';
import { useThemeSettings } from '../../themes/ThemeProvider';
import { loadArtwork } from './helpers/nativeArtwork';

jest.mock('expo-router/build/testing-library/mocks', () => ({}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'artwork-session', getRandomValues: (values: Uint32Array) => values.fill(0) }));
let session: ReturnType<typeof useSession>, theme: ReturnType<typeof useThemeSettings>;
function Probe({ draw = false }) {
  const current = useSession(), settings = useThemeSettings();
  useLayoutEffect(() => { session = current; theme = settings; }, [current, settings]);
  return draw ? <Draw/> : <Catalogue/>;
}
const routes = { _layout: Root, '(tabs)/_layout': Tabs, '(tabs)/index': () => <Probe draw/>, '(tabs)/catalogue': Probe, '(tabs)/settings': Settings, 'card/[id]': Details };
const methods = jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default;
const initialAppState = AppState.currentState;
beforeEach(() => { resetClock(); AppState.currentState = 'active'; methods.measureInWindow.mockImplementation((done: (x:number,y:number,w:number,h:number)=>void) => done(0,0,360,800)); });
afterEach(() => { AppState.currentState = initialAppState; methods.measureInWindow.mockReset(); });

test('Catalogue, overlay and direct detail share themed layers while theme changes preserve loaded surfaces and session', async () => {
  await renderRouter(routes, { initialUrl: '/catalogue' }); await settle();
  const state = session.state;
  const image = screen.getByTestId('card-face-0-layer-background');
  expect(image).toHaveStyle({ tintColor: '#1a382b' });
  await loadArtwork(screen.getByTestId('card-face-0'));
  await act(() => theme.setTheme('celestial-midnight')); await settle();
  expect(screen.getByTestId('card-face-0-layer-background')).toBe(image);
  expect(image).toHaveStyle({ tintColor: '#191f2f' });
  await fireEvent.press(screen.getByRole('button', { name: 'Seed' }));
  const overlay = screen.getByTestId('overlay-face-0-layer-background');
  await loadArtwork(screen.getByTestId('overlay-face-0'));
  await fireEvent(screen.getByTestId('overlay-face-surface'), 'layout', { nativeEvent: { layout: { width: 238, height: 357 } } });
  await fireEvent(screen.getByTestId('detail-header', { includeHiddenElements: true }), 'layout', { nativeEvent: { layout: { height: 64 } } });
  await settle(); await advance(420); await flushRn();
  expect(screen.getByText('A small beginning that needs care.')).toBeVisible();
  await act(() => theme.setTheme('solstice-ochre')); await settle();
  expect(screen.getByTestId('overlay-face-0-layer-background')).toBe(overlay);
  expect(overlay).toHaveStyle({ tintColor: '#9e472a' }); expect(session.state).toBe(state);
  await fireEvent.press(screen.getByRole('button', { name: 'Close' })); await settle(); await advance(420); await flushRn();
  await act(() => router.push('/card/0')); await settle();
  expect(screen.getByTestId('detail-face-0-layer-accent')).toHaveStyle({ tintColor: '#d97706' });
  expect(StyleSheet.flatten(screen.getByTestId('detail-face-0-layer-fixed').props.style).tintColor).toBeUndefined();
});

test('draw fronts and backs use the same layer contract and survive theme changes during reveal and results', async () => {
  await renderRouter(routes); await settle();
  await fireEvent(screen.getByTestId('draw-stage'), 'layout', { nativeEvent: { layout: { width: 360, height: 800 } } }); await settle();
  const back = screen.getByTestId('stack-selected-back-layer-background');
  const first = session.state!;
  await act(() => session.draw({ x: 620, y: 330, angle: 0, scale: 1 }, first.sessionId, first.epoch));
  for (let i=0;i<3;i++) { const now=session.state!; await act(() => session.complete(now.sessionId, now.epoch)); }
  const current = session.state!, id = current.selectedId!;
  const face = screen.getByTestId('stack-selected-face-layer-background');
  await act(() => theme.setTheme('celestial-midnight')); await settle();
  expect(screen.getByTestId('stack-selected-back-layer-background')).toBe(back);
  expect(screen.getByTestId('stack-selected-face-layer-background')).toBe(face);
  expect(face).toHaveStyle({ tintColor: '#191f2f' }); expect(session.state).toBe(current);
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm card' }));
  { const now=session.state!; await act(() => session.complete(now.sessionId, now.epoch)); }
  await fireEvent.press(screen.getByRole('button', { name: 'Stop' })); await settle();
  expect(screen.getByTestId(`card-face-${id}-layer-accent`)).toHaveStyle({ tintColor: '#f59e0b' });
});

test('a failed layer opens details using the complete fixed fallback without a fatal reader error', async () => {
  await renderRouter(routes, { initialUrl: '/catalogue' }); await settle();
  await fireEvent.press(screen.getByRole('button', { name: 'Seed' }));
  await fireEvent(screen.getByTestId('overlay-face-0-layer-accent'), 'error');
  expect(screen.queryByTestId('overlay-face-0-layer-background')).toBeNull();
  await loadArtwork(screen.getByTestId('overlay-face-0'));
  await fireEvent(screen.getByTestId('overlay-face-surface'), 'layout', { nativeEvent: { layout: { width: 238, height: 357 } } });
  await fireEvent(screen.getByTestId('detail-header', { includeHiddenElements: true }), 'layout', { nativeEvent: { layout: { height: 64 } } });
  await settle(); await advance(420); await flushRn();
  expect(screen.getByText('A small beginning that needs care.')).toBeVisible();
  expect(screen.queryByText('Card artwork could not be loaded.')).toBeNull();
  expect(screen.getByTestId('overlay-face-0-fallback')).toBeVisible();
});

test('terminal back failure exposes localized recovery and retries without replacing the drawing surface or session', async () => {
  await renderRouter(routes); await settle();
  await fireEvent(screen.getByTestId('draw-stage'), 'layout', { nativeEvent: { layout: { width: 360, height: 800 } } }); await settle();
  const state = session.state, surface = screen.getByTestId('stack-selected-back');
  await fireEvent(screen.getByTestId('stack-selected-back-layer-background'), 'error');
  await fireEvent(screen.getByTestId('stack-selected-back-fallback'), 'error');
  expect(screen.getByRole('alert')).toHaveTextContent('Card artwork could not be loaded.');
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' })); await settle();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByTestId('stack-selected-back-layer-background')).toBeTruthy();
  expect(screen.getByTestId('stack-selected-back')).toBe(surface);
  expect(session.state).toBe(state);
});
