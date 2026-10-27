import { act, renderHook } from '@testing-library/react-native';
import { useCardOverlay } from '../useCardOverlay';
import type { Rect } from '../overlayGeometry';

const host = { x: 10, y: 24, width: 360, height: 800 };
const tile = { x: 26, y: 200, width: 158, height: 237.66 };
async function setup() {
  const hosts: ((rect: Rect | null) => void)[] = [];
  const sources: ((rect: Rect | null) => void)[] = [];
  const focusCard = jest.fn();
  const { result, rerender, unmount } = await renderHook(({ active, layoutKey }: { active: boolean; layoutKey: string }) => useCardOverlay({
    active, layoutKey, measureHost: callback => hosts.push(callback),
    measureCard: (_id, callback) => sources.push(callback), focusCard,
  }), { initialProps: { active: true, layoutKey: '360:800:1' } });
  const open = async (id = 0) => {
    await act(() => result.current.open(id, { rect: tile, scrollKey: 'catalogue' }));
    expect(hosts.length).toBeGreaterThan(0);
    await act(() => hosts.at(-1)!(host));
  };
  return { result, rerender, unmount, hosts, sources, focusCard, open };
}
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test('waits for host and image readiness before hiding the exact source; details wait for completion', async () => {
  const h = await setup(); await h.open();
  expect(h.result.current.state).toMatchObject({ stage: 'preparing', id: 0, source: { x: 16, y: 176, width: 158, height: 237.66 } });
  expect(h.result.current.hiddenCardId).toBeNull();
  const token = h.result.current.state.generation;
  await act(() => h.result.current.ready(token));
  expect(h.result.current.hiddenCardId).toBe(0);
  expect(h.result.current.state.stage).toBe('opening');
  await act(() => h.result.current.complete(token));
  expect(h.result.current.state.stage).toBe('open');
});
test('one selection wins duplicate opens; close during opening rejects its stale completion', async () => {
  const h = await setup(); await h.open(99);
  const opening = h.result.current.state.generation;
  await act(() => { h.result.current.ready(opening); h.result.current.open(0, { rect: tile, scrollKey: 'catalogue' }); });
  expect(h.result.current.state.id).toBe(99);
  await act(() => { h.result.current.close(); h.result.current.close(); });
  expect(h.sources).toHaveLength(1);
  await act(() => h.result.current.complete(opening));
  expect(h.result.current.state.stage).toBe('closing');
  await act(() => h.hosts.at(-1)!(host));
  await act(() => h.sources[0]({ ...tile, y: 210 }));
  expect(h.result.current.state).toMatchObject({ closeReady: true, closeTarget: { x: 16, y: 186, width: 158, height: 237.66 } });
  await act(() => h.result.current.complete(h.result.current.state.generation));
  expect(h.result.current.state.stage).toBe('closed');
  expect(h.focusCard).toHaveBeenCalledWith(99);
  await h.open(0);
  expect(h.result.current.state.id).toBe(0);
});
test('missing or offscreen closing source uses a fade and bounded host callbacks cannot stall forever', async () => {
  const h = await setup(); await h.open();
  await act(() => h.result.current.ready(h.result.current.state.generation));
  await act(() => h.result.current.close());
  await act(() => { h.hosts.at(-1)!(host); h.sources[0]({ ...tile, y: -500 }); });
  expect(h.result.current.state).toMatchObject({ stage: 'closing', closeReady: true, closeTarget: null });
  await act(() => h.result.current.complete(h.result.current.state.generation));
  await act(() => h.result.current.open(0, { rect: tile, scrollKey: 'catalogue' }));
  await act(() => jest.advanceTimersByTime(150));
  expect(h.result.current.state.stage).toBe('closed');
});
test('focus loss, cancellation and unmount reject delayed measurement and completion', async () => {
  const h = await setup();
  await act(() => h.result.current.open(0, { rect: tile, scrollKey: 'catalogue' }));
  expect(h.result.current.state.stage).toBe('preparing');
  const old = h.result.current.state.generation;
  await h.rerender({ active: false, layoutKey: '360:800:1' });
  await act(() => { h.hosts[0](host); h.result.current.ready(old); h.result.current.complete(old); });
  expect(h.result.current.state.stage).toBe('closed');
  await h.rerender({ active: true, layoutKey: '360:800:1' });
  await h.open();
  await act(() => h.result.current.cancel());
  expect(h.result.current.state.stage).toBe('closed');
  await act(() => h.result.current.open(99, { rect: tile, scrollKey: 'catalogue' }));
  const last = h.hosts.at(-1)!;
  await h.unmount();
  await act(() => { last(host); jest.runOnlyPendingTimers(); });
  expect(h.focusCard).not.toHaveBeenCalled();
});
test('font or viewport changes dismiss using fade instead of stale source geometry', async () => {
  const h = await setup(); await h.open();
  await act(() => h.result.current.ready(h.result.current.state.generation));
  await h.rerender({ active: true, layoutKey: '360:800:1.5' });
  expect(h.result.current.state).toMatchObject({ stage: 'closing', closeReady: true, closeTarget: null });
});
test('layout invalidation during return measurement cancels that target and stale callbacks', async () => {
  const h = await setup(); await h.open();
  await act(() => h.result.current.ready(h.result.current.state.generation));
  await act(() => h.result.current.close());
  const closing = h.result.current.state.generation;
  await h.rerender({ active: true, layoutKey: '600:800:1' });
  expect(h.result.current.state).toMatchObject({ closeReady: true, closeTarget: null });
  expect(h.result.current.state.generation).toBeGreaterThan(closing);
  await act(() => { h.hosts.at(-1)!(host); h.sources[0](tile); h.result.current.complete(closing); });
  expect(h.result.current.state.stage).toBe('closing');
  expect(h.result.current.state.closeTarget).toBeNull();
});
