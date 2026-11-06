import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateThemeResource } from '../validateThemeResource.ts';

function fixture() {
  const text = { fontFamily: 'Custom Serif', fontWeight: '500', fontSize: 24, lineHeight: 32, letterSpacing: 0 };
  return {
    schemaVersion: 1,
    defaultThemeId: 'custom-theme',
    themes: [{
      id: 'custom-theme', version: '1.0.0', name: { cs: 'Vlastní motiv', en: 'Custom theme' },
      appearance: 'light',
      colors: {
        canvas: '#fff8f0', surface: '#f5ede0', text: '#1e1b14', mutedText: '#55423d',
        primary: '#7f3015', onPrimary: '#ffffff', accent: '#904d00', border: '#dcc1b9',
        selectedSurface: '#ffdbd0', onSelected: '#3a0b00', mat: '#9e472a', onMat: '#ffffff', shadow: '#2a1810',
      },
      cardColors: { background: '#9e472a', accent: '#fe932c' },
      typography: {
        title: { ...text }, cardTitle: { ...text }, sectionHeading: { ...text },
        body: { ...text, fontFamily: 'Custom Sans', fontSize: 18, lineHeight: 28 },
        label: { ...text }, caption: { ...text },
      },
    }],
  };
}

test('validates independently authored themes without hardcoded IDs or font families and without mutation', () => {
  const input = fixture(), snapshot = structuredClone(input);
  assert.equal(validateThemeResource(input), input);
  assert.deepEqual(input, snapshot);
  input.themes.push({ ...structuredClone(input.themes[0]), id: 'another-theme', appearance: 'dark' });
  input.defaultThemeId = 'another-theme';
  assert.equal(validateThemeResource(input).defaultThemeId, 'another-theme');
});

test('rejects unsupported schemas, empty resources, duplicate identities and missing default references with field paths', () => {
  assert.throws(() => validateThemeResource(null), /resource/);
  assert.throws(() => validateThemeResource({ ...fixture(), schemaVersion: 2 }), /schemaVersion/);
  assert.throws(() => validateThemeResource({ ...fixture(), themes: [] }), /themes/);
  assert.throws(() => validateThemeResource({ ...fixture(), defaultThemeId: 'missing' }), /defaultThemeId/);
  const duplicate = fixture(); duplicate.themes.push(structuredClone(duplicate.themes[0]));
  assert.throws(() => validateThemeResource(duplicate), /themes\[1\].id/);
});

test('rejects malformed names, identity, appearance and color roles instead of allowing partial themes', () => {
  for (const [field, value] of [['id', '__proto__'], ['version', ' '], ['name', { en: 'Only English' }], ['appearance', 'system'], ['colors', []], ['cardColors', {}]] as const) {
    const input = fixture(); Object.assign(input.themes[0], { [field]: value });
    assert.throws(() => validateThemeResource(input), new RegExp(`themes\\[0\\].${field}`));
  }
  const color = fixture(); color.themes[0].colors.primary = 'https://example.com/color';
  assert.throws(() => validateThemeResource(color), /colors.primary/);
  color.themes[0].colors.primary = '#fff';
  assert.throws(() => validateThemeResource(color), /colors.primary/);
  const missing = fixture(); Reflect.deleteProperty(missing.themes[0].colors, 'onPrimary');
  assert.throws(() => validateThemeResource(missing), /colors.onPrimary/);
});

test('rejects missing text roles, blank fonts, unsupported weights and unusable text metrics', () => {
  const missing = fixture(); Reflect.deleteProperty(missing.themes[0].typography, 'sectionHeading');
  assert.throws(() => validateThemeResource(missing), /typography.sectionHeading/);
  for (const [field, value] of [
    ['fontFamily', ' '], ['fontWeight', '450'], ['fontSize', 0], ['fontSize', Infinity],
    ['lineHeight', NaN], ['lineHeight', 1], ['letterSpacing', Infinity],
  ] as const) {
    const input = fixture(); Object.assign(input.themes[0].typography.body, { [field]: value });
    assert.throws(() => validateThemeResource(input), new RegExp(`typography.body.${field}`));
  }
});

test('bundled resource describes the three Stitch themes and their distinct typography', () => {
  const raw: unknown = JSON.parse(readFileSync(new URL('../resource.json', import.meta.url), 'utf8'));
  const resource = validateThemeResource(raw);
  assert.equal(resource.defaultThemeId, 'mystic-arbor');
  assert.deepEqual(resource.themes.map(theme => theme.id), ['mystic-arbor', 'celestial-midnight', 'solstice-ochre']);
  const [, midnight, ochre] = resource.themes;
  assert.equal(midnight.appearance, 'dark');
  assert.equal(midnight.colors.canvas, '#0d1322');
  assert.equal(midnight.typography.cardTitle.fontFamily, 'Noto Serif');
  assert.equal(midnight.typography.body.fontFamily, 'Manrope');
  assert.equal(midnight.typography.label.fontFamily, 'Space Grotesk');
  assert.equal(ochre.colors.canvas, '#fff8f0');
  assert.equal(ochre.colors.mat, '#9e472a');
  assert.equal(ochre.typography.cardTitle.fontFamily, 'Literata');
  assert.equal(ochre.typography.body.fontFamily, 'Plus Jakarta Sans');
  for (const theme of resource.themes) {
    assert.ok(theme.typography.cardTitle.fontSize > theme.typography.sectionHeading.fontSize);
    assert.ok(theme.typography.sectionHeading.fontSize > theme.typography.body.fontSize);
  }
});

test('optional shuffle surfaces validate registered texture keys and bounded finite intensity',()=>{
 const input=fixture();
 assert.equal(validateThemeResource(input),input);
 const textured={...input,themes:[{...input.themes[0],shuffleSurface:{texture:'woven-linen',opacity:.26}}]};
 assert.equal(validateThemeResource(textured),textured);
 for(const surface of [null,[],{}, {texture:'missing',opacity:.2},{texture:'woven-linen',opacity:-.01},
  {texture:'woven-linen',opacity:1.01},{texture:'woven-linen',opacity:NaN},{texture:'woven-linen',opacity:Infinity},
  {texture:'woven-linen',opacity:'0.2'}]){
  const malformed={...input,themes:[{...input.themes[0],shuffleSurface:surface}]};
  assert.throws(()=>validateThemeResource(malformed),/shuffleSurface/);
 }
});
