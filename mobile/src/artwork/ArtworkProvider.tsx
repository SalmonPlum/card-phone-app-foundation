import { createContext, useContext, type ReactNode } from 'react';
import { Image } from 'react-native';
import type { ArtworkDefinition, ArtworkResource } from '../domain/artwork';
import type { AssetRegistry } from '../decks/assets';

export type ArtworkDefinitions = Readonly<Record<string, ArtworkDefinition>>;
const empty: ArtworkDefinitions = {};
const ArtworkContext = createContext<ArtworkDefinitions>(empty);
export function ArtworkProvider({ artwork, children }: { artwork?: ArtworkResource; children: ReactNode }) {
  return <ArtworkContext.Provider value={artwork?.assets ?? empty}>{children}</ArtworkContext.Provider>;
}
export function useArtworkDefinitions(): ArtworkDefinitions { return useContext(ArtworkContext); }
export function artworkDefinition(key: string | undefined, definitions: ArtworkDefinitions): ArtworkDefinition | undefined {
  return key !== undefined && Object.hasOwn(definitions, key) ? definitions[key] : undefined;
}
export function artworkSize(key: string, registry: AssetRegistry, definitions: ArtworkDefinitions, fallback = { width: 238, height: 358 }): { width: number; height: number } {
  const definition = artworkDefinition(key, definitions);
  if (definition) return { width: definition.width, height: definition.height };
  const source = registry[key], size = source ? Image.resolveAssetSource(source) : null;
  const width = size?.width ?? 0, height = size?.height ?? 0;
  return width > 0 && height > 0 ? { width, height } : fallback;
}
