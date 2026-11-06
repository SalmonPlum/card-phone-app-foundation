import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import type { Card } from '../../../domain/contracts';
import { sampleDeck } from '../../../decks/sample';
import { useSearchGridMotion, type SearchGridMotionOptions } from '../useSearchGridMotion';
import type { Rect } from '../overlayGeometry';

const cards = sampleDeck.cards.slice(0, 3);
const origins = { 0: { x: 16, y: 120, width: 158, height: 237 } };
let deliveries: ((positions: Record<number, Rect>) => void)[];
function options(): SearchGridMotionOptions {
  return { cards, enabled: true, layoutKey: 'portrait', measureTiles: done => { deliveries.push(done); } };
}
beforeEach(() => { jest.useFakeTimers(); deliveries = []; });
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

test('mount and same membership edits apply immediately without animation', async () => {
  const props = options();
  const view = await renderHook(useSearchGridMotion, { initialProps: props });
  expect(view.result.current.cards).toBe(cards);
  await view.rerender({ ...props, cards: [...cards] });
  expect(deliveries).toHaveLength(0);
  expect(view.result.current.isMoving()).toBe(false);
});

test('a changed set captures origins, then exposes new results with a bounded movement interval', async () => {
  const props = options();
  const view = await renderHook(useSearchGridMotion, { initialProps: props });
  await view.rerender({ ...props, cards: cards.slice(0, 1) });
  expect(view.result.current.isMoving()).toBe(true);
  await act(() => deliveries[0](origins));
  expect(view.result.current.cards).toEqual([cards[0]]);
  expect(view.result.current.origins).toEqual(origins);
  expect(view.result.current.isMoving()).toBe(true);
  await act(() => jest.advanceTimersByTime(201));
  expect(view.result.current.isMoving()).toBe(true);
  await act(() => jest.advanceTimersByTime(200));
  expect(view.result.current.isMoving()).toBe(true);
  await act(() => jest.advanceTimersByTime(150));
  expect(view.result.current.isMoving()).toBe(true);
  await act(() => jest.advanceTimersByTime(100));
  expect(view.result.current.isMoving()).toBe(false);
});

test('missing measurements cannot hold results beyond 32ms or overwrite them on late delivery', async () => {
  const props = options();
  const view = await renderHook(useSearchGridMotion, { initialProps: props });
  await view.rerender({ ...props, cards: [] });
  await act(() => jest.advanceTimersByTime(32));
  expect(view.result.current.cards).toEqual([]);
  expect(view.result.current.origins).toEqual({});
  await act(() => deliveries[0](origins));
  expect(view.result.current.origins).toEqual({});
});

test('rapid edits invalidate old native deliveries including a return to the original set', async () => {
  const props = options();
  const view = await renderHook(useSearchGridMotion, { initialProps: props });
  await view.rerender({ ...props, cards: [cards[1]] });
  await view.rerender({ ...props, cards: [cards[2]] });
  await act(() => deliveries[0](origins));
  expect(view.result.current.cards).toBe(cards);
  await act(() => deliveries[1]({}));
  expect(view.result.current.cards).toEqual([cards[2]]);
  await view.rerender({ ...props, cards });
  await act(() => deliveries[2]({}));
  expect(view.result.current.cards).toBe(cards);
  expect(view.result.current.generation).toBe(2);
});

test.each(['disable', 'layout', 'unmount', 'background'] as const)('pending results cannot animate after %s', async boundary => {
  const props = options();
  let background!: (state: string) => void;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
    background = callback as typeof background; return { remove: jest.fn() };
  });
  const view = await renderHook(useSearchGridMotion, { initialProps: props });
  await view.rerender({ ...props, cards: [cards[1]] });
  if (boundary === 'disable') await view.rerender({ ...props, cards: [cards[1]], enabled: false });
  if (boundary === 'layout') await view.rerender({ ...props, cards: [cards[1]], layoutKey: 'landscape' });
  if (boundary === 'unmount') await view.unmount();
  if (boundary === 'background') await act(() => background('background'));
  await act(() => { deliveries[0](origins); jest.advanceTimersByTime(401); });
  if (boundary !== 'unmount') {
    expect(view.result.current.cards).toEqual([cards[1]]);
    expect(view.result.current.isMoving()).toBe(false);
  }
});

test('native motion state is published before the new result set commits', async () => {
  const props = options();
  let renderedCards: readonly Card[] = cards;
  const published: { deadline: number; ids: number[]; rendered: typeof renderedCards }[] = [];
  const publishMotion = (deadline: number, ids: number[]) => { published.push({ deadline, ids, rendered: renderedCards }); };
  const view = await renderHook((options: SearchGridMotionOptions) => {
    const motion = useSearchGridMotion(options); renderedCards = motion.cards; return motion;
  }, { initialProps: { ...props, publishMotion } });
  await view.rerender({ ...props, cards: [cards[1]], publishMotion });
  await act(() => deliveries[0](origins));
  expect(published.at(-1)).toMatchObject({ ids: [7], rendered: cards });
  expect(published.at(-1)!.deadline).toBeGreaterThan(Date.now());
  await view.rerender({ ...props, cards: [cards[1]], enabled: false, publishMotion });
  expect(published.at(-1)!.deadline).toBe(0);
});
