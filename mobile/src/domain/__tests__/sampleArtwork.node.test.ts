import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleDeck } from '../../decks/sample.ts';
import { alternateDeck } from '../../decks/alternate.ts';
import { validateDeck } from '../deck.ts';
import { assetKeys, assetCatalog } from '../../decks/assetCatalog.ts';
import { validateAssetFiles, validateArtworkFiles } from '../../../scripts/validate-decks.ts';

test('the testing deck exercises the same mixed layer contract on its back and all20 fronts', async () => {
  const deck = validateDeck(sampleDeck, assetKeys);
  assert.equal(Object.keys(deck.artwork?.assets ?? {}).length, 21);
  for (const key of [deck.backAsset, ...deck.cards.map(card => card.faceAsset)]) {
    const definition = deck.artwork!.assets[key];
    assert.ok(definition.layers.some(layer => !layer.tint), `${key} needs fixed regions`);
    assert.deepEqual(new Set(definition.layers.flatMap(layer => layer.tint ? [layer.tint.role] : [])), new Set(['background', 'accent']));
  }
  const sizes = await validateAssetFiles(assetCatalog, new URL('../../../', import.meta.url));
  validateArtworkFiles([deck], sizes);
  assert.equal(validateDeck(alternateDeck, assetKeys).artwork, undefined);
});
