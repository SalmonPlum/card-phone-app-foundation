import { compactFaceRect, fitForegroundRect, readingFaceRect, toLocalRect } from '../overlayGeometry';

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

test('measured wrapped header leaves bounded artwork and useful text room on a short host',()=>{
  const face=fitForegroundRect({width:280,height:480},2/3,24,16,136);
  expect(face.y).toBeGreaterThanOrEqual(24+136+12);
  expect(face.y+face.height).toBeLessThan(480-16-80);
  expect(face.width/face.height).toBeCloseTo(2/3);
});


test('scroll shrinks the pinned face without changing ratio, oversizing or leaving a tall blank band',()=>{
  const expanded={x:30,y:120,width:240,height:360};
  const face=readingFaceRect(expanded,100);
  expect(face.height).toBe(260);
  expect(face.width/face.height).toBeCloseTo(2/3);
  expect(face.y).toBe(120);
  expect(face.x+face.width/2).toBe(150);
  expect(readingFaceRect(expanded,-50)).toEqual(expanded);
  expect(readingFaceRect(expanded,0)).toEqual(expanded);
  expect(compactFaceRect(expanded).height).toBe(112);
  expect(readingFaceRect(expanded,10000)).toEqual(compactFaceRect(expanded));
  expect(compactFaceRect({...expanded,width:80,height:120}).height).toBe(60);
});
