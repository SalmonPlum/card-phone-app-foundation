import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateAssetFiles, validateAssetRatios, validateStaticRegistry } from '../../../scripts/validate-decks.ts';
import { assetCatalog } from '../../decks/assetCatalog.ts';
import { sampleDeck } from '../../decks/sample.ts';
import { alternateDeck } from '../../decks/alternate.ts';
import type { DeckManifest } from '../contracts.ts';

const root = new URL('../../../', import.meta.url);
test('all registered files are local PNGs and all bundled cards share the deck aspect ratio', async () => {
  const sizes = await validateAssetFiles(assetCatalog, root);
  assert.deepEqual(sizes.get('sample.seed'), { width: 600, height: 900 });
  assert.doesNotThrow(() => validateAssetRatios([sampleDeck, alternateDeck], sizes));
});
test('missing files and non-PNG files are rejected', async () => {
  await assert.rejects(validateAssetFiles({ missing: 'assets/decks/does-not-exist.png' }, root), /missing/);
  await assert.rejects(validateAssetFiles({ invalid: 'package.json' }, root), /PNG/);
});
test('mismatched shared or localized image aspect ratios are rejected', () => {
  const sizes = new Map(Object.keys(assetCatalog).map(key => [key, { width: 600, height: 900 }]));
  sizes.set('sample.seed', { width: 900, height: 600 });
  assert.throws(() => validateAssetRatios([sampleDeck], sizes), /aspect ratio/);
  const deck: DeckManifest = structuredClone(sampleDeck); deck.cards[0].translations.cs.faceAsset = 'localized';
  sizes.set('sample.seed', { width: 600, height: 900 }); sizes.set('localized', { width: 700, height: 900 });
  assert.throws(() => validateAssetRatios([deck], sizes), /aspect ratio/);
});
test('static Metro registry and Node metadata agree on every key and literal path', async () => {
  const source = await readFile(new URL('src/decks/assets.ts', root), 'utf8');
  await assert.doesNotReject(validateStaticRegistry(assetCatalog, source));
  await assert.rejects(validateStaticRegistry({ ...assetCatalog, extra: 'extra.png' }, source), /registry/);
  await assert.rejects(validateStaticRegistry(assetCatalog, source.replace('sample/seed.png', 'sample/missing.png')), /registry/);
});
