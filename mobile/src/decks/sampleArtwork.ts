import type { ArtworkDefinition, ArtworkResource } from '../domain/artwork.ts';

const fronts = ['seed', 'spring', 'path', 'lantern', 'bridge', 'tree', 'star', 'circle', 'moon', 'sun', 'mountain', 'river', 'flower', 'feather', 'key', 'gate', 'bench', 'pond', 'roots', 'dew'];
function definition(kind: string): ArtworkDefinition {
  const mask = kind === 'back' ? 'back' : 'front';
  return { width: 600, height: 900, layers: [
    { id: 'fixed', asset: `sample.layer.${kind}-fixed` },
    { id: 'background', asset: `sample.layer.${mask}-background-mask`, tint: { role: 'background', fallback: '#28554a' } },
    { id: 'accent', asset: `sample.layer.${mask}-accent-mask`, tint: { role: 'accent', fallback: '#bb9957' } },
  ] };
}
// One description per artwork; none of these definitions names an app theme.
export const sampleArtwork: ArtworkResource = { schemaVersion: 1,
  assets: Object.fromEntries(['back', ...fronts].map(kind => [`sample.${kind}`, definition(kind)])),
};
