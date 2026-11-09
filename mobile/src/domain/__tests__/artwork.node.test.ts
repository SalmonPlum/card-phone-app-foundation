import test from 'node:test';
import assert from 'node:assert/strict';
import { validateArtwork, resolveArtworkLayers } from '../artwork.ts';
import { validateDeck, localizeBackAsset, localizeCard } from '../deck.ts';
import { deckFixture, fixtureAssetKeys } from './fixtures.ts';

const keys = new Set([...fixtureAssetKeys, 'paper', 'mask']);
function resource() {
  return { schemaVersion: 1, assets: { back: { width: 600, height: 900, layers: [
    { id: 'paper', asset: 'paper' },
    { id: 'field', asset: 'mask', tint: { role: 'background', fallback: '#28554a' }, opacity: .4 },
  ] } } };
}
test('validates layered resources without mutation and resolves named colors without recoloring fixed layers', () => {
  const input = resource(), before = structuredClone(input);
  const parsed = validateArtwork(input, keys);
  assert.ok(Object.is(parsed, input)); assert.deepEqual(input, before);
  assert.deepEqual(resolveArtworkLayers(parsed.assets.back, { background: '#101010', accent: '#abcdef' }), [
    { id: 'paper', asset: 'paper', opacity: 1 },
    { id: 'field', asset: 'mask', opacity: .4, tintColor: '#101010' },
  ]);
  assert.equal(resolveArtworkLayers(parsed.assets.back, {})[1].tintColor, '#28554a');
});

test('deck validation checks optional artwork and keeps locale selection on logical keys', () => {
  const deck = Object.assign(deckFixture(), { artwork: resource() });
  deck.localizedBackAssets = { cs: 'cs-back' };
  deck.cards[0].translations.cs.faceAsset = 'cs-face';
  const parsed = validateDeck(deck, keys);
  assert.equal(parsed.artwork, deck.artwork);
  assert.equal(localizeBackAsset(parsed, 'cs'), 'cs-back');
  assert.equal(localizeCard(parsed.cards[0], 'cs').faceAsset, 'cs-face');
  const bad = structuredClone(deck); bad.artwork.assets.back.layers[1].tint!.role = 'unknown';
  assert.throws(() => validateDeck(bad, keys), /artwork.*role/);
});

const cases: [string, (value: ReturnType<typeof resource>) => void, RegExp][] = [
  ['version', value => { value.schemaVersion = 2; }, /schemaVersion/],
  ['missing fallback key', value => { Object.assign(value.assets, { missing: value.assets.back }); }, /assets.*missing/],
  ['width', value => { value.assets.back.width = 0; }, /width/],
  ['fractional height', value => { value.assets.back.height = 900.5; }, /height/],
  ['unsafe width', value => { value.assets.back.width = Number.MAX_SAFE_INTEGER + 1; }, /width/],
  ['no layers', value => { value.assets.back.layers = []; }, /layers/],
  ['too many layers', value => { value.assets.back.layers = Array.from({ length: 9 }, (_, i) => ({ id: `layer-${i}`, asset: 'mask' })); }, /layers/],
  ['duplicate layer ID', value => { value.assets.back.layers[1].id = 'paper'; }, /id/],
  ['blank ID', value => { value.assets.back.layers[0].id = ' '; }, /id/],
  ['missing raw image', value => { value.assets.back.layers[0].asset = 'absent'; }, /asset/],
  ['unknown role', value => { value.assets.back.layers[1].tint!.role = 'primary'; }, /role/],
  ['bad fallback color', value => { value.assets.back.layers[1].tint!.fallback = 'red'; }, /fallback/],
  ['invalid opacity', value => { value.assets.back.layers[1].opacity = NaN; }, /opacity/],
  ['opacity outside range', value => { value.assets.back.layers[1].opacity = 1.01; }, /opacity/],
];
for (const [name, change, path] of cases) test(`rejects malformed artwork: ${name}`, () => {
  const value = resource(); change(value); assert.throws(() => validateArtwork(value, keys), path);
});
test('layer sources reference raw PNGs rather than recursively resolving composed definitions', () => {
  const value = resource(); value.assets.back.layers = [{ id: 'raw-back', asset: 'back' }];
  const parsed = validateArtwork(value, keys);
  assert.deepEqual(resolveArtworkLayers(parsed.assets.back, {}), [{ id: 'raw-back', asset: 'back', opacity: 1 }]);
});
test('fixed packs remain valid and definitions may consist entirely of theme masks', () => {
  assert.equal(validateDeck(deckFixture(), keys).artwork, undefined);
  const value = resource(); value.assets.back.layers = [value.assets.back.layers[1]];
  assert.equal(validateArtwork(value, keys).assets.back.layers.length, 1);
});
