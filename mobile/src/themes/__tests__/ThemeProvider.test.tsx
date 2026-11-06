import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ThemeProvider, useThemeSettings } from '../ThemeProvider';
import { themeResource } from '../index';
import type { ThemeStorage } from '../../platform/themeStorage';

const flush = () => act(async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); });
function stored(initial: string | null = null): ThemeStorage {
  let value = initial;
  return { read: jest.fn(async () => value), write: jest.fn(async next => { value = next; }) };
}
function wrapper(storage: ThemeStorage, resource = themeResource) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ThemeProvider storage={storage} resource={resource}>{children}</ThemeProvider>;
  };
}

test.each([null, 'removed-theme', 'celestial-midnight'])('restores a declared theme or uses the resource default (%s)', async saved => {
  const view = await renderHook(useThemeSettings, { wrapper: wrapper(stored(saved)) }); await flush();
  expect(view.result.current.theme.id).toBe(saved === 'celestial-midnight' ? saved : 'mystic-arbor');
  expect(view.result.current.ready).toBe(true);
});

test('resource defines the choices and default without an app inclusion list', async () => {
  const resource = { ...themeResource, defaultThemeId: 'custom', themes: [{ ...themeResource.themes[1], id: 'custom' }] };
  const view = await renderHook(useThemeSettings, { wrapper: wrapper(stored('mystic-arbor'), resource) }); await flush();
  expect(view.result.current.theme.id).toBe('custom');
  expect(view.result.current.themes.map(theme => theme.id)).toEqual(['custom']);
  await act(() => view.result.current.setTheme('solstice-ochre')); await flush();
  expect(view.result.current.theme.id).toBe('custom');
});

test('selected ID persists across remount and invalid choices are ignored', async () => {
  const storage = stored();
  const first = await renderHook(useThemeSettings, { wrapper: wrapper(storage) }); await flush();
  await act(() => first.result.current.setTheme('solstice-ochre')); await flush();
  await act(() => first.result.current.setTheme('unknown')); await flush();
  expect(first.result.current.theme.id).toBe('solstice-ochre');
  expect(storage.write).toHaveBeenCalledTimes(1);
  expect(storage.write).toHaveBeenCalledWith('solstice-ochre');
  await first.unmount();
  const second = await renderHook(useThemeSettings, { wrapper: wrapper(storage) }); await flush();
  expect(second.result.current.theme.id).toBe('solstice-ochre');
});

test('explicit default selection beats a late saved-theme read', async () => {
  let finish!: (id: string) => void;
  const storage = stored(); storage.read = () => new Promise(resolve => { finish = resolve; });
  const view = await renderHook(useThemeSettings, { wrapper: wrapper(storage) }); await flush();
  expect(view.result.current.ready).toBe(false);
  await act(() => view.result.current.setTheme('mystic-arbor'));
  await act(() => finish('celestial-midnight')); await flush();
  expect(view.result.current.theme.id).toBe('mystic-arbor');
  expect(view.result.current.ready).toBe(true);
});

test('ordered writes prevent stale completion or failure from overwriting a later selection', async () => {
  let reject!: (error: Error) => void;
  const storage = stored();
  storage.write = jest.fn().mockImplementationOnce(() => new Promise<void>((_, fail) => { reject = fail; })).mockResolvedValue(undefined);
  const view = await renderHook(useThemeSettings, { wrapper: wrapper(storage) }); await flush();
  await act(() => view.result.current.setTheme('celestial-midnight')); await flush();
  await act(() => view.result.current.setTheme('solstice-ochre')); await flush();
  expect(storage.write).toHaveBeenCalledTimes(1);
  expect(view.result.current.theme.id).toBe('solstice-ochre');
  await act(() => reject(new Error('stale failure'))); await flush();
  expect(storage.write).toHaveBeenLastCalledWith('solstice-ochre');
  expect(view.result.current.saveError).toBe(false);
});

test('failed read keeps the resource default usable; failed saving keeps the new theme and retries it', async () => {
  const storage = stored(); storage.read = jest.fn().mockRejectedValue(new Error('read'));
  storage.write = jest.fn().mockRejectedValueOnce(new Error('write')).mockResolvedValue(undefined);
  const view = await renderHook(useThemeSettings, { wrapper: wrapper(storage) }); await flush();
  expect(view.result.current.ready).toBe(true);
  expect(view.result.current.theme.id).toBe('mystic-arbor');
  await act(() => view.result.current.setTheme('celestial-midnight')); await flush();
  expect(view.result.current.theme.id).toBe('celestial-midnight');
  expect(view.result.current.saveError).toBe(true);
  await act(() => view.result.current.retrySave()); await flush();
  expect(storage.write).toHaveBeenLastCalledWith('celestial-midnight');
  expect(view.result.current.saveError).toBe(false);
});
