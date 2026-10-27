import { act, render, renderHook } from '@testing-library/react-native';
import { Animated, StyleSheet, Text } from 'react-native';
import { DetailTransition, useDetailPresentation } from '../DetailTransition';

// Deliver the same native stack events emitted by installed NativeStackView.
const mockListeners = new Map<string, (event: { data: { closing: boolean } }) => void>();
jest.mock('expo-router', () => ({ useNavigation: () => ({ addListener: (name: string, listener: (event: { data: { closing: boolean } }) => void) => {
  mockListeners.set(name, listener); return () => mockListeners.delete(name);
} }) }));
const timing = jest.requireActual('react-native/Libraries/Animated/AnimatedImplementation').default.timing as typeof Animated.timing;
beforeEach(() => {
  jest.useFakeTimers();
  // Exercise real Animated timing/interpolation with its JS clock, since Jest has no UI thread.
  jest.spyOn(Animated, 'timing').mockImplementation((value, config) => timing(value, { ...config, useNativeDriver: false }));
});
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); mockListeners.clear(); });
const origin = { scrollKey: 'grid', rect: { x: 16, y: 120, width: 158, height: 238 } };
function frame(view: Awaited<ReturnType<typeof render>>) { return StyleSheet.flatten(view.toJSON()!.props.style); }
async function advance(ms: number) { await act(() => jest.advanceTimersByTime(ms)); }

test('visible forward depth waits for native presentation, then remains moving past 260ms', async () => {
  const view = await render(<DetailTransition origin={origin} reducedMotion={false} presentation="opening"><Text>Card</Text></DetailTransition>);
  const initial = frame(view).transform;
  await advance(500);
  expect(frame(view).transform).toEqual(initial);
  await view.rerender(<DetailTransition origin={origin} reducedMotion={false} presentation="presented"><Text>Card</Text></DetailTransition>);
  await advance(160);
  const mid = frame(view).transform as { scale?: number; translateY?: number }[];
  expect(mid[0].scale).toBeGreaterThan(0.94);
  expect(mid[0].scale).toBeLessThan(1);
  await advance(120);
  expect((frame(view).transform as { scale: number }[])[0].scale).toBeLessThan(1);
  await advance(180);
  expect(frame(view).transform).toEqual([{ scale: 1 }, { translateY: 0 }]);
});
test('late preference resolution starts once after presentation and closing settles without replay', async () => {
  const view = await render(<DetailTransition origin={origin} reducedMotion={null} presentation="presented"><Text>Card</Text></DetailTransition>);
  expect(frame(view).opacity).toBe(0);
  await view.rerender(<DetailTransition origin={origin} reducedMotion={false} presentation="presented"><Text>Card</Text></DetailTransition>);
  await advance(100);
  expect((frame(view).transform as { scale: number }[])[0].scale).toBeLessThan(1);
  await view.rerender(<DetailTransition origin={origin} reducedMotion={false} presentation="closing"><Text>Card</Text></DetailTransition>);
  expect(frame(view).transform).toEqual([{ scale: 1 }, { translateY: 0 }]);
  await view.rerender(<DetailTransition origin={origin} reducedMotion={true} presentation="closing"><Text>Card</Text></DetailTransition>);
  expect(frame(view).transform).toEqual([]);
  await view.rerender(<DetailTransition origin={origin} reducedMotion={false} presentation="presented"><Text>Card</Text></DetailTransition>);
  await advance(100);
  expect(frame(view).transform).toEqual([{ scale: 1 }, { translateY: 0 }]);
});
test('native opening completion unlocks entrance and native closing cancels it', async () => {
  const { result, unmount } = await renderHook(useDetailPresentation);
  expect(result.current).toBe('opening');
  await act(() => mockListeners.get('transitionEnd')!({ data: { closing: false } }));
  expect(result.current).toBe('presented');
  await act(() => mockListeners.get('transitionStart')!({ data: { closing: true } }));
  expect(result.current).toBe('closing');
  await act(() => mockListeners.get('transitionEnd')!({ data: { closing: true } }));
  expect(result.current).toBe('closing');
  await unmount();
  expect(mockListeners.size).toBe(0);
});
