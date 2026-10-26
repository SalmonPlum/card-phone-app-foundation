import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocale, t } from '../locale.ts';
for (const [tags, want] of [[['cs-CZ'], 'cs'], [['de-DE', 'cs-CZ'], 'cs'], [['en-GB', 'cs-CZ'], 'en'], [[], 'en'], [['CS-cz'], 'cs'], [['de', 'fr'], 'en'], [['english', 'cs'], 'cs']] as const) {
  test(`first supported preferred locale: ${tags.join(',')} → ${want}`, () => { assert.equal(resolveLocale(tags), want); });
}
test('renders translated actions and substitutes numbers without changing locale', () => {
  assert.equal(t('draw', 'cs'), 'Vytáhnout kartu'); assert.equal(t('draw', 'en'), 'Draw a card');
  assert.equal(t('remainingCount', 'cs', { count: 7 }), 'Zbývající karty: 7'); assert.equal(t('remainingCount', 'en', { count: 0 }), 'Cards remaining: 0');
});

test('every interface key has nonblank Czech/English text and matching interpolation fields', async () => {
  const { en } = await import('../en.ts'); const { cs } = await import('../cs.ts');
  assert.deepEqual(Object.keys(cs).sort(), Object.keys(en).sort());
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    assert.ok(en[key].trim().length > 0); assert.ok(cs[key].trim().length > 0);
    assert.deepEqual(cs[key].match(/\{\w+\}/g), en[key].match(/\{\w+\}/g));
  }
});
