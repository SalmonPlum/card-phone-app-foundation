import type { EntryAnimationsValues, ExitAnimationsValues, LayoutAnimationsValues } from 'react-native-reanimated';
import { searchCardEntering, searchCardExiting, searchRowLayout } from '../searchGridAnimations';

// Native timing is a boundary: keep worklet calculations real and inspect their destinations.
jest.mock('react-native-reanimated', () => ({
  withTiming: (target: number, config: unknown) => ({ target, config, current: 300,
    onFrame: (animation: { current: number }) => { animation.current = 250; return false; } }),
  Easing: { cubic: (x: number) => x ** 3, out: (fn: (x: number) => number) => (x: number) => 1 - fn(1 - x) },
}));
const target = { targetOriginX: 0, targetOriginY: 0, targetGlobalOriginX: 16, targetGlobalOriginY: 120,
  targetBorderRadius: 0, targetWidth: 158, targetHeight: 270, windowWidth: 360, windowHeight: 800 } satisfies EntryAnimationsValues;
const state = () => ({ value: { deadline: Date.now() + 200, ids: [0, 7] } });

test('a retained card crossing row parents starts at its previous global position', () => {
  const enter = searchCardEntering({ x: 186, y: 410, width: 158, height: 237 }, state());
  const result = enter(target);
  expect(result.initialValues).toMatchObject({ originX: 170, originY: 290, opacity: 1 });
  expect(result.animations).toMatchObject({ originX: { target: 0 }, originY: { target: 0 } });
});

test('a new or unmeasured card fades in without an invented movement origin', () => {
  const result = searchCardEntering(undefined, state())(target);
  expect(result.initialValues).toMatchObject({ opacity: 0, originX: 0, originY: 0 });
  expect(result.animations).toMatchObject({ opacity: { target: 1 }, originX: 0, originY: 0 });
});

test('removed cards fade, while old copies of retained reparented cards disappear immediately', () => {
  const control = state();
  expect(searchCardExiting(23, control)({} as ExitAnimationsValues)).toMatchObject({
    initialValues: { opacity: 1 }, animations: { opacity: { target: 0 } },
  });
  expect(searchCardExiting(0, control)({} as ExitAnimationsValues)).toMatchObject({
    initialValues: { opacity: 0 }, animations: { opacity: 0 },
  });
});

test('initial mount and expired or disabled transitions render immediately without entry effects', () => {
  const control = { value: { deadline: 0, ids: [0] } };
  expect(searchCardEntering(undefined, control)(target)).toMatchObject({ initialValues: { opacity: 1 }, animations: { opacity: 1 } });
  const values = { ...target, currentOriginX: 0, currentOriginY: 300 } as LayoutAnimationsValues;
  expect(searchRowLayout(control)(values).animations).toMatchObject({ originY: 0 });
});

test('unchanged rows move to their new position while native target sizes apply directly', () => {
  const values = { ...target, currentOriginX: 0, currentOriginY: 300 } as LayoutAnimationsValues;
  const result = searchRowLayout(state())(values);
  expect(result.initialValues).toMatchObject({ originY: 300, width: 158, height: 270 });
  expect(result.animations).toMatchObject({ originY: { target: 0 }, width: 158, height: 270 });
});

test('active native timing settles at its target when motion is disabled after it starts', () => {
  const control = state();
  const result = searchRowLayout(control)({ ...target, currentOriginX: 0, currentOriginY: 300 } as LayoutAnimationsValues);
  const y = result.animations.originY as unknown as { current: number; onFrame: (animation: unknown, now: number) => boolean };
  control.value = { deadline: 0, ids: [0] };
  expect(y.onFrame(y, 16)).toBe(true);
  expect(y.current).toBe(0);
});
