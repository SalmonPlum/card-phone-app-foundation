import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleDeck } from '../../decks/sample.ts';
import { alternateDeck } from '../../decks/alternate.ts';
import { assetKeys } from '../../decks/assetCatalog.ts';
import { validateDeck } from '../deck.ts';

test('both shipped packages validate against bundled asset keys', () => {
  const expanded = validateDeck(sampleDeck, assetKeys);
  assert.equal(expanded.cards.length, 20);
  assert.deepEqual(expanded.cards.slice(0, 8).map(card => card.id), [0, 7, 12, 23, 35, 48, 64, 99]);
  assert.equal(new Set(expanded.cards.map(card => card.faceAsset)).size, 20);
  assert.deepEqual(validateDeck(alternateDeck, assetKeys).cards.map(card => card.id), [0, 7, 99]);
});
