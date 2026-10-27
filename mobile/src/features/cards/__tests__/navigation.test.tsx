import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { advance, flushRn, resetClock, settle } from './helpers/overlayClock';
import Home from '../../../app/index';
import Catalogue from '../../../app/catalogue';
import Details from '../../../app/card/[id]';
import Layout from '../../../app/_layout';
import { BackHandler } from 'react-native';
import * as Localization from 'expo-localization';

// The router harness replaces Reanimated wholesale; retain our controlled native clock.
jest.mock('expo-router/build/testing-library/mocks', () => ({}));

const measure = jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default.measureInWindow as jest.Mock;
beforeEach(() => { resetClock(); measure.mockImplementation((callback: (x: number, y: number, width: number, height: number) => void) => callback(10, 24, 360, 800)); });
afterEach(() => measure.mockReset());
async function enterOverlay() {
  await fireEvent(screen.getByTestId('overlay-face-0'), 'loadEnd');
  await fireEvent(screen.getByTestId('overlay-face-surface'), 'layout', { nativeEvent: { layout: { width: 238, height: 358 } } });
  await settle(); await advance(420); await flushRn();
}
async function finishClose() { await settle(); await advance(420); await flushRn(); }
const routes = { _layout: Layout, index: Home, catalogue: Catalogue, 'card/[id]': Details };
test('opens the live catalogue from Home, opens zero, and can open another card after Back', async () => {
  await renderRouter(routes);
  await fireEvent.press(screen.getByText('Browse cards'));
  expect(screen).toHavePathname('/catalogue');
  const mountedGrid = screen.getByTestId('card-grid');
  await fireEvent.scroll(mountedGrid, { nativeEvent: { contentOffset: { x: 0, y: 160 } } });
  await fireEvent.press(screen.getByRole('button', { name: 'Seed' }));
  expect(screen).toHavePathname('/catalogue');
  await enterOverlay();
  expect(screen.getByText('A small beginning that needs care.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  await finishClose();
  expect(screen).toHavePathname('/catalogue');
  expect(screen.getByTestId('card-grid')).toBe(mountedGrid);
  await fireEvent.press(screen.getByRole('button', { name: 'Spring' }));
  expect(screen).toHavePathname('/catalogue');
  expect(screen.getByTestId('overlay-face-7')).toBeTruthy();
});
test('follows the Czech app locale throughout Home, catalogue, details and Back', async () => {
  const locale = Localization.getLocales()[0];
  const locales = jest.spyOn(Localization, 'useLocales').mockReturnValue([{ ...locale, languageTag: 'cs-CZ', languageCode: 'cs' }]);
  try {
    await renderRouter(routes);
    expect(screen.getByRole('header', { name: 'Tichá zahrada' })).toBeVisible();
    await fireEvent.press(screen.getByText('Prohlížet karty'));
    expect(screen.getByRole('header', { name: 'Všechny karty' })).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Semínko' }));
    expect(screen).toHavePathname('/catalogue');
    await enterOverlay();
    expect(screen.getByText('Malý začátek, který potřebuje péči.')).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Zavřít' }));
    await finishClose();
    expect(screen).toHavePathname('/catalogue');
  } finally { locales.mockRestore(); }
});
test.each(['/card/7x', '/card/100', '/card/00'])('offers safe localized recovery for %s', async initialUrl => {
  await renderRouter(routes, { initialUrl });
  expect(screen.getByText('This card could not be found.')).toBeVisible();
  expect(screen.queryByText('A small beginning that needs care.')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen).toHavePathname('/catalogue');
});
test('a valid deep link uses the same full details and Back fallback', async () => {
  await renderRouter(routes, { initialUrl: '/card/99' });
  expect(screen.getByRole('header', { name: 'Circle' })).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen).toHavePathname('/catalogue');
});

test('Android Back dismisses the overlay before the catalogue route can go Back', async () => {
  const back = jest.spyOn(BackHandler, 'addEventListener');
  await renderRouter(routes, { initialUrl: '/catalogue' });
  await fireEvent.press(screen.getByRole('button', { name: 'Seed' }));
  await enterOverlay();
  const handler = back.mock.calls.filter(call => call[0] === 'hardwareBackPress').at(-1)![1];
  await act(() => { expect(handler({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(true); });
  await finishClose();
  expect(screen).toHavePathname('/catalogue');
  expect(screen.queryByTestId('overlay-face-0')).toBeNull();
  back.mockRestore();
});

test('modal focus is restored only after catalogue accessibility and interaction return', async () => {
  const methods = jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default;
  const focus = methods.focus as jest.Mock;
  await renderRouter(routes, { initialUrl: '/catalogue' });
  await fireEvent.press(screen.getByRole('button', { name: 'Seed' }));
  await enterOverlay();
  expect(screen.queryByRole('button', { name: 'Seed' })).toBeNull();
  expect(screen.getByTestId('card-grid', { includeHiddenElements: true }).props.scrollEnabled).toBe(false);
  const restored: boolean[] = [];
  focus.mockImplementation(() => restored.push(screen.queryByRole('button', { name: 'Seed' }) !== null));
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  await finishClose();
  expect(restored).toEqual([true]);
  focus.mockReset();
});
