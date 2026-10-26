import test from 'node:test';
import assert from 'node:assert/strict';
import { randomInt, shuffleIds } from '../random.ts';
import { scripted } from './fixtures.ts';

test('rejects biased tail before returning a sample', () => {
  const source = scripted([0xffffffff, 5]); assert.equal(randomInt(3, source), 2); assert.equal(source.consumed(), 2);
});
test('bound one needs no entropy', () => { const source = scripted([]); assert.equal(randomInt(1, source), 0); assert.equal(source.consumed(), 0); });
test('handles rejection boundary and full uint32 range', () => {
  const source = scripted([0xfffffffc, 0xfffffffb]); assert.equal(randomInt(6, source), 5); assert.equal(source.consumed(), 2);
  assert.equal(randomInt(0x100000000, scripted([0xffffffff])), 0xffffffff);
});
test('rejects invalid bounds before entropy consumption', () => {
  for (const n of [0, -1, 1.5, NaN, Infinity, 0x100000001, Number.MAX_SAFE_INTEGER]) assert.throws(() => randomInt(n, scripted([])), /bound/i);
});
test('rejects non-uint32 entropy rather than silently biasing results', () => {
  for (const word of [-1, 0x100000000, 0.5, NaN, Infinity]) assert.throws(() => randomInt(3, scripted([word])), /uint32/i);
});
test('Fisher–Yates swaps downward and leaves its input intact', () => {
  const ids = Object.freeze([0, 7, 99]); assert.deepEqual(shuffleIds(ids, scripted([0, 0])), [7, 99, 0]); assert.deepEqual(ids, [0, 7, 99]);
});
test('three-card choice enumeration produces every permutation exactly once', () => {
  const results: string[] = [];
  for (const first of [0, 1, 2]) for (const second of [0, 1]) results.push(shuffleIds([0, 7, 99], scripted([first, second])).join(','));
  assert.deepEqual(results.sort(), ['0,7,99', '0,99,7', '7,0,99', '7,99,0', '99,0,7', '99,7,0'].sort());
});
test('empty and single-card inputs need no samples; subsequent calls consume fresh samples', () => {
  assert.deepEqual(shuffleIds([], scripted([])), []); assert.deepEqual(shuffleIds([7], scripted([])), [7]);
  const source = scripted([1, 0, 2]); shuffleIds([0, 7, 99], source); assert.equal(randomInt(3, source), 2); assert.equal(source.consumed(), 3);
});
