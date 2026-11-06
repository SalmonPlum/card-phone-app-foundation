import type { Card, Locale } from '../../domain/contracts.ts';

/** Czech/English name matching; punctuation stays literal and cards retain their identities. */
export function normalizeCardQuery(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function filterCardsByName(cards: readonly Card[], locale: Locale, query: string): readonly Card[] {
  const normalized = normalizeCardQuery(query);
  return normalized ? cards.filter(card => normalizeCardQuery(card.translations[locale].name).includes(normalized)) : cards;
}
