export type AppConfig = Readonly<{
  deckId: string;
}>;

// Each separately branded app replaces this configured bundled deck.
export const appConfig = {
  deckId: 'sample',
} as const satisfies AppConfig;
