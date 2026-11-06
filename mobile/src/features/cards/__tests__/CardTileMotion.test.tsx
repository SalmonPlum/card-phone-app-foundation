import './helpers/overlayClock';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { CardTile } from '../CardTile';
import { CardGrid } from '../CardGrid';
import { sampleDeck } from '../../../decks/sample';
import { assetRegistry } from '../../../decks/assets';

// Native measurement is the asynchronous boundary; keep the real tile/press handlers.
const measure = jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default.measureInWindow as jest.Mock;
type Measurement = (x: number, y: number, width: number, height: number) => void;
let measured: Measurement;
beforeEach(() => {
  jest.useFakeTimers();
  measure.mockImplementation((callback: Measurement) => { measured = callback; });
});
afterEach(() => { jest.useRealTimers(); measure.mockReset(); });
async function tile() {
  const open = jest.fn();
  const view = await render(<CardTile card={sampleDeck.cards[0]} locale="en" assetRegistry={assetRegistry} width={158} scrollKey="catalogue" onOpen={open} />);
  return { ...view, open, button: screen.getByRole('button', { name: 'Seed' }) };
}
test('a fast tap waits for its native measurement and opens once with that origin', async () => {
  const { button, open } = await tile();
  await fireEvent(button, 'pressIn');
  await fireEvent.press(button);
  expect(open).not.toHaveBeenCalled();
  await act(() => measured(16, 120, 158, 238));
  expect(open.mock.calls).toEqual([[0, { scrollKey: 'catalogue', rect: { x: 16, y: 120, width: 158, height: 238 } }]]);
  await act(() => jest.advanceTimersByTime(500));
  expect(open).toHaveBeenCalledTimes(1);
});
test('a stalled measurement opens safely without an origin and ignores a late callback', async () => {
  const { button, open } = await tile();
  await fireEvent(button, 'pressIn');
  await fireEvent.press(button);
  await act(() => jest.advanceTimersByTime(120));
  expect(open.mock.calls).toEqual([[0, { scrollKey: 'catalogue', rect: null }]]);
  await act(() => measured(16, 120, 158, 238));
  expect(open).toHaveBeenCalledTimes(1);
});
test('an already measured touch opens immediately; assistive activation does not reuse its origin', async () => {
  const { button, open } = await tile();
  await fireEvent(button, 'pressIn');
  await act(() => measured(16, 120, 158, 238));
  await fireEvent.press(button);
  expect(open.mock.calls[0][1].rect).toEqual({ x: 16, y: 120, width: 158, height: 238 });
  await fireEvent.press(button);
  expect(open.mock.calls[1][1].rect).toBeNull();
});
test('unmount cancels pending navigation and discards measurement delivery', async () => {
  const { button, open, unmount } = await tile();
  await fireEvent(button, 'pressIn');
  await fireEvent.press(button);
  await unmount();
  await act(() => { measured(16, 120, 158, 238); jest.advanceTimersByTime(500); });
  expect(open).not.toHaveBeenCalled();
});

test('duplicate fast presses keep one fallback deadline and open once', async () => {
  const { button, open } = await tile();
  await fireEvent(button, 'pressIn');
  await fireEvent.press(button);
  await fireEvent(button, 'pressIn');
  await fireEvent.press(button);
  await act(() => jest.advanceTimersByTime(120));
  expect(open.mock.calls).toEqual([[0, { scrollKey: 'catalogue', rect: null }]]);
});
test('a canceled touch cannot supply stale geometry to later assistive activation', async () => {
  const { button, open } = await tile();
  await fireEvent(button, 'pressIn');
  await act(() => measured(16, 120, 158, 238));
  await fireEvent(button, 'pressOut');
  await act(() => jest.advanceTimersByTime(1));
  await fireEvent.press(button);
  expect(open.mock.calls).toEqual([[0, { scrollKey: 'catalogue', rect: null }]]);
});

test('pending measurement cannot navigate after its catalogue loses focus', async () => {
  const open = jest.fn();
  const props = { cards: [sampleDeck.cards[0]], locale: 'en' as const, assetRegistry, onOpen: open, scrollKey: 'catalogue' };
  const view = await render(<CardGrid {...props} active />);
  const button = screen.getByRole('button', { name: 'Seed' });
  await fireEvent(button, 'pressIn');
  await fireEvent.press(button);
  await view.rerender(<CardGrid {...props} active={false} />);
  await act(() => measured(16, 120, 158, 238));
  expect(open).not.toHaveBeenCalled();
});

test('a new filter invalidates an old measured touch so a fresh tap can open immediately', async () => {
  const open = jest.fn();
  const props = { card: sampleDeck.cards[0], locale: 'en' as const, assetRegistry, width: 158, scrollKey: 'catalogue', onOpen: open };
  const oldToken = Symbol('old-filter'), newToken = Symbol('new-filter');
  const view = await render(<CardTile {...props} interactionToken={oldToken}/>);
  const button = screen.getByRole('button', { name: 'Seed' });
  await fireEvent(button, 'pressIn'); await fireEvent.press(button);
  const oldMeasurement = measured;
  await view.rerender(<CardTile {...props} interactionToken={newToken}/>);
  await fireEvent(button, 'pressIn'); await fireEvent.press(button);
  await act(() => measured(16, 120, 158, 238));
  expect(open).toHaveBeenCalledTimes(1);
  expect(open.mock.calls[0][1].interactionToken).toBe(newToken);
  await act(() => oldMeasurement(186, 410, 158, 238));
  expect(open).toHaveBeenCalledTimes(1);
});
