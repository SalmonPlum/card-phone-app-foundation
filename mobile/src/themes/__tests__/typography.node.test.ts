import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateThemeResource } from '../validateThemeResource.ts';
import { resolveThemeTypography, validateFontReferences, type FontFace } from '../typography.ts';
import { inspectFont } from '../../../scripts/font-file.ts';

const resource = validateThemeResource(JSON.parse(readFileSync(new URL('../resource.json', import.meta.url), 'utf8')));
const catalog = JSON.parse(readFileSync(new URL('../fontCatalog.json', import.meta.url), 'utf8')).fonts as FontFace[];
const fallback = { serif: 'serif', sans: 'sans-serif' };

test('shipped themes match visible text sizes by role and reserve complete native font bounds', () => {
  const root = new URL('../../../', import.meta.url);
  const reference = resource.themes[0];
  for (const [role, referenceStyle] of Object.entries(reference.typography)) {
    const sizes = [];
    for (const theme of resource.themes) {
      const style = theme.typography[role as keyof typeof theme.typography];
      const font = catalog.find(font => font.family === style.fontFamily && font.weight === style.fontWeight)!;
      const { metrics } = inspectFont(readFileSync(new URL(font.path, root)));
      const height = ['title', 'cardTitle', 'sectionHeading'].includes(role) ? metrics.capHeight : metrics.xHeight;
      sizes.push(style.fontSize * height / metrics.unitsPerEm);
      const naturalHeight = Math.max(metrics.ascent + metrics.descent, metrics.winAscent + metrics.winDescent);
      assert.ok(style.lineHeight >= Math.ceil(style.fontSize * naturalHeight / metrics.unitsPerEm), `${theme.id}.${role} clips native font bounds`);
      assert.equal(style.lineHeight, referenceStyle.lineHeight, `${role} line spacing differs across themes`);
    }
    assert.ok(Math.max(...sizes) - Math.min(...sizes) < 0.02, `${role} visible sizes differ: ${sizes}`);
  }
});

test('resolves actual family/weight aliases and all numeric resource metrics without synthesizing font weights', () => {
  validateFontReferences(resource, catalog);
  const [, midnight, ochre] = resource.themes;
  const night = resolveThemeTypography(midnight, catalog, true, fallback);
  assert.deepEqual(night.cardTitle, { fontFamily: 'Theme_NotoSerif_400', fontWeight: 'normal', fontSize: 29.13, lineHeight: 48, letterSpacing: -.32 });
  assert.equal(night.sectionHeading.fontFamily, 'Theme_NotoSerif_500');
  assert.equal(night.body.fontFamily, 'Theme_Manrope_400');
  assert.equal(night.label.fontFamily, 'Theme_SpaceGrotesk_600');
  const warm = resolveThemeTypography(ochre, catalog, true, fallback);
  assert.equal(warm.cardTitle.fontFamily, 'Theme_Literata_600');
  assert.equal(warm.body.fontFamily, 'Theme_PlusJakartaSans_400');
  assert.equal(warm.label.fontFamily, 'Theme_PlusJakartaSans_600');
});

test('separate resource typography edits affect resolved text without a renderer change', () => {
  const theme = structuredClone(resource.themes[0]);
  Object.assign(theme.typography.body, { fontSize: 19, lineHeight: 31, letterSpacing: .2 });
  assert.deepEqual(resolveThemeTypography(theme, catalog, true, fallback).body, {
    fontFamily: 'Theme_DMSans_400', fontWeight: 'normal', fontSize: 19, lineHeight: 31, letterSpacing: .2,
  });
});

test('rejects missing family/weight registration and duplicate face aliases instead of silently substituting a font', () => {
  assert.throws(() => validateFontReferences(resource, catalog.filter(font => font.alias !== 'Theme_NotoSerif_500')), /celestial-midnight.*sectionHeading/);
  const duplicate = [...catalog, { ...catalog[0], family: 'Other family' }];
  assert.throws(() => validateFontReferences(resource, duplicate), /alias/);
  const duplicateFace = [...catalog, { ...catalog[0], alias: 'OtherAlias' }];
  assert.throws(() => validateFontReferences(resource, duplicateFace), /family.*weight/);
});

test('fallback uses platform families while retaining resource metrics and weights', () => {
  const styles = resolveThemeTypography(resource.themes[1], [], false, fallback);
  assert.equal(styles.cardTitle.fontFamily, 'serif');
  assert.equal(styles.cardTitle.fontSize, 29.13);
  assert.equal(styles.sectionHeading.fontWeight, '500');
  assert.equal(styles.body.fontFamily, 'sans-serif');
});
