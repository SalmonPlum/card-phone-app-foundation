import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateThemeResource } from '../src/themes/validateThemeResource.ts';
import { validateFontReferences, type FontFace } from '../src/themes/typography.ts';
import { inspectFont } from './font-file.ts';
import { cs } from '../src/i18n/cs.ts';
import { en } from '../src/i18n/en.ts';
import { sampleDeck } from '../src/decks/sample.ts';
import { alternateDeck } from '../src/decks/alternate.ts';

const root = new URL('../', import.meta.url);
const resource = validateThemeResource(JSON.parse(readFileSync(new URL('src/themes/resource.json', root), 'utf8')));
const catalog = JSON.parse(readFileSync(new URL('src/themes/fontCatalog.json', root), 'utf8')).fonts as FontFace[];
validateFontReferences(resource, catalog);

function strings(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return Object.values(value).map(strings).join('');
  return '';
}
const alphabet = 'ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž…—–“”‘’';
const required = new Set([...alphabet + strings([cs, en, sampleDeck, alternateDeck, resource])]
  .filter(char => !/\s/.test(char)).map(char => char.codePointAt(0)!));

// Compare the authoring catalog with Metro's literal registry, as with deck images.
const registry = readFileSync(new URL('src/themes/fontAssets.ts', root), 'utf8');
const entries = [...registry.matchAll(/'([^']+)': require\('\.\.\/\.\.\/([^']+)'\)/g)];
if (entries.length !== catalog.length) throw new Error('Font registry/catalog count differs');
for (const font of catalog) {
  if (!/^assets\/fonts\/[a-z0-9-]+\/[A-Za-z0-9_.-]+\.ttf$/.test(font.path)) throw new Error(`Invalid font path: ${font.path}`);
  if (!/^assets\/fonts\/[a-z0-9-]+\/OFL\.txt$/.test(font.licensePath)) throw new Error(`Invalid license path: ${font.licensePath}`);
  if (!entries.some(entry => entry[1] === font.alias && entry[2] === font.path)) throw new Error(`Unregistered font: ${font.alias}`);
  const bytes = readFileSync(new URL(font.path, root));
  if (createHash('sha256').update(bytes).digest('hex') !== font.sha256) throw new Error(`Font checksum differs: ${font.path}`);
  if (!/SIL OPEN FONT LICENSE/i.test(readFileSync(new URL(font.licensePath, root), 'utf8'))) throw new Error(`Missing font license: ${font.alias}`);
  const info = inspectFont(bytes);
  if (info.variable || info.weight !== Number(font.weight)) throw new Error(`Unexpected font weight/format: ${font.alias}`);
  for (const cp of required) if (!info.codepoints.has(cp)) throw new Error(`${font.alias} lacks ${String.fromCodePoint(cp)}`);
}
console.log(`Validated ${resource.themes.length} themes, ${catalog.length} offline static faces, licenses/checksums, literal registry and ${required.size} Czech/English characters per face.`);
