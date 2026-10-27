import { useLayoutEffect } from 'react';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { router, Tabs as RouterTabs } from 'expo-router';
import { AppState, BackHandler, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import * as Localization from 'expo-localization';
import { advance, flushRn, flushUi, resetClock, settle, runningClocks } from '../../features/cards/__tests__/helpers/overlayClock';
import RootLayout from '../../app/_layout';
import Draw from '../../app/(tabs)/index';
import Tabs from '../../app/(tabs)/_layout';
import Details from '../../app/card/[id]';
import LegacyDraw from '../../app/draw-preview';
import Catalogue from '../../app/(tabs)/catalogue';
import { useSession } from '../../session/SessionProvider';
import { BottomDock } from '../BottomDock';
import { TabInteractionProvider } from '../TabInteractionContext';

jest.mock('expo-router/build/testing-library/mocks', () => ({}));
let mockId = 0, mockEntropyError = false;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `tab-session-${++mockId}`,
  getRandomValues: (values: Uint32Array) => { if (mockEntropyError) throw new Error('Unavailable'); values.fill(0); return values; },
}));
let current: ReturnType<typeof useSession>;
function ObservedDraw() {
  const session = useSession();
  useLayoutEffect(() => { current = session; }, [session]);
  return <Draw />;
}
const routes = { _layout: RootLayout, '(tabs)/_layout': Tabs, '(tabs)/index': ObservedDraw, '(tabs)/catalogue': Catalogue, 'card/[id]': Details, 'draw-preview': LegacyDraw };
const nativeAppState = AppState.currentState;
const nativeAppSubscription = (AppState.addEventListener as jest.Mock).getMockImplementation();
const nativeLocales = Localization.getLocales();
beforeEach(() => { mockId = 0; mockEntropyError = false; resetClock(); AppState.currentState = 'active'; (AppState.addEventListener as jest.Mock).mockImplementation(nativeAppSubscription); (Localization.getLocales as jest.Mock).mockReturnValue(nativeLocales); });
afterEach(() => { AppState.currentState = nativeAppState; });
async function go(name: 'Draw' | 'Catalogue') { await fireEvent.press(screen.getByRole('tab', { name })); await settle(); }
async function tick(ms: number) { await advance(ms); await settle(); }

// These use the real root provider, router, screens, reducer and phase clock.
// Only secure native entropy and the deferred UI/RN schedulers are controlled.
test('tab round trips retain committed cards, results, screen instances and root route count', async () => {
  await renderRouter(routes); await settle();
  const first = current.state!;
  await act(() => current.draw({ x: 620, y: 330, angle: .12, scale: 1 }, first.sessionId, first.epoch));
  for (let i = 0; i < 3; i++) { const s = current.state!; await act(() => current.complete(s.sessionId, s.epoch)); }
  expect(current.state).toMatchObject({ phase: 'reveal', drawnIds: [7] });
  const reveal = current.state;
  await go('Catalogue');
  const grid = screen.getByTestId('card-grid');
  await fireEvent.scroll(grid, { nativeEvent: { contentOffset: { x: 0, y: 160 } } });
  await go('Draw');
  expect(current.state).toBe(reveal);
  expect(screen.getByText('Spring')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm card' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Stop' }));
  const result = current.state;
  await go('Catalogue'); await go('Draw'); await go('Draw'); await go('Draw');
  expect(current.state).toBe(result);
  expect(screen.getByText('Renewal and a return to what sustains you.')).toBeVisible();
  expect(router.canGoBack()).toBe(false);
  await go('Catalogue'); expect(screen.getByTestId('card-grid')).toBe(grid);
  await act(() => router.back());
  expect(screen).toHavePathname('/');
  expect(current.state).toBe(result);
});

test.each(['strip', 'flip'] as const)('switching during %s preserves UI progress through background and resumes exactly once', async phase => {
  const listeners = new Set<(status: AppStateStatus) => void>();
  const subscription = jest.spyOn(AppState, 'addEventListener').mockImplementation((type, handler) => {
    const listener = handler as (status: AppStateStatus) => void;
    if (type === 'change') listeners.add(listener);
    return { remove: () => listeners.delete(listener) } as NativeEventSubscription;
  });
  try {
    await renderRouter(routes); await settle();
    await tick(624); await tick(144);
    expect(current.state!.phase).toBe('strip');
    if (phase === 'flip') {
      const s = current.state!;
      await act(() => current.draw({ x: 620, y: 330, angle: 0, scale: 1 }, s.sessionId, s.epoch));
      await tick(496); await tick(96); await tick(640);
      expect(current.state!.phase).toBe('flip');
    }
    await tick(200);
    const paused = current.state!;
    const progress = runningClocks()[0].value;
    expect(progress).toBeGreaterThan(0); expect(progress).toBeLessThan(1);
    await go('Catalogue');
    expect(runningClocks()).toHaveLength(0);
    await act(() => { for (const listener of listeners) listener('background'); });
    await tick(10000);
    await act(() => { for (const listener of listeners) listener('active'); });
    await tick(10000);
    expect(current.state).toBe(paused);
    await go('Draw');
    expect(runningClocks()[0].value).toBeCloseTo(progress);
    await tick((phase === 'strip' ? 496 : 620) - 201);
    expect(current.state).toBe(paused);
    await tick(1.001);
    expect(current.state!.epoch).toBe(paused.epoch + 1);
    expect(current.state!.phase).toBe(phase === 'strip' ? 'contact' : 'reveal');
    expect(current.state!.drawnIds).toHaveLength(phase === 'strip' ? 0 : 1);
  } finally { subscription.mockRestore(); }
});

test.each([false, true])('a completion queued at blur waits for return and rejects reset tokens (reset=%s)', async reset => {
  await renderRouter(routes); await settle();
  await advance(624); // Queue completion on RN without delivering it.
  const old = current.state!;
  await fireEvent.press(screen.getByRole('tab', { name: 'Catalogue' }));
  await flushUi(); await flushRn();
  expect(current.state).toBe(old);
  if (!reset) {
    await go('Draw');
    expect(current.state).toMatchObject({ sessionId: old.sessionId, epoch: old.epoch + 1, phase: 'ready' });
    return;
  }
  await act(() => current.reset());
  const fresh = current.state!;
  expect(fresh.sessionId).not.toBe(old.sessionId);
  await go('Draw');
  await act(() => current.complete(old.sessionId, old.epoch));
  expect(current.state).toBe(fresh);
  expect(current.state!.phase).toBe('regrip');
});

test('entropy failure on Draw still permits browsing offline catalogue and returning to retry', async () => {
  mockEntropyError = true;
  await renderRouter(routes);
  expect(screen.getByText('Secure randomness is unavailable. Try again.')).toBeVisible();
  await go('Catalogue'); expect(screen.getByRole('button', { name: 'Seed' })).toBeVisible();
  await go('Draw'); expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  mockEntropyError = false;
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(current.state!.remainingIds).toHaveLength(8);
});

test('Czech tab labels and Draw content follow the app locale', async () => {
  const locale = Localization.getLocales()[0];
  const locales = jest.spyOn(Localization, 'useLocales').mockReturnValue([{ ...locale, languageTag: 'cs-CZ', languageCode: 'cs' }]);
  const getLocales = jest.spyOn(Localization, 'getLocales').mockReturnValue([{ ...locale, languageTag: 'cs-CZ', languageCode: 'cs' }]);
  try {
    await renderRouter(routes);
    expect(screen.getByRole('tab', { name: 'Tahání' })).toBeVisible();
    await fireEvent.press(screen.getByRole('tab', { name: 'Katalog' }));
    expect(screen.getByRole('header', { name: 'Všechny karty' })).toBeVisible();
    await fireEvent.press(screen.getByRole('tab', { name: 'Tahání' }));
    expect(screen.getByText('Zbývající karty: 8')).toBeVisible();
  } finally { locales.mockRestore(); getLocales.mockRestore(); }
});

test('root Draw registers no intercepting hardware Back handler and retains session', async () => {
  const back = jest.spyOn(BackHandler, 'addEventListener');
  await renderRouter(routes);
  expect(router.canGoBack()).toBe(false);
  const first = current.state;
  const handlers = back.mock.calls.filter(([event]) => event === 'hardwareBackPress').map(([, handler]) => handler);
  await act(() => { for (const handler of [...handlers].reverse()) expect(handler({ type: 'hardwareBackPress', timeStamp: 0 })).not.toBe(true); });
  expect(current.state).toBe(first);
  back.mockRestore();
});

test('legacy draw URL redirects to the single canonical Draw root without a phantom Home', async () => {
  await renderRouter(routes, { initialUrl: '/draw-preview' });
  expect(screen).toHavePathname('/');
  expect(screen.getByRole('tab', { name: 'Draw' })).toBeVisible();
  expect(router.canGoBack()).toBe(false);
  const initial = current.state;
  await go('Draw'); expect(current.state).toBe(initial);
});

test('dock forwards press and long-press events and respects router prevention before navigating', async () => {
  let prevent = true, presses = 0, holds = 0;
  function EventTabs() {
    return <TabInteractionProvider><RouterTabs backBehavior="initialRoute" tabBar={props => <BottomDock {...props} />} screenOptions={{ headerShown: false, animation: 'none', freezeOnBlur: false }}>
      <RouterTabs.Screen name="index" />
      <RouterTabs.Screen name="catalogue" listeners={{ tabPress: event => { presses++; if (prevent) event.preventDefault(); }, tabLongPress: () => { holds++; } }} />
    </RouterTabs></TabInteractionProvider>;
  }
  await renderRouter({ ...routes, '(tabs)/_layout': EventTabs });
  await fireEvent.press(screen.getByRole('tab', { name: 'Catalogue' }));
  expect(presses).toBe(1); expect(screen).toHavePathname('/');
  await fireEvent(screen.getByRole('tab', { name: 'Catalogue' }), 'longPress');
  expect(holds).toBe(1); expect(screen).toHavePathname('/');
  prevent = false;
  await go('Catalogue'); expect(screen).toHavePathname('/catalogue');
  expect(screen.getByRole('tab', { name: 'Catalogue' }).props.accessibilityState.selected).toBe(true);
});

test.each(['strip', 'flip'] as const)('warm legacy link reuses the existing tabs and resumes the same %s progress without Back depth', async phase => {
  await renderRouter(routes); await settle();
  await tick(624); await tick(144);
  expect(current.state!.phase).toBe('strip');
  if (phase === 'flip') {
    const state = current.state!;
    await act(() => current.draw({ x: 620, y: 330, angle: 0, scale: 1 }, state.sessionId, state.epoch));
    await tick(496); await tick(96); await tick(640);
    expect(current.state!.phase).toBe('flip');
  }
  await tick(200);
  const paused = current.state!;
  const progress = runningClocks()[0].value;
  await go('Catalogue');
  const grid = screen.getByTestId('card-grid');
  await fireEvent.scroll(grid, { nativeEvent: { contentOffset: { x: 0, y: 160 } } });
  await tick(10000);
  expect(current.state).toBe(paused);
  expect(runningClocks()).toHaveLength(0);
  await act(() => router.navigate('/draw-preview'));
  await settle();
  expect(screen).toHavePathname('/');
  expect(current.state).toBe(paused);
  expect(router.canGoBack()).toBe(false);
  expect(runningClocks()).toHaveLength(1);
  expect(runningClocks()[0].value).toBeCloseTo(progress);
  await tick((phase === 'strip' ? 496 : 620) - 201);
  expect(current.state).toBe(paused);
  await tick(1.001);
  expect(current.state).toMatchObject({ sessionId: paused.sessionId, epoch: paused.epoch + 1, phase: phase === 'strip' ? 'contact' : 'reveal' });
  expect(current.state!.drawnIds).toHaveLength(phase === 'strip' ? 0 : 1);
  const resumed = current.state;
  await go('Catalogue');
  expect(screen.getByTestId('card-grid')).toBe(grid);
  await act(() => router.back()); await settle();
  expect(screen).toHavePathname('/');
  expect(router.canGoBack()).toBe(false);
  expect(current.state).toBe(resumed);
});
