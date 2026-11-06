import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ThemeResource } from '../contracts.ts';
import { validateThemeResource } from '../validateThemeResource.ts';

const raw = JSON.parse(readFileSync(new URL('../resource.json', import.meta.url), 'utf8')) as ThemeResource;
function luminance(hex: string) {
  const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a: string, b: string) {
  const left = luminance(a), right = luminance(b);
  return (Math.max(left, right) + .05) / (Math.min(left, right) + .05);
}

test('every supplied theme has readable text and selected/control pairs, including Midnight', () => {
  for (const theme of raw.themes) {
    const c = theme.colors;
    for (const [foreground, background] of [
      ['text', 'canvas'], ['text', 'surface'], ['mutedText', 'surface'],
      ['primary', 'canvas'], ['primary', 'surface'], ['accent', 'surface'],
      ['onPrimary', 'primary'], ['onSelected', 'selectedSurface'], ['onMat', 'mat'],
    ] as const) {
      assert.ok(contrast(c[foreground], c[background]) >= 4.5, `${theme.id}: ${foreground}/${background}`);
    }
  }
});

test('selected foreground and shadow are required resource roles rather than hardcoded theme exceptions', () => {
  for (const role of ['onSelected', 'shadow']) {
    const resource = structuredClone(raw);
    Reflect.deleteProperty(resource.themes[0].colors, role);
    assert.throws(() => validateThemeResource(resource), new RegExp(`colors.${role}`));
  }
});
