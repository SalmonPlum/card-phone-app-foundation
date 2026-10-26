import assert from 'node:assert/strict';
import test from 'node:test';
import { choosePacketSize } from '../shuffle.ts';
import { scripted } from './fixtures.ts';

test('packet sampling reaches each small packet size without consuming ordering entropy', () => {
  const source = scripted([0, 1, 2]);
  assert.deepEqual([choosePacketSize(100, 100, true, source), choosePacketSize(100, 100, true, source), choosePacketSize(100, 100, true, source)], [1, 2, 3]);
  assert.equal(source.consumed(), 3);
});

test('packet bounds shrink with remaining/source counts and preserve the initial source', () => {
  assert.equal(choosePacketSize(2, 100, true, scripted([])), 1);
  assert.equal(choosePacketSize(2, 100, false, scripted([1])), 2);
  assert.equal(choosePacketSize(8, 8, true, scripted([2])), 3);
  assert.equal(choosePacketSize(2, 2, true, scripted([])), 1);
  assert.equal(choosePacketSize(1, 1, true, scripted([])), 1);
  assert.equal(choosePacketSize(1, 100, false, scripted([])), 1);
});

test('invalid counts fail before requesting entropy', () => {
  for (const [sourceCount, remainingCount] of [[0, 1], [1, 0], [-1, 8], [2, 1], [1.5, 8], [1, NaN], [Infinity, Infinity], [1, Number.MAX_SAFE_INTEGER + 1]]) {
    assert.throws(() => choosePacketSize(sourceCount, remainingCount, true, scripted([])), RangeError);
  }
});
