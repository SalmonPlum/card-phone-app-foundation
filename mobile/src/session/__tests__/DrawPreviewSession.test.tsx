import { useLayoutEffect } from 'react';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { AppState, Text } from 'react-native';
import { resetClock } from '../../features/cards/__tests__/helpers/overlayClock';
import RootLayout from '../../app/_layout';
import DrawPreview from '../../app/draw-preview';
import Details from '../../app/card/[id]';
import { useSession } from '../SessionProvider';

// Keep the real provider, controller, screen and scene; replace native entropy,
// configuration selection and animation scheduling at their external boundaries.
jest.mock('expo-router/build/testing-library/mocks', () => ({}));
jest.mock('../../config/appConfig', () => ({ appConfig: { deckId: 'alternate' } }));
let mockId = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `draw-owner-${++mockId}`,
  getRandomValues: (values: Uint32Array) => { values.fill(0); return values; },
}));

let current: ReturnType<typeof useSession>;
function Idle() {
  const session = useSession();
  useLayoutEffect(() => { current = session; }, [session]);
  return <Text>Idle route</Text>;
}
const nativeAppState = AppState.currentState;
beforeEach(() => { mockId = 0; resetClock(); AppState.currentState = 'active'; });
afterEach(() => { AppState.currentState = nativeAppState; });

test('Draw consumes the root session and configured artwork/results without resetting on mount', async () => {
  await renderRouter({ _layout: RootLayout, index: Idle, 'draw-preview': DrawPreview, 'card/[id]': Details });
  expect(current.state).toMatchObject({ sessionId: 'draw-owner-1', deckId: 'alternate' });
  const first = current.state!;
  await act(() => current.draw({ x: 620, y: 330, angle: .12, scale: 1 }, first.sessionId, first.epoch));
  for (let i = 0; i < 3; i++) {
    const state = current.state!;
    await act(() => current.complete(state.sessionId, state.epoch));
  }
  expect(current.state).toMatchObject({ phase: 'reveal', drawnIds: [7] });
  await act(() => router.push('/draw-preview'));
  expect(screen.getByText('Wave')).toBeVisible();
  expect(current.state!.sessionId).toBe(first.sessionId);
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm card' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Stop' }));
  expect(screen.getByText('Movement, change, and your own rhythm.')).toBeVisible();
  expect(current.state).toMatchObject({ sessionId: first.sessionId, phase: 'results', drawnIds: [7] });
  await fireEvent.press(screen.getByRole('button', { name: 'New session' }));
  expect(current.state).toMatchObject({ sessionId: 'draw-owner-2', phase: 'regrip', drawnIds: [] });
});
