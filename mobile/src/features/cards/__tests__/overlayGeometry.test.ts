import { fitForegroundRect, toLocalRect } from '../overlayGeometry';

test('converts the measured face to its host coordinate space', () => {
  expect(toLocalRect({ x: 26, y: 200, width: 158, height: 237.66 }, { x: 10, y: 24, width: 360, height: 800 }))
    .toEqual({ x: 16, y: 176, width: 158, height: 237.66 });
});
test.each([0, -1, NaN, Infinity])('rejects unusable face and host dimensions: %s', dimension => {
  const rect = { x: 10, y: 24, width: 360, height: 800 };
  expect(toLocalRect({ ...rect, width: dimension }, rect)).toBeNull();
  expect(toLocalRect(rect, { ...rect, height: dimension })).toBeNull();
  expect(toLocalRect({ ...rect, x: NaN }, rect)).toBeNull();
});
test.each([
  [320, 480, 44, 34], [360, 800, 24, 16], [900, 1400, 60, 40],
])('fits complete artwork and reserves controls in %sx%s', (width, height, top, bottom) => {
  const face = fitForegroundRect({ width, height }, 238 / 358, top, bottom);
  expect(face.width / face.height).toBeCloseTo(238 / 358);
  expect(face.x).toBeGreaterThanOrEqual(16);
  expect(face.x + face.width).toBeLessThanOrEqual(width - 16);
  expect(face.y).toBeGreaterThanOrEqual(top + 48 + 16);
  expect(face.height).toBeLessThanOrEqual((height - top - bottom) * .6);
  expect(face.y + face.height).toBeLessThan(height - bottom);
  expect(face.x + face.width / 2).toBeCloseTo(width / 2);
});
