import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleDeck } from '../../../decks/sample.ts';
import { filterCardsByName, normalizeCardQuery } from '../cardNameSearch.ts';

test('blank searches return the original list and nonblank searches preserve order, objects and data', () => {
  const cards = sampleDeck.cards, before = structuredClone(cards);
  assert.equal(filterCardsByName(cards, 'en', ' \t '), cards);
  const matches = filterCardsByName(cards, 'en', 'r');
  assert.deepEqual(matches.map(card => card.id), [7, 23, 35, 48, 64, 99, 139, 152, 166, 198, 219, 234]);
  for (const card of matches) assert.equal(card, cards.find(original => original.id === card.id));
  assert.deepEqual(cards, before);
});

test('matching ignores Czech case, composed/decomposed accents and repeated whitespace', () => {
  assert.equal(normalizeCardQuery('  ŘEKA\t  RÁNO  '), 'reka rano');
  assert.deepEqual(filterCardsByName(sampleDeck.cards, 'cs', 'REKA').map(card => card.id), [139]);
  assert.deepEqual(filterCardsByName(sampleDeck.cards, 'cs', 'me\u030csi\u0301c').map(card => card.id), [104]);
  assert.deepEqual(filterCardsByName(sampleDeck.cards, 'cs', '  otevrena   brana ').map(card => card.id), [185]);
  assert.deepEqual(filterCardsByName(sampleDeck.cards, 'en', '  OPEN   GATE ').map(card => card.id), [185]);
});

test('only the displayed language name matches, never a description or regex syntax', () => {
  assert.deepEqual(filterCardsByName(sampleDeck.cards, 'en', 'reka'), []);
  assert.deepEqual(filterCardsByName(sampleDeck.cards, 'cs', 'river'), []);
  assert.deepEqual(filterCardsByName(sampleDeck.cards, 'en', 'needs care'), []);
  assert.deepEqual(filterCardsByName(sampleDeck.cards, 'en', '.*'), []);
  assert.deepEqual(filterCardsByName(sampleDeck.cards, 'en', '['), []);
  assert.deepEqual(filterCardsByName(sampleDeck.cards, 'en', 'gate').map(card => card.id), [185]);
});
