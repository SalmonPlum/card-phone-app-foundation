import test from 'node:test';
import assert from 'node:assert/strict';
import { validateArtworkFiles } from '../../../scripts/validate-decks.ts';
import { deckFixture } from './fixtures.ts';
import type { DeckManifest } from '../contracts.ts';
function deck(): DeckManifest {
  return { ...deckFixture(), artwork: { schemaVersion: 1, assets: { back: {
    width: 600, height: 900, layers: [{ id: 'mask', asset: 'mask', tint: { role: 'accent', fallback: '#bb9957' } }],
  } } } };
}
function sizes() { return new Map([['back', { width: 600, height: 900, hasAlpha: false }], ['mask', { width: 600, height: 900, hasAlpha: true }]]); }
test('validates exact fallback/layer dimensions and explicit tint-source alpha', () => {
  validateArtworkFiles([deck()], sizes());
  for (const key of ['back', 'mask']) {
    const wrong = sizes(); wrong.set(key, { width: 300, height: 450, hasAlpha: true });
    assert.throws(() => validateArtworkFiles([deck()], wrong), /dimensions/);
  }
  const opaque = sizes(); opaque.set('mask', { width: 600, height: 900, hasAlpha: false });
  assert.throws(() => validateArtworkFiles([deck()], opaque), /alpha/);
  const absent = sizes(); absent.delete('mask');
  assert.throws(() => validateArtworkFiles([deck()], absent), /dimensions/);
});
test('fixed artwork may be opaque and fixed packs require no layered resources', () => {
  const value = deck(); delete value.artwork!.assets.back.layers[0].tint;
  const opaque = sizes(); opaque.set('mask', { width: 600, height: 900, hasAlpha: false });
  validateArtworkFiles([value], opaque); validateArtworkFiles([deckFixture()], new Map());
});
