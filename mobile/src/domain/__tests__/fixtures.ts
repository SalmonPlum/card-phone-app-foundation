import type { DeckManifest } from '../contracts.ts';
import type { RandomSource } from '../random.ts';
export const fixtureAssetKeys = new Set(['face', 'back', 'cs-face', 'en-face', 'cs-back']);
export function deckFixture(count = 3): DeckManifest {
  return {
    schemaVersion: 2, detailTemplate:{sections:[{id:'meaning',titles:{cs:'Význam',en:'Meaning'}},{id:'description',titles:{cs:'Popis',en:'Description'}}]}, id: 'fixture', version: '1.0.0', name: { cs: 'Zkušební sada', en: 'Test deck' }, backAsset: 'back',
    cards: Array.from({ length: count }, (_, id) => ({ id, faceAsset: 'face', translations: {
      cs: { name: `Karta ${id}`, sections:{meaning: 'Význam', description: 'Český popis.'} },
      en: { name: `Card ${id}`, sections:{meaning: 'Meaning', description: 'English description.'} },
    } })),
  };
}
export const oneCardDeck = deckFixture(1);
export const twoCardDeck = deckFixture(2);
export const hundredCardDeck = deckFixture(100);
export function scripted(words: number[]): RandomSource & { consumed(): number } {
  let position = 0;
  return {
    nextUint32() { if (position >= words.length) throw new Error('Scripted entropy exhausted'); return words[position++]; },
    consumed: () => position,
  };
}
