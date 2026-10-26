// Asset identifiers are keys. Native image types belong in the UI registry.
export type Locale = 'cs' | 'en';
export type CardId = number;

export type DeckManifest = {
  schemaVersion: 1;
  id: string;
  version: string;
  name: Record<Locale, string>;
  backAsset: string;
  localizedBackAssets?: Partial<Record<Locale, string>>;
  cards: Array<{
    id: CardId;
    faceAsset: string;
    translations: Record<Locale, {
      name: string;
      meaning: string;
      description: string;
      faceAsset?: string;
    }>;
  }>;
};

export type Card = DeckManifest['cards'][number];

export type LocalizedCard = {
  id: CardId;
  name: string;
  meaning: string;
  description: string;
  faceAsset: string;
};

export type Phase =
  | 'regrip' | 'ready' | 'strip' | 'contact' | 'return' | 'lower'
  | 'lift' | 'flip' | 'reveal' | 'resume' | 'results';

// Coordinates use the motion reference's coordinate system.
export type Pose = { x: number; y: number; angle: number; scale: number };

export type SessionState = {
  sessionId: string;
  deckId: string;
  deckVersion: string;
  remainingIds: readonly CardId[];
  drawnIds: readonly CardId[];
  sourceIds: readonly CardId[];
  receivedIds: readonly CardId[];
  flyingIds: readonly CardId[];
  selectedId: CardId | null;
  phase: Phase;
  epoch: number;
  drawQueued: boolean;
  phaseOrigin: Pose | null;
};

export type SessionEvent =
  | { type: 'DRAW'; pose?: Pose }
  | { type: 'CONFIRM' }
  | { type: 'STOP' }
  | { type: 'PHASE_COMPLETE'; sessionId: string; epoch: number; packetSize?: number };
