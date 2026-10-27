import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Animated, StyleSheet } from 'react-native';
import Catalogue from '../../../app/catalogue';
import Details from '../../../app/card/[id]';
import Layout from '../../../app/_layout';

const measure = jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default.measureInWindow as jest.Mock;
const timing = jest.requireActual('react-native/Libraries/Animated/AnimatedImplementation').default.timing as typeof Animated.timing;
// The JS router test host has no native onAppear. Deliver only that external boundary.
const mockListeners = new Map<string, (event: { data: { closing: boolean } }) => void>();
const mockNavigation = { addListener: (name: string, listener: (event: { data: { closing: boolean } }) => void) => {
  mockListeners.set(name, listener); return () => mockListeners.delete(name);
} };
jest.mock('expo-router', () => ({ ...jest.requireActual('expo-router'), useNavigation: () => mockNavigation }));
beforeEach(() => {
  jest.useFakeTimers();
  measure.mockImplementation((callback: (x: number, y: number, w: number, h: number) => void) => callback(16, 120, 158, 238));
  jest.spyOn(Animated, 'timing').mockImplementation((value, config) => timing(value, { ...config, useNativeDriver: false }));
});
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); measure.mockReset(); mockListeners.clear(); });
test('catalogue passes the measured origin and route waits for native opening completion', async () => {
  const view = await renderRouter({ _layout: Layout, catalogue: Catalogue, 'card/[id]': Details }, { initialUrl: '/catalogue' });
  const button = screen.getByRole('button', { name: 'Seed' });
  await fireEvent(button, 'pressIn');
  await fireEvent.press(button);
  expect(screen).toHavePathname('/card/0');
  expect(screen).toHaveSearchParams({ id: '0', origin: 'tile', scrollKey: 'catalogue:sample', y: '120', height: '238' });
  const transform = () => {
    const host = view.container.queryAll(node => Array.isArray(StyleSheet.flatten(node.props.style)?.transform))[0];
    return StyleSheet.flatten(host.props.style).transform as { scale: number }[];
  };
  const initial = transform();
  await act(() => jest.advanceTimersByTime(600));
  expect(transform()).toEqual(initial);
  await act(() => mockListeners.get('transitionEnd')!({ data: { closing: false } }));
  await act(() => jest.advanceTimersByTime(200));
  expect(transform()[0].scale).toBeGreaterThan(initial[0].scale);
  expect(transform()[0].scale).toBeLessThan(1);
  await act(() => jest.advanceTimersByTime(260));
  expect(transform()).toEqual([{ scale: 1 }, { translateY: 0 }]);
});
