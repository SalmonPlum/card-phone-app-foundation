import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inspectFont } from '../../../scripts/font-file.ts';
import type { FontFace } from '../typography.ts';

const root = new URL('../../../', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('../fontCatalog.json', import.meta.url), 'utf8')).fonts as FontFace[];
const required = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž.,:;!?/(){}…—–“”‘’';

test('every bundled static face has the declared weight, checksum, license and complete Czech/English glyphs', () => {
  for (const font of catalog) {
    const bytes = readFileSync(new URL(font.path, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), font.sha256, font.alias);
    assert.match(readFileSync(new URL(font.licensePath, root), 'utf8'), /SIL OPEN FONT LICENSE/i);
    const info = inspectFont(bytes);
    assert.equal(info.weight, Number(font.weight), font.alias);
    assert.equal(info.variable, false, font.alias);
    for (const char of required) assert.ok(info.codepoints.has(char.codePointAt(0)!), `${font.alias} lacks ${char}`);
  }
});

test('font inspection rejects corrupt or unsupported files instead of accepting a download error as a font', () => {
  assert.throws(() => inspectFont(new TextEncoder().encode('<html>not a font</html>')), /font/);
  assert.throws(() => inspectFont(new Uint8Array([0, 1, 0, 0])), /font/);
});

test('font inspection exposes the shipped font metrics needed to prevent clipped line boxes', () => {
  const noto = catalog.find(font => font.alias === 'Theme_NotoSerif_400')!;
  const metrics = inspectFont(readFileSync(new URL(noto.path, root))).metrics;
  assert.deepEqual(metrics, {
    unitsPerEm: 1000, capHeight: 714, xHeight: 536,
    ascent: 1069, descent: 293, winAscent: 1069, winDescent: 389,
  });
});
