import type { Card, CardId, DeckManifest } from '../../domain/contracts';
export function cardsForIds(deck: DeckManifest, ids: readonly CardId[]): Card[] {
  const byId = new Map(deck.cards.map(card => [card.id, card]));
  return ids.map(id => {
    const card = byId.get(id);
    if (!card) throw new Error(`Unknown card ID: ${id}`);
    return card;
  });
}
export function cardForRoute(deck: DeckManifest, id: unknown): Card | null {
  if (typeof id !== 'string' || !/^(0|[1-9]\d*)$/.test(id)) return null;
  const numeric = Number(id);
  if (!Number.isSafeInteger(numeric)) return null;
  return deck.cards.find(card => card.id === numeric) ?? null;
}
