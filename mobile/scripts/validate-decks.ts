import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import type { DeckManifest } from '../src/domain/contracts.ts';
import { bundledDecks } from '../src/decks/index.ts';
import { assetCatalog, assetKeys } from '../src/decks/assetCatalog.ts';
import { validateDeck } from '../src/domain/deck.ts';
import { cs } from '../src/i18n/cs.ts';
import { en } from '../src/i18n/en.ts';

type ImageSize = { width: number; height: number; hasAlpha?: boolean };
const root = new URL('../', import.meta.url);

export async function validateAssetFiles(catalog: Readonly<Record<string, string>>, projectRoot: URL): Promise<ReadonlyMap<string, ImageSize>> {
  const sizes = new Map<string, ImageSize>();
  for (const [key, path] of Object.entries(catalog)) {
    let bytes: Buffer;
    try { bytes = await readFile(new URL(path, projectRoot)); }
    catch (error) { throw new Error(`Asset ${key}: missing file ${path}`, { cause: error }); }
    if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.subarray(12, 16).toString() !== 'IHDR') {
      throw new Error(`Asset ${key}: expected a PNG with an IHDR header`);
    }
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    if (width === 0 || height === 0) throw new Error(`Asset ${key}: PNG dimensions must be positive`);
    let hasAlpha = bytes[25] === 4 || bytes[25] === 6;
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = bytes.readUInt32BE(offset);
      if (bytes.subarray(offset + 4, offset + 8).toString() === 'tRNS') hasAlpha = true;
      offset += length + 12;
    }
    sizes.set(key, { width, height, hasAlpha });
  }
  return sizes;
}

export function validateAssetRatios(decks: readonly DeckManifest[], sizes: ReadonlyMap<string, ImageSize>): void {
  for (const deck of decks) {
    const keys = [deck.backAsset, ...Object.values(deck.localizedBackAssets ?? {}), ...deck.cards.flatMap(card => [card.faceAsset, ...Object.values(card.translations).flatMap(value => value.faceAsset ? [value.faceAsset] : [])])];
    const base = sizes.get(deck.backAsset);
    if (!base) throw new Error(`${deck.id}: missing back asset dimensions`);
    for (const key of keys) {
      const size = sizes.get(key);
      if (!size || size.width * base.height !== base.width * size.height) throw new Error(`${deck.id}: asset ${key} has a different aspect ratio from its back`);
    }
  }
}

export function validateArtworkFiles(decks: readonly DeckManifest[], sizes: ReadonlyMap<string, ImageSize>): void {
  for (const deck of decks) for (const [key, definition] of Object.entries(deck.artwork?.assets ?? {})) {
    const sameSize = (asset: string) => {
      const size = sizes.get(asset);
      if (!size || size.width !== definition.width || size.height !== definition.height) throw new Error(`${deck.id}.artwork.${key}: ${asset} dimensions differ from declared canvas`);
      return size;
    };
    sameSize(key);
    for (const layer of definition.layers) {
      const size = sameSize(layer.asset);
      if (layer.tint && !size.hasAlpha) throw new Error(`${deck.id}.artwork.${key}.${layer.id}: tint masks require PNG alpha support`);
    }
  }
}

/** Audit the small literal-only Metro registry without attempting to execute PNG requires. */
export async function validateStaticRegistry(catalog: Readonly<Record<string, string>>, source: string): Promise<void> {
  const literals = [...source.matchAll(/'([^']+)'\s*:\s*require\('\.\.\/\.\.\/([^']+)'\)/g)];
  const entries = new Map(literals.map(match => [match[1], match[2]]));
  if (entries.size !== literals.length || entries.size !== Object.keys(catalog).length || Object.entries(catalog).some(([key, path]) => entries.get(key) !== path)) {
    throw new Error('Static asset registry must match every catalog key and literal path');
  }
}

async function pngPaths(directory: string): Promise<string[]> {
  const entries = await readdir(new URL(directory, root), { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? pngPaths(`${directory}/${entry.name}`) : entry.name.endsWith('.png') ? [`${directory}/${entry.name}`] : []));
  return nested.flat().sort();
}

async function main(): Promise<void> {
  const decks = Object.values(bundledDecks);
  for (const deck of decks) validateDeck(deck, assetKeys);
  const sizes = await validateAssetFiles(assetCatalog, root);
  validateAssetRatios(decks, sizes);
  validateArtworkFiles(decks, sizes);
  await validateStaticRegistry(assetCatalog, await readFile(new URL('src/decks/assets.ts', root), 'utf8'));
  const expectedFiles = Object.values(assetCatalog).sort();
  if (JSON.stringify(await pngPaths('assets/decks')) !== JSON.stringify(expectedFiles)) throw new Error('Unregistered or missing PNG in assets/decks');
  if (JSON.stringify(Object.keys(cs).sort()) !== JSON.stringify(Object.keys(en).sort())) throw new Error('Czech/English interface dictionaries have different keys');
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    if (!cs[key].trim() || !en[key].trim()) throw new Error(`Blank interface translation: ${key}`);
    if (JSON.stringify(cs[key].match(/\{\w+\}/g)) !== JSON.stringify(en[key].match(/\{\w+\}/g))) throw new Error(`Different interpolation fields: ${key}`);
  }
  for (const deck of decks) console.log(`Validated ${deck.id}@${deck.version}: ${deck.cards.length} cards, complete cs/en text, matching image aspect ratios`);
  console.log(`Validated ${sizes.size} local PNG assets and ${Object.keys(en).length} interface translations per locale; static registry matches.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
