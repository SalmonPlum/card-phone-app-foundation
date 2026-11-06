import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDeck, localizeCard, localizeBackAsset } from '../deck.ts';
import { deckFixture, fixtureAssetKeys, oneCardDeck, twoCardDeck, hundredCardDeck } from './fixtures.ts';

test('accepts nonconsecutive numeric IDs including zero and preserves catalogue order', () => {
  const input = deckFixture(); input.cards.forEach((card, i) => { card.id = [0, 7, 99][i]; });
  assert.deepEqual(validateDeck(input, fixtureAssetKeys).cards.map(card => card.id), [0, 7, 99]);
});
test('accepts one, two and one hundred cards', () => {
  for (const deck of [oneCardDeck, twoCardDeck, hundredCardDeck]) assert.equal(validateDeck(deck, fixtureAssetKeys).cards.length, deck.cards.length);
});
for (const id of ['7', 1.5, -1, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, null]) {
  test(`rejects invalid numeric card ID ${String(id)}`, () => {
    const input = deckFixture() as unknown as { cards: { id: unknown }[] }; input.cards[0].id = id;
    assert.throws(() => validateDeck(input, fixtureAssetKeys), /cards\[0\]\.id/);
  });
}
test('rejects duplicate IDs, empty decks and decks outside the supported 1–100 range', () => {
  const duplicate = deckFixture(); duplicate.cards[1].id = 0;
  assert.throws(() => validateDeck(duplicate, fixtureAssetKeys), /duplicate/i);
  for (const count of [0, 101]) assert.throws(() => validateDeck(deckFixture(count), fixtureAssetKeys), /cards/);
});
test('rejects malformed manifests and missing required deck metadata', () => {
  for (const value of [null, [], {}, { ...deckFixture(), schemaVersion: 3 }, { ...deckFixture(), id: ' ' }, { ...deckFixture(), version: '' }, { ...deckFixture(), name: { en: 'Name' } }]) {
    assert.throws(() => validateDeck(value, fixtureAssetKeys));
  }
});
for (const locale of ['cs', 'en'] as const) {
  for (const field of ['name', 'meaning', 'description'] as const) {
    test(`rejects missing or blank ${locale} ${field}`, () => {
      for (const value of [undefined, '', ' \n ']) {
        const input = deckFixture(); if(field==='name') Object.assign(input.cards[0].translations[locale],{name:value});
        else Object.assign(input.cards[0].translations[locale].sections,{[field]:value});
        assert.throws(() => validateDeck(input, fixtureAssetKeys), new RegExp(`translations.${locale}.${field==='name'?'':'sections.'}${field}`));
      }
    });
  }
  test(`rejects missing ${locale} card translation`, () => {
    const input = deckFixture(); delete (input.cards[0].translations as Partial<typeof input.cards[0]['translations']>)[locale];
    assert.throws(() => validateDeck(input, fixtureAssetKeys), /translations/);
  });
}
test('validates shared and localized face/back asset references', () => {
  for (const mutate of [
    (d: ReturnType<typeof deckFixture>) => { d.backAsset = 'missing'; },
    (d: ReturnType<typeof deckFixture>) => { d.cards[0].faceAsset = 'missing'; },
    (d: ReturnType<typeof deckFixture>) => { d.localizedBackAssets = { cs: 'missing' }; },
    (d: ReturnType<typeof deckFixture>) => { d.cards[0].translations.en.faceAsset = 'missing'; },
  ]) { const deck = deckFixture(); mutate(deck); assert.throws(() => validateDeck(deck, fixtureAssetKeys), /asset/i); }
});
test('localized presentation preserves identity and uses overrides with shared fallbacks', () => {
  const deck = deckFixture(); deck.cards[0].id = 99;
  deck.cards[0].translations.cs.faceAsset = 'cs-face'; deck.localizedBackAssets = { cs: 'cs-back' };
  validateDeck(deck, fixtureAssetKeys);
  assert.deepEqual(localizeCard(deck.cards[0], 'cs'), { id: 99, name: 'Karta 0', sections:{meaning: 'Význam', description: 'Český popis.'}, faceAsset: 'cs-face' });
  assert.equal(localizeCard(deck.cards[0], 'en').faceAsset, 'face');
  assert.equal(localizeBackAsset(deck, 'cs'), 'cs-back'); assert.equal(localizeBackAsset(deck, 'en'), 'back');
});
