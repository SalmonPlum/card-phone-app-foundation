import { resetClock } from '../features/cards/__tests__/helpers/overlayClock';
import { AppState } from 'react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import Draw from '../app/(tabs)/index';
import Tabs from '../app/(tabs)/_layout';
import Layout from '../app/_layout';
import Catalogue from '../app/(tabs)/catalogue';

jest.mock('expo-router/build/testing-library/mocks', () => ({}));
const nativeAppState = AppState.currentState;
beforeEach(() => { AppState.currentState = 'active'; });
afterEach(() => { AppState.currentState = nativeAppState; });

test('launch opens Draw with exactly two functional tabs and no Home landing', async () => {
  resetClock();
  await renderRouter({ _layout: Layout, '(tabs)/_layout': Tabs, '(tabs)/index': Draw, '(tabs)/catalogue': Catalogue, 'card/[id]': () => null });
  expect(screen.getByRole('tab', { name: 'Draw' })).toBeVisible();
  expect(screen.getByRole('tab', { name: 'Catalogue' })).toBeVisible();
  expect(screen.getAllByRole('tab')).toHaveLength(2);
  expect(screen.getByText('Cards remaining: 20')).toBeVisible();
  expect(screen.queryByTestId('home-screen')).toBeNull();
});
