import { appConfig } from '../config/appConfig.ts';
import { validateDeck } from '../domain/deck.ts';
import type { DeckManifest } from '../domain/contracts.ts';
import { sampleDeck } from './sample.ts';
import { alternateDeck } from './alternate.ts';
import { assetKeys } from './assetCatalog.ts';

export const bundledDecks: Readonly<Record<string, DeckManifest>> = {
  sample: validateDeck(sampleDeck, assetKeys),
  alternate: validateDeck(alternateDeck, assetKeys),
};
const selectedDeck = bundledDecks[appConfig.deckId];
if (!selectedDeck) throw new Error(`Unknown configured deck: ${appConfig.deckId}`);
export const configuredDeck: DeckManifest = selectedDeck;
