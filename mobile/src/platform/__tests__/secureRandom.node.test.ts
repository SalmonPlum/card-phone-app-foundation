import test from 'node:test';
import assert from 'node:assert/strict';
import { createSecureRandomSource } from '../secureRandomCore.ts';

test('secure adapter requests a fresh Uint32Array sample on every call and preserves unsigned values', () => {
  const buffers: Uint32Array[] = [];
  const source = createSecureRandomSource({ getRandomValues(array) {
    assert.ok(array instanceof Uint32Array); assert.equal(array.length, 1); buffers.push(array); array[0] = buffers.length === 1 ? 0xffffffff : 7; return array;
  } });
  const previousRandom = Math.random; Math.random = () => { throw new Error('Insecure fallback used'); };
  try { assert.equal(source.nextUint32(), 0xffffffff); assert.equal(source.nextUint32(), 7); assert.notEqual(buffers[0], buffers[1]); }
  finally { Math.random = previousRandom; }
});
test('secure adapter propagates native entropy errors without fallback', () => {
  const failure = new Error('Native crypto unavailable');
  const source = createSecureRandomSource({ getRandomValues() { throw failure; } });
  const previousRandom = Math.random; Math.random = () => { throw new Error('Insecure fallback used'); };
  try { assert.throws(() => source.nextUint32(), error => error === failure); } finally { Math.random = previousRandom; }
});
