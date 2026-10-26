import type { Card, DeckManifest, Locale, LocalizedCard } from './contracts.ts';

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${path}: expected an object`);
  return value as Record<string, unknown>;
}
function text(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${path}: expected nonblank text`);
}

/** Validate bundled content before creating sessions or rendering assets. */
export function validateDeck(input: unknown, assetKeys: ReadonlySet<string>): DeckManifest {
  const deck = record(input, 'deck');
  const asset = (value: unknown, path: string) => {
    text(value, path);
    if (!assetKeys.has(value)) throw new Error(`${path}: unknown asset key "${value}"`);
  };
  if (deck.schemaVersion !== 1) throw new Error('schemaVersion: only version 1 is supported');
  text(deck.id, 'id'); text(deck.version, 'version');
  const name = record(deck.name, 'name');
  for (const locale of ['cs', 'en'] as const) text(name[locale], `name.${locale}`);
  asset(deck.backAsset, 'backAsset');
  if (deck.localizedBackAssets !== undefined) {
    const backs = record(deck.localizedBackAssets, 'localizedBackAssets');
    for (const locale of ['cs', 'en'] as const) {
      if (Object.hasOwn(backs, locale)) asset(backs[locale], `localizedBackAssets.${locale}`);
    }
  }
  if (!Array.isArray(deck.cards) || deck.cards.length < 1 || deck.cards.length > 100) throw new Error('cards: expected 1–100 cards');
  const ids = new Set<number>();
  for (const [index, value] of deck.cards.entries()) {
    const path = `cards[${index}]`;
    const card = record(value, path);
    if (typeof card.id !== 'number' || !Number.isSafeInteger(card.id) || card.id < 0) throw new Error(`${path}.id: expected a nonnegative safe integer`);
    if (ids.has(card.id)) throw new Error(`${path}.id: duplicate card ID ${card.id}`);
    ids.add(card.id);
    asset(card.faceAsset, `${path}.faceAsset`);
    const translations = record(card.translations, `${path}.translations`);
    for (const locale of ['cs', 'en'] as const) {
      const translation = record(translations[locale], `${path}.translations.${locale}`);
      for (const field of ['name', 'meaning', 'description']) text(translation[field], `${path}.translations.${locale}.${field}`);
      if (Object.hasOwn(translation, 'faceAsset')) asset(translation.faceAsset, `${path}.translations.${locale}.faceAsset`);
    }
  }
  // Every field consumed by DeckManifest has been checked above; array order is untouched.
  return input as DeckManifest;
}

export function localizeCard(card: Card, locale: Locale): LocalizedCard {
  const { name, meaning, description, faceAsset } = card.translations[locale];
  return { id: card.id, name, meaning, description, faceAsset: faceAsset ?? card.faceAsset };
}
export function localizeBackAsset(deck: DeckManifest, locale: Locale): string {
  return deck.localizedBackAssets?.[locale] ?? deck.backAsset;
}
