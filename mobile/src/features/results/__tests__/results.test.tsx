import Settings from '../../../app/(tabs)/settings';
import { useLayoutEffect } from 'react';
import { act, fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';
import { AppState, BackHandler, FlatList, StyleSheet, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import * as Localization from 'expo-localization';
import { advance, flushRn, resetClock, settle } from '../../cards/__tests__/helpers/overlayClock';
import RootLayout from '../../../app/_layout';
import Tabs from '../../../app/(tabs)/_layout';
import Draw from '../../../app/(tabs)/index';
import Catalogue from '../../../app/(tabs)/catalogue';
import Details from '../../../app/card/[id]';
import { configuredDeck } from '../../../decks';
import { useSession } from '../../../session/SessionProvider';

// Keep the actual router, provider, reducer, collection and overlay. Only native
// secure entropy, measurement and deferred animation delivery are controlled.
jest.mock('expo-router/build/testing-library/mocks', () => ({}));
let mockId = 0, mockEntropyError = false, mockWords: number[] = [];
jest.mock('expo-crypto', () => ({
  randomUUID: () => `results-${++mockId}`,
  getRandomValues: (values: Uint32Array) => {
    if (mockEntropyError) throw new Error('Unavailable');
    values.fill(mockWords.shift() ?? 0); return values;
  },
}));
let current: ReturnType<typeof useSession>;
function ObservedDraw() {
  const session = useSession();
  useLayoutEffect(() => { current = session; }, [session]);
  return <Draw />;
}
const routes = { _layout: RootLayout, '(tabs)/_layout': Tabs, '(tabs)/index': ObservedDraw, '(tabs)/catalogue': Catalogue, '(tabs)/settings': Settings, 'card/[id]': Details };
const methods = jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default;
const measure = methods.measureInWindow as jest.Mock;
const nativeAppState = AppState.currentState;
const nativeAppSubscription = (AppState.addEventListener as jest.Mock).getMockImplementation();
const originalCards = configuredDeck.cards;
beforeEach(() => {
  mockId = 0; mockEntropyError = false;
  // Keep appended cards in place; adjacent swaps of the original eight put Circle first.
  mockWords = Array.from({length:originalCards.length-1},(_,step)=>{
    const index=originalCards.length-1-step;
    return index>7?index:index-1;
  });
  resetClock(); AppState.currentState = 'active';
  (AppState.addEventListener as jest.Mock).mockImplementation(nativeAppSubscription);
  measure.mockImplementation((callback: (x: number, y: number, width: number, height: number) => void) => callback(0, 0, 360, 698));
});
afterEach(() => { AppState.currentState = nativeAppState; measure.mockReset(); configuredDeck.cards = originalCards; });

async function drawCards(count: number, finishLastExit = true) {
  // Drive the controller's native phase-completion boundary. Batching also lets
  // the hundred-card fixture reach results without rendering 100 shuffle scenes.
  const { sessionId } = current.state!;
  let epoch = current.state!.epoch;
  await act(() => {
    for (let i = 0; i < count; i++) {
      current.draw({ x: 620, y: 330, angle: .12, scale: 1 }, sessionId, epoch++);
      for (let phase = 0; phase < 3; phase++) current.complete(sessionId, epoch++);
      current.confirm(); epoch++;
      if (i < count - 1 || finishLastExit) current.complete(sessionId, epoch++);
    }
  });
}
async function stopAfter(count: number) {
  await renderRouter(routes); await settle();
  await drawCards(count);
  await fireEvent.press(screen.getByRole('button', { name: 'Stop' }));
}
async function open(id: number, name: string) {
  const tile = screen.getByRole('button', { name });
  await fireEvent(tile, 'pressIn'); await fireEvent.press(tile);
  await fireEvent(screen.getByTestId(`overlay-face-${id}`), 'loadEnd');
  await fireEvent(screen.getByTestId('overlay-face-surface'), 'layout', { nativeEvent: { layout: { width: 238, height: 358 } } });
  await fireEvent(screen.getByTestId('detail-header',{includeHiddenElements:true}), 'layout', {nativeEvent:{layout:{height:64}}});
  await settle(); await advance(420); await flushRn();
}
async function finishClose() { await settle(); await advance(420); await flushRn(); }

test('Stop shows committed sparse IDs in order, with full details only after opening and a continuous return', async () => {
  await stopAfter(3);
  expect(current.state).toMatchObject({ phase: 'results', drawnIds: [99, 0, 7] });
  expect(screen.queryByRole('header', { name: 'Drawn cards' })).toBeNull();
  expect(screen.getByText('Cards drawn: 3')).toBeVisible();
  expect(screen.getAllByRole('button').map(button => button.props.accessibilityLabel).filter(Boolean)).toEqual(['Circle', 'Seed', 'Spring']);
  expect(screen.queryByText(originalCards[0].translations.en.sections.meaning)).toBeNull();
  const grid = screen.getByTestId('card-grid'), host = screen.getByTestId('results-host');
  await fireEvent.scroll(grid, { nativeEvent: { contentOffset: { x: 0, y: 160 } } });
  await open(0, 'Seed');
  const image = screen.getByTestId('overlay-face-0');
  expect(screen.getByText(originalCards[0].translations.en.sections.meaning)).toBeVisible();
  expect(screen.getByText(originalCards[0].translations.en.sections.description)).toBeVisible();
  expect(screen.queryByText('Cards drawn: 3')).toBeNull();
  expect(screen.queryByRole('button', { name: 'New session' })).toBeNull();
  expect(screen.queryAllByRole('tab')).toHaveLength(0);
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByTestId('overlay-face-0')).toBe(image);
  await finishClose();
  expect(screen.getByTestId('card-grid')).toBe(grid);
  expect(screen.getByTestId('results-host')).toBe(host);
  expect(current.state!.drawnIds).toEqual([99, 0, 7]);
  expect(screen.getByRole('button', { name: 'New session' })).toBeVisible();
});

test('one result retains the ordinary catalogue tile width', async () => {
  await stopAfter(1);
  const width = StyleSheet.flatten(screen.getByTestId('card-tile-99').props.style).width;
  await fireEvent.press(screen.getByRole('tab', { name: 'Catalogue' }));
  expect(StyleSheet.flatten(screen.getByTestId('card-tile-99').props.style).width).toBe(width);
});

test('empty results offer an explicit Draw cards action and never restart on a tab round trip', async () => {
  await renderRouter(routes); await settle();
  await fireEvent.press(screen.getByRole('button', { name: 'Stop' }));
  const old = current.state!;
  expect(screen.getByText('No cards drawn yet.')).toBeVisible();
  expect(screen.getByText('Cards drawn: 0')).toBeVisible();
  await fireEvent.press(screen.getByRole('tab', { name: 'Catalogue' }));
  await fireEvent.press(screen.getByRole('tab', { name: 'Draw' }));
  expect(current.state).toBe(old);
  await fireEvent.press(screen.getByRole('button', { name: 'Draw cards' }));
  expect(current.state).toMatchObject({ sessionId: 'results-2', phase: 'regrip', drawnIds: [] });
  expect(current.state!.remainingIds).toHaveLength(20);
  expect(screen.queryByTestId('results-host')).toBeNull();
});

test('final confirmation shows every drawn card and preserves exhausted results until explicit reset', async () => {
  await renderRouter(routes); await settle();
  const identity = current.state!.sessionId;
  await drawCards(20);
  expect(current.state).toMatchObject({ sessionId: identity, phase: 'results', remainingIds: [], drawnIds: [99, 0, 7, 12, 23, 35, 48, 64, 104, 118, 127, 139, 152, 166, 173, 185, 198, 207, 219, 234] });
  expect(screen.getByText('Cards drawn: 20')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Tree' })).toBeVisible();
  await settle(); await advance(10000); await flushRn();
  expect(current.state!.sessionId).toBe(identity);
});

test('results retain their grid and scroll through tabs and Android Back closes details before leaving Draw', async () => {
  const back = jest.spyOn(BackHandler, 'addEventListener');
  try {
    await stopAfter(3);
    const state = current.state, grid = screen.getByTestId('card-grid');
    await fireEvent.scroll(grid, { nativeEvent: { contentOffset: { x: 0, y: 180 } } });
    const scrollTo = jest.spyOn(FlatList.prototype, 'scrollToOffset');
    const resultScrollCalls = () => scrollTo.mock.contexts.filter(list => list.props.data?.length === 3);
    await fireEvent.press(screen.getByRole('tab', { name: 'Catalogue' }));
    await fireEvent.press(screen.getByRole('tab', { name: 'Draw' }));
    expect(screen.getByTestId('card-grid')).toBe(grid);
    expect(current.state).toBe(state);
    expect(resultScrollCalls()).toHaveLength(0);
    await open(99, 'Circle');
    const handler = back.mock.calls.filter(([event]) => event === 'hardwareBackPress').at(-1)![1];
    await act(() => { expect(handler({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(true); });
    await finishClose();
    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('card-grid')).toBe(grid);
    expect(resultScrollCalls()).toHaveLength(0);
  } finally { back.mockRestore(); jest.restoreAllMocks(); }
});

test('failed New session retains old results and offers Retry, then rejects old completions after fresh reset', async () => {
  await stopAfter(3);
  const old = current.state!, grid = screen.getByTestId('card-grid');
  mockEntropyError = true;
  await fireEvent.press(screen.getByRole('button', { name: 'New session' }));
  expect(current.state).toBe(old);
  expect(screen.getByTestId('card-grid')).toBe(grid);
  expect(screen.getByText('Secure randomness is unavailable. Try again.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  await open(0, 'Seed');
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' })); await finishClose();
  mockEntropyError = false;
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  const fresh = current.state!;
  expect(fresh).toMatchObject({ sessionId: 'results-3', phase: 'regrip', drawnIds: [] });
  expect(fresh.remainingIds).toHaveLength(20);
  await act(() => { current.complete(old.sessionId, old.epoch); current.draw({ x: 620, y: 330, angle: 0, scale: 1 }, old.sessionId, old.epoch); });
  expect(current.state).toBe(fresh);
  expect(screen.queryByTestId('results-host')).toBeNull();
  expect(screen.queryByTestId('overlay-face-0')).toBeNull();
  expect(screen.getAllByRole('tab')).toHaveLength(3);
});

test('an inactive results collection mounting cannot unlock a focused catalogue modal', async () => {
  await renderRouter(routes); await settle();
  await drawCards(1);
  await fireEvent.press(screen.getByRole('tab', { name: 'Catalogue' }));
  await open(0, 'Seed');
  await act(() => current.stop()); // Results mounts in the already mounted but unfocused Draw tab.
  expect(current.state!.phase).toBe('results');
  expect(screen.queryAllByRole('tab')).toHaveLength(0);
  expect(screen.getByTestId('bottom-dock', { includeHiddenElements: true }).props.pointerEvents).toBe('none');
  await fireEvent.press(screen.getByRole('button', { name: 'Close' })); await finishClose();
  await fireEvent.press(screen.getByRole('tab', { name: 'Draw' }));
  expect(screen.getByRole('button', { name: 'Circle' })).toBeVisible();
});

test('Czech results localize their count, actions, tiles and full details', async () => {
  const locale = Localization.getLocales()[0];
  const locales = jest.spyOn(Localization, 'useLocales').mockReturnValue([{ ...locale, languageTag: 'cs-CZ', languageCode: 'cs' }]);
  try {
    await renderRouter(routes); await settle(); await drawCards(1);
    await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));
    await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));
    await fireEvent.press(screen.getByRole('tab',{name:'Tahání'}));
    await fireEvent.press(screen.getByRole('button', { name: 'Ukončit' }));
    expect(screen.queryByRole('header', { name: 'Vytažené karty' })).toBeNull();
    expect(screen.getByText('Vytažené karty: 1')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Nové vykládání' })).toBeVisible();
    expect(screen.queryByText(originalCards[7].translations.cs.sections.meaning)).toBeNull();
    await open(99, 'Kruh');
    expect(screen.getByText(originalCards[7].translations.cs.sections.description)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Zavřít' })).toBeVisible();
  } finally { locales.mockRestore(); }
});

test('a hundred exhausted results use the virtualized collection without a surrounding scroll view', async () => {
  configuredDeck.cards = Array.from({ length: 100 }, (_, id) => ({ ...originalCards[0], id }));
  mockWords = [];
  await renderRouter(routes); await settle(); await drawCards(100);
  expect(current.state!.phase).toBe('results');
  expect(screen.getByText('Cards drawn: 100')).toBeVisible();
  expect(screen.getByTestId('card-tile-1')).toBeVisible();
  expect(screen.queryByTestId('card-tile-99')).toBeNull();
  let ancestor = screen.getByTestId('card-grid').parent;
  while (ancestor) { expect(ancestor.type).not.toBe('RCTScrollView'); ancestor = ancestor.parent; }
});

test.each(['background', 'layout'] as const)('results survive %s while details release the dock and retain the return grid', async change => {
  const listeners = new Set<(status: AppStateStatus) => void>();
  const subscription = jest.spyOn(AppState, 'addEventListener').mockImplementation((type, handler) => {
    const listener = handler as (status: AppStateStatus) => void;
    if (type === 'change') listeners.add(listener);
    return { remove: () => listeners.delete(listener) } as NativeEventSubscription;
  });
  try {
    await stopAfter(3);
    const grid = screen.getByTestId('card-grid'), state = current.state;
    await open(0, 'Seed');
    if (change === 'background') {
      await act(() => { for (const listener of [...listeners]) listener('background'); });
      await act(() => { for (const listener of [...listeners]) listener('active'); });
    } else {
      await fireEvent(screen.getByTestId('results-host'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 460 } } });
    }
    await finishClose();
    expect(screen.queryByTestId('card-detail-overlay')).toBeNull();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByTestId('card-grid')).toBe(grid);
    expect(current.state).toBe(state);
    await open(7, 'Spring');
    expect(screen.getByText(originalCards[1].translations.en.sections.description)).toBeVisible();
  } finally { subscription.mockRestore(); }
});

test('reset unmounts results while a native opening completion is queued and rejects its late delivery', async () => {
  await stopAfter(3);
  await fireEvent.press(screen.getByRole('button', { name: 'Seed' }));
  await fireEvent(screen.getByTestId('overlay-face-0'), 'loadEnd');
  await fireEvent(screen.getByTestId('overlay-face-surface'), 'layout', { nativeEvent: { layout: { width: 238, height: 358 } } });
  await fireEvent(screen.getByTestId('detail-header',{includeHiddenElements:true}), 'layout', {nativeEvent:{layout:{height:64}}});
  await settle(); await advance(420); // Completion remains queued on RN.
  const old = current.state!;
  await act(() => current.reset());
  const fresh = current.state;
  await flushRn(); await settle();
  expect(fresh).toMatchObject({ sessionId: 'results-2', phase: 'regrip', drawnIds: [] });
  expect(current.state).toBe(fresh);
  expect(current.state!.sessionId).not.toBe(old.sessionId);
  expect(screen.queryByTestId('results-host')).toBeNull();
  expect(screen.queryByTestId('card-detail-overlay')).toBeNull();
  expect(screen.getAllByRole('tab')).toHaveLength(3);
});


test.each([0, 1])('failed reset in a short large-text host keeps controls and %i results in one scrollable viewport', async count => {
  const native = jest.requireActual('react-native') as typeof import('react-native');
  const dimensions = jest.spyOn(native, 'useWindowDimensions').mockReturnValue({ width: 280, height: 480, scale: 1, fontScale: 2 });
  try {
    await renderRouter(routes); await settle();
    if (count) await drawCards(count);
    await fireEvent.press(screen.getByRole('button', { name: 'Stop' }));
    await fireEvent(screen.getByTestId('results-host'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 280, height: 250 } } });
    const old = current.state;
    mockEntropyError = true;
    await fireEvent.press(screen.getByRole('button', { name: 'New session' }));
    const grid = screen.getByTestId('card-grid');
    expect(within(grid).getByRole('button', { name: 'Try again' })).toBeVisible();
    if (count) expect(within(grid).getByRole('button', { name: 'Circle' })).toBeVisible();
    else expect(within(grid).getByRole('button', { name: 'Draw cards' })).toBeVisible();
    expect(current.state).toBe(old);
    await fireEvent.scroll(grid, { nativeEvent: { contentOffset: { x: 0, y: 150 } } });
    mockEntropyError = false;
    await fireEvent.press(within(grid).getByRole('button', { name: 'Try again' }));
    expect(current.state).toMatchObject({ sessionId: 'results-3', phase: 'regrip', drawnIds: [] });
  } finally { dimensions.mockRestore(); }
});


test('final-card confirmation keeps the draw stage through its exit before mounting results',async()=>{
  await renderRouter(routes); await settle();
  await drawCards(20,false); await settle();
  const confirmed=current.state!;
  expect(confirmed).toMatchObject({phase:'resume',remainingIds:[],selectedId:null});
  const stage=screen.getByTestId('draw-stage');
  expect(screen.queryByTestId('results-host')).toBeNull();
  await fireEvent.press(screen.getByRole('button',{name:'Confirm card'}));
  expect(current.state).toBe(confirmed);
  expect(screen.queryByRole('button',{name:'Stop'})).toBeNull();
  await advance(899); await settle();
  expect(current.state).toBe(confirmed);
  expect(screen.getByTestId('draw-stage')).toBe(stage);
  expect(screen.getByTestId('draw-foreground-dim',{includeHiddenElements:true}).props.style[1].__read().opacity).toBe(1);
  await advance(1); await settle();
  expect(current.state).toMatchObject({phase:'results',sessionId:confirmed.sessionId,drawnIds:confirmed.drawnIds});
  expect(screen.getByTestId('results-host')).toBeVisible();
  expect(screen.queryByTestId('draw-stage')).toBeNull();
});

test('queued exhausted-exit completion cannot replace a freshly reset session with results',async()=>{
  await renderRouter(routes); await settle();
  await drawCards(20,false); await settle();
  expect(current.state).toMatchObject({phase:'resume',remainingIds:[]});
  await advance(900); // Native completion is queued, not delivered to RN yet.
  await act(()=>current.reset());
  const fresh=current.state;
  await flushRn(); await settle();
  expect(current.state).toBe(fresh);
  expect(current.state).toMatchObject({phase:'regrip',drawnIds:[]});
  expect(screen.queryByTestId('results-host')).toBeNull();
});
