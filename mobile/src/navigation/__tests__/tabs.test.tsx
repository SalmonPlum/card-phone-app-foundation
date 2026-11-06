import Settings from '../../app/(tabs)/settings';
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
const routes = { _layout: RootLayout, '(tabs)/_layout': Tabs, '(tabs)/index': ObservedDraw, '(tabs)/catalogue': Catalogue, '(tabs)/settings': Settings, 'card/[id]': Details, 'draw-preview': LegacyDraw };
const nativeAppState = AppState.currentState;
const nativeAppSubscription = (AppState.addEventListener as jest.Mock).getMockImplementation();
const nativeLocales = Localization.getLocales();
beforeEach(() => { mockId = 0; mockEntropyError = false; resetClock(); AppState.currentState = 'active'; (AppState.addEventListener as jest.Mock).mockImplementation(nativeAppSubscription); (Localization.getLocales as jest.Mock).mockReturnValue(nativeLocales); });
afterEach(() => { AppState.currentState = nativeAppState; });
async function go(name: 'Draw' | 'Catalogue') { await fireEvent.press(screen.getByRole('tab', { name })); await settle(); }
async function tick(ms: number) { await advance(ms); await settle(); }

// These use the real root provider, router, screens, reducer and phase clock.
// Only secure native entropy and the deferred UI/RN schedulers are controlled.
test('only the rounded bottom menu paints a solid surface',async()=>{
  await renderRouter(routes);await settle();
  expect(screen.getByTestId('bottom-dock')).toHaveStyle({backgroundColor:'transparent'});
  expect(screen.getByTestId('bottom-dock-menu')).toHaveStyle({backgroundColor:'#ffffff',borderRadius:36});
  await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));await settle();
  await fireEvent.press(screen.getByRole('radio',{name:'Solstice Ochre'}));await settle();
  expect(screen.getByTestId('bottom-dock')).toHaveStyle({backgroundColor:'transparent'});
  expect(screen.getByTestId('bottom-dock-menu')).toHaveStyle({backgroundColor:'#ffffff',borderRadius:36});
});

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
  { const s = current.state!; await act(() => current.complete(s.sessionId, s.epoch)); }
  await fireEvent.press(screen.getByRole('button', { name: 'Stop' }));
  const result = current.state;
  await go('Catalogue'); await go('Draw'); await go('Draw'); await go('Draw');
  expect(current.state).toBe(result);
  expect(screen.getByRole('button', { name: 'Spring' })).toBeVisible();
  expect(screen.queryByText('Renewal and a return to what sustains you.')).toBeNull();
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
      await tick(496); await tick(96); await tick(900);
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

test('English defaults on a Czech phone until Settings explicitly selects Czech', async () => {
  const locale = Localization.getLocales()[0];
  const locales = jest.spyOn(Localization, 'useLocales').mockReturnValue([{ ...locale, languageTag: 'cs-CZ', languageCode: 'cs' }]);
  const getLocales = jest.spyOn(Localization, 'getLocales').mockReturnValue([{ ...locale, languageTag: 'cs-CZ', languageCode: 'cs' }]);
  try {
    await renderRouter(routes);
    expect(screen.getByRole('tab', { name: 'Draw' })).toBeVisible();
    await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));
    await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));
    expect(screen.getByRole('tab', { name: 'Tahání' })).toBeVisible();
    await fireEvent.press(screen.getByRole('tab', { name: 'Katalog' }));
    expect(screen.queryByRole('header', { name: 'Všechny karty' })).toBeNull();
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
    await tick(496); await tick(96); await tick(900);
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

test('switching tabs midway through confirmation exit pauses it and resumes the same handoff once',async()=>{
  await renderRouter(routes); await settle();
  const first=current.state!;
  await act(()=>current.draw({x:620,y:330,angle:0,scale:1},first.sessionId,first.epoch));
  for(let i=0;i<3;i++){const s=current.state!;await act(()=>current.complete(s.sessionId,s.epoch));}
  await fireEvent.press(screen.getByRole('button',{name:'Confirm card'})); await settle();
  await tick(225);
  const exiting=current.state!;
  expect(exiting.phase).toBe('resume');
  expect(runningClocks()[0].value).toBeCloseTo(.25);
  await go('Catalogue');
  expect(runningClocks()).toHaveLength(0);
  await tick(10000);
  expect(current.state).toBe(exiting);
  await go('Draw');
  expect(runningClocks()[0].value).toBeCloseTo(.25);
  await tick(674);
  expect(current.state).toBe(exiting);
  await tick(1);
  expect(current.state).toMatchObject({sessionId:exiting.sessionId,phase:'return',epoch:exiting.epoch+1,drawnIds:exiting.drawnIds});
});

test('Settings changes interface and deck language without resetting the draw session',async()=>{
  await renderRouter(routes);await settle();
  const original=current.state;
  await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));
  expect(screen.getByRole('header',{name:'Language'})).toBeVisible();
  await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));
  expect(screen.queryByRole('header',{name:'Nastavení'})).toBeNull();
  expect(screen.getByRole('radio',{name:'Čeština'}).props.accessibilityState).toEqual({checked:true});
  expect(current.state).toBe(original);
  await fireEvent.press(screen.getByRole('tab',{name:'Katalog'}));
  expect(screen.getByRole('button',{name:'Semínko'})).toBeVisible();
  await fireEvent.press(screen.getByRole('tab',{name:'Tahání'}));
  expect(screen.getByText('Zbývající karty: 8')).toBeVisible();
  expect(current.state).toBe(original);
  await fireEvent.press(screen.getByRole('tab',{name:'Nastavení'}));
  await act(()=>router.back());await settle();
  expect(screen).toHavePathname('/');
  await act(()=>router.push('/card/0'));await settle();
  expect(screen.getByRole('header',{name:'Semínko'})).toBeVisible();
  expect(screen.getByText('Malý začátek, který potřebuje péči.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button',{name:'Zpět'}));await settle();
  expect(current.state).toBe(original);
});


test('changing language from Settings pauses and resumes the same draw progress',async()=>{
  await renderRouter(routes);await settle();await tick(312);
  const first=current.state;
  expect(runningClocks()[0].value).toBeCloseTo(.5);
  await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));await settle();
  await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));await settle();
  expect(runningClocks()).toHaveLength(0);
  await tick(10000);expect(current.state).toBe(first);
  await fireEvent.press(screen.getByRole('tab',{name:'Tahání'}));await settle();
  expect(runningClocks()[0].value).toBeCloseTo(.5);
  await tick(311);expect(current.state).toBe(first);
  await tick(1);
  expect(current.state).toMatchObject({sessionId:first!.sessionId,phase:'ready',epoch:first!.epoch+1,drawnIds:[]});
});

test('resource theme changes retain a revealed session and image hosts across tabs, results and direct details',async()=>{
  await renderRouter(routes);await settle();
  const first=current.state!;
  await act(()=>current.draw({x:620,y:330,angle:0,scale:1},first.sessionId,first.epoch));
  for(let i=0;i<3;i++){const s=current.state!;await act(()=>current.complete(s.sessionId,s.epoch));}
  const revealed=current.state!;
  expect(revealed.phase).toBe('reveal');
  const stage=screen.getByTestId('draw-stage');
  const cover=screen.getByTestId('draw-foreground-dim',{includeHiddenElements:true});
  await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));await settle();
  await fireEvent.press(screen.getByRole('radio',{name:'Celestial Midnight'}));await settle();
  expect(screen.getByTestId('settings-screen')).toHaveStyle({backgroundColor:'#0d1322'});
  expect(screen.getByTestId('bottom-dock')).toHaveStyle({backgroundColor:'transparent'});
  expect(screen.getByTestId('bottom-dock-menu')).toHaveStyle({backgroundColor:'#191f2f',borderRadius:36});
  expect(current.state).toBe(revealed);
  await go('Draw');
  expect(screen.getByTestId('draw-stage')).toBe(stage);
  expect(screen.getByTestId('draw-foreground-dim',{includeHiddenElements:true})).toBe(cover);
  expect(cover).toHaveStyle({backgroundColor:'#0d1322'});
  expect(screen.getByTestId('draw-reveal-header')).toHaveStyle({backgroundColor:'#0d1322'});
  expect(screen.getByRole('header',{name:'Spring'})).toHaveStyle({fontFamily:'Theme_NotoSerif_400',fontSize:32});
  expect(current.state).toBe(revealed);
  await go('Catalogue');
  const grid=screen.getByTestId('card-grid');
  const seed=screen.getByTestId('card-face-0');
  const source=seed.props.source;
  expect(screen.getByTestId('catalogue-host')).toHaveStyle({backgroundColor:'#0d1322'});
  await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));await settle();
  await fireEvent.press(screen.getByRole('radio',{name:'Solstice Ochre'}));await settle();
  await go('Catalogue');
  expect(screen.getByTestId('card-grid')).toBe(grid);
  expect(screen.getByTestId('card-face-0')).toBe(seed);
  expect(seed.props.source).toBe(source);
  expect(screen.getByText('Seed')).toHaveStyle({fontFamily:'Theme_Literata_500',fontSize:20});
  expect(screen.getByTestId('catalogue-host')).toHaveStyle({backgroundColor:'#fff8f0'});
  await go('Draw');
  await fireEvent.press(screen.getByRole('button',{name:'Confirm card'}));
  {const s=current.state!;await act(()=>current.complete(s.sessionId,s.epoch));}
  await fireEvent.press(screen.getByRole('button',{name:'Stop'}));
  expect(screen.getByTestId('results-host')).toHaveStyle({backgroundColor:'#fff8f0'});
  expect(current.state!.sessionId).toBe(revealed.sessionId);
  await act(()=>router.push('/card/0'));await settle();
  expect(screen.getByTestId('direct-detail-host')).toHaveStyle({backgroundColor:'#fff8f0'});
  expect(screen.getByRole('header',{name:'Seed'})).toHaveStyle({fontFamily:'Theme_Literata_600',fontSize:38});
});

test.each(['strip','flip'] as const)('theme selection during paused %s retains the native clock and resumes once',async phase=>{
  await renderRouter(routes);await settle();
  await tick(624);await tick(144);
  expect(current.state!.phase).toBe('strip');
  if(phase==='flip'){
    const s=current.state!;
    await act(()=>current.draw({x:620,y:330,angle:0,scale:1},s.sessionId,s.epoch));
    await tick(496);await tick(96);await tick(900);
    expect(current.state!.phase).toBe('flip');
  }
  await tick(200);
  const paused=current.state!, progress=runningClocks()[0].value;
  await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));await settle();
  expect(runningClocks()).toHaveLength(0);
  await fireEvent.press(screen.getByRole('radio',{name:'Celestial Midnight'}));await settle();
  expect(current.state).toBe(paused);
  expect(runningClocks()).toHaveLength(0);
  await go('Draw');
  expect(runningClocks()[0].value).toBeCloseTo(progress);
  await tick((phase==='strip'?496:620)-201);
  expect(current.state).toBe(paused);
  await tick(1.001);
  expect(current.state!.epoch).toBe(paused.epoch+1);
  expect(current.state!.phase).toBe(phase==='strip'?'contact':'reveal');
});

test('tab screens omit duplicate visible page titles while retaining navigation, sections and the draw action',async()=>{
  await renderRouter(routes);await settle();
  expect(screen.getAllByText('Draw')).toHaveLength(1);
  expect(screen.queryByText('Draw a card')).toBeNull();
  expect(screen.getByRole('button',{name:'Draw a card'})).toBeVisible();
  await go('Catalogue');
  expect(screen.queryByText('All cards')).toBeNull();
  expect(screen.getByRole('button',{name:'Seed'})).toBeVisible();
  await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));await settle();
  expect(screen.getAllByText('Settings')).toHaveLength(1);
  expect(screen.queryByRole('header',{name:'Settings'})).toBeNull();
  expect(screen.getByRole('header',{name:'Language'})).toBeVisible();
  await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));await settle();
  expect(screen.getAllByText('Nastavení')).toHaveLength(1);
  expect(screen.queryByRole('header',{name:'Nastavení'})).toBeNull();
  expect(screen.getByRole('header',{name:'Jazyk'})).toBeVisible();
  await fireEvent.press(screen.getByRole('tab',{name:'Katalog'}));await settle();
  expect(screen.queryByText('Všechny karty')).toBeNull();
  expect(screen.getByRole('button',{name:'Semínko'})).toBeVisible();
  await fireEvent.press(screen.getByRole('tab',{name:'Tahání'}));await settle();
  expect(screen.queryByText('Vytáhnout kartu')).toBeNull();
  expect(screen.getByRole('button',{name:'Vytáhnout kartu'})).toBeVisible();
});
