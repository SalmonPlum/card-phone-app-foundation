import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleDeck } from '../../decks/sample.ts';
import { alternateDeck } from '../../decks/alternate.ts';
import { assetKeys } from '../../decks/assetCatalog.ts';
import { validateDeck } from '../deck.ts';

test('both shipped packages validate against bundled asset keys', () => {
  assert.equal(validateDeck(sampleDeck, assetKeys).cards.length, 8);
  assert.deepEqual(validateDeck(alternateDeck, assetKeys).cards.map(card => card.id), [0, 7, 99]);
});
