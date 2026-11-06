// Asset identifiers are keys. Native image types belong in the UI registry.
export type Locale = 'cs' | 'en';
export type CardId = number;
export type RevealMode = 'automatic' | 'manual';

export type DetailSection = {id:string;titles:Record<Locale,string>};
export type DetailTemplate = {sections:DetailSection[]};

export type DeckManifest = {
  schemaVersion: 2;
  detailTemplate: DetailTemplate;
  id: string;
  version: string;
  name: Record<Locale, string>;
  backAsset: string;
  localizedBackAssets?: Partial<Record<Locale, string>>;
  cards: {
    id: CardId;
    faceAsset: string;
    translations: Record<Locale, {
      name: string;
      sections: Record<string,string>;
      faceAsset?: string;
    }>;
  }[];
};

export type Card = DeckManifest['cards'][number];

export type LocalizedCard = {
  id: CardId;
  name: string;
  sections: Record<string,string>;
  faceAsset: string;
};

export type Phase =
  | 'regrip' | 'ready' | 'strip' | 'contact' | 'return' | 'lower'
  | 'lift' | 'awaitingReveal' | 'flip' | 'reveal' | 'resume' | 'results';

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
  /** Snapshotted when DRAW is accepted; absent legacy fixtures mean automatic. */
  revealMode?: RevealMode;
  phaseOrigin: Pose | null;
};

export type SessionEvent =
  | { type: 'DRAW'; pose?: Pose; revealMode?: RevealMode }
  | { type: 'REVEAL'; sessionId: string; epoch: number }
  | { type: 'CONFIRM' }
  | { type: 'STOP' }
  | { type: 'PHASE_COMPLETE'; sessionId: string; epoch: number; packetSize?: number };
