import { act, renderHook } from '@testing-library/react-native';
import { useArtworkLoading } from '../useArtworkLoading';
import type { ArtworkDefinition } from '../../domain/artwork';
const definition: ArtworkDefinition = { width: 600, height: 900, layers: [{ id: 'paper', asset: 'paper' }, { id: 'mask', asset: 'mask' }] };
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
function props() { return { assetKey: 'front', definition, onLoadEnd: jest.fn(), onError: jest.fn() }; }

test('every unique layer must finish before readiness, and completion is reported once', async () => {
  const settings = props(), view = await renderHook(useArtworkLoading, { initialProps: settings });
  await act(() => { view.result.current.completeLayer('paper'); view.result.current.completeLayer('paper'); });
  expect(view.result.current.ready).toBe(false); expect(settings.onLoadEnd).not.toHaveBeenCalled();
  await act(() => { view.result.current.completeLayer('mask'); view.result.current.completeLayer('mask'); });
  expect(view.result.current.ready).toBe(true); expect(settings.onLoadEnd).toHaveBeenCalledTimes(1);
  await act(() => jest.advanceTimersByTime(3000));
  expect(settings.onError).not.toHaveBeenCalled();
});
test.each(['error', 'timeout'] as const)('composition %s selects fixed fallback without reporting a fatal error', async failure => {
  const settings = props(), view = await renderHook(useArtworkLoading, { initialProps: settings });
  const abandoned = view.result.current;
  await act(() => { if (failure === 'error') abandoned.failLayer(); else jest.advanceTimersByTime(1500); });
  expect(view.result.current.phase).toBe('fallback'); expect(settings.onLoadEnd).not.toHaveBeenCalled();
  await act(() => { abandoned.completeLayer('paper'); abandoned.completeLayer('mask'); });
  expect(view.result.current.ready).toBe(false);
  await act(() => view.result.current.completeFallback());
  expect(view.result.current.ready).toBe(true); expect(settings.onError).not.toHaveBeenCalled();
  expect(settings.onLoadEnd).toHaveBeenCalledTimes(1);
});
test.each(['error', 'timeout'] as const)('fallback %s settles a terminal error once so overlays can proceed', async failure => {
  const settings = props(), view = await renderHook(useArtworkLoading, { initialProps: settings });
  await act(() => view.result.current.failLayer());
  await act(() => { if (failure === 'error') view.result.current.failFallback(); else jest.advanceTimersByTime(1500); });
  expect(view.result.current.phase).toBe('failed');
  expect(settings.onError).toHaveBeenCalledTimes(1); expect(settings.onLoadEnd).toHaveBeenCalledTimes(1);
  await act(() => { view.result.current.completeFallback(); view.result.current.failFallback(); jest.advanceTimersByTime(4000); });
  expect(settings.onLoadEnd).toHaveBeenCalledTimes(1);
});
test('artwork or localized key changes reject callbacks from the old generation', async () => {
  const settings = props(), view = await renderHook(useArtworkLoading, { initialProps: settings });
  const stale = view.result.current;
  await view.rerender({ ...settings, assetKey: 'czech-front' });
  await act(() => { stale.completeLayer('paper'); stale.completeLayer('mask'); stale.failLayer(); });
  expect(view.result.current.phase).toBe('layers'); expect(settings.onLoadEnd).not.toHaveBeenCalled();
  await act(() => { view.result.current.completeLayer('paper'); view.result.current.completeLayer('mask'); });
  expect(settings.onLoadEnd).toHaveBeenCalledTimes(1);
});
test('theme/callback-only updates retain loaded state and use the newest completion callback', async () => {
  const settings = props(), view = await renderHook(useArtworkLoading, { initialProps: settings });
  await act(() => view.result.current.completeLayer('paper'));
  const newest = jest.fn(); await view.rerender({ ...settings, onLoadEnd: newest });
  await act(() => view.result.current.completeLayer('mask'));
  expect(newest).toHaveBeenCalledTimes(1); expect(settings.onLoadEnd).not.toHaveBeenCalled();
  await view.rerender({ ...settings, onLoadEnd: newest });
  expect(view.result.current.ready).toBe(true);
});
test('unmount cancels timeouts and ignores all delayed native callbacks', async () => {
  const settings = props(), view = await renderHook(useArtworkLoading, { initialProps: settings });
  const stale = view.result.current; await view.unmount();
  await act(() => { stale.completeLayer('paper'); stale.completeLayer('mask'); stale.failLayer(); jest.advanceTimersByTime(5000); });
  expect(settings.onLoadEnd).not.toHaveBeenCalled(); expect(settings.onError).not.toHaveBeenCalled();
});

test('already-loaded shared masks remain ready when the next card replaces only its fixed illustration', async () => {
  const settings = props(), view = await renderHook(useArtworkLoading, { initialProps: settings });
  await act(() => { view.result.current.completeLayer('paper'); view.result.current.completeLayer('mask'); });
  const nextDefinition = { ...definition, layers: [{ id: 'paper', asset: 'different-illustration' }, definition.layers[1]] };
  await view.rerender({ ...settings, assetKey: 'next-card', definition: nextDefinition });
  await act(() => view.result.current.completeLayer('paper'));
  expect(view.result.current.ready).toBe(true);
  expect(settings.onLoadEnd).toHaveBeenCalledTimes(2);
  await act(() => jest.advanceTimersByTime(1500));
  expect(view.result.current.phase).toBe('layers');
});

test('a localized logical key reusing all loaded raw layers settles without requiring new native load events', async () => {
  const settings = props(), view = await renderHook(useArtworkLoading, { initialProps: settings });
  await act(() => { view.result.current.completeLayer('paper'); view.result.current.completeLayer('mask'); });
  await view.rerender({ ...settings, assetKey: 'localized-same-pictures' });
  await act(() => jest.advanceTimersByTime(0));
  expect(view.result.current.ready).toBe(true);
  expect(settings.onLoadEnd).toHaveBeenCalledTimes(2);
});

test('explicit retry of the same artwork abandons terminal failure and rejects previous fallback events', async () => {
  const settings = props(), view = await renderHook(useArtworkLoading, { initialProps: { ...settings, retryKey: 0 } });
  await act(() => view.result.current.failLayer());
  const stale = view.result.current;
  await act(() => stale.failFallback());
  await view.rerender({ ...settings, retryKey: 1 });
  expect(view.result.current.phase).toBe('layers');
  await act(() => { stale.completeFallback(); stale.failFallback(); });
  expect(settings.onLoadEnd).toHaveBeenCalledTimes(1);
  await act(() => { view.result.current.completeLayer('paper'); view.result.current.completeLayer('mask'); });
  expect(view.result.current.ready).toBe(true); expect(settings.onLoadEnd).toHaveBeenCalledTimes(2);
});
