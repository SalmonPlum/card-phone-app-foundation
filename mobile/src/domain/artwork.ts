export const artworkColorRoles = ['background', 'accent'] as const;
export type ArtworkColorRole = typeof artworkColorRoles[number];
export type ArtworkLayer = {
  id: string; asset: string; opacity?: number;
  tint?: { role: ArtworkColorRole; fallback: string };
};
export type ArtworkDefinition = { width: number; height: number; layers: ArtworkLayer[] };
export type ArtworkResource = { schemaVersion: 1; assets: Record<string, ArtworkDefinition> };
export type ResolvedArtworkLayer = { id: string; asset: string; opacity: number; tintColor?: string };

function record(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: expected an object`);
  return value as Record<string, unknown>;
}
function text(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${path}: expected nonblank text`);
}
export function validateArtwork(input: unknown, assetKeys: ReadonlySet<string>): ArtworkResource {
  const resource = record(input, 'artwork');
  if (resource.schemaVersion !== 1) throw new Error('artwork.schemaVersion: expected 1');
  const definitions = record(resource.assets, 'artwork.assets');
  for (const [key, value] of Object.entries(definitions)) {
    const path = `artwork.assets.${key}`;
    if (!assetKeys.has(key)) throw new Error(`${path}: missing registered fixed fallback`);
    const definition = record(value, path);
    for (const dimension of ['width', 'height']) {
      const size = definition[dimension];
      if (typeof size !== 'number' || !Number.isSafeInteger(size) || size <= 0) throw new Error(`${path}.${dimension}: expected positive safe integer`);
    }
    if (!Array.isArray(definition.layers) || definition.layers.length < 1 || definition.layers.length > 8) throw new Error(`${path}.layers: expected 1–8 layers`);
    const ids = new Set<string>();
    for (const [index, raw] of definition.layers.entries()) {
      const layerPath = `${path}.layers[${index}]`, layer = record(raw, layerPath);
      text(layer.id, `${layerPath}.id`);
      if (ids.has(layer.id)) throw new Error(`${layerPath}.id: duplicate layer ID`);
      ids.add(layer.id);
      text(layer.asset, `${layerPath}.asset`);
      if (!assetKeys.has(layer.asset)) throw new Error(`${layerPath}.asset: unknown raw asset key`);
      if (layer.opacity !== undefined && (typeof layer.opacity !== 'number' || !Number.isFinite(layer.opacity) || layer.opacity < 0 || layer.opacity > 1)) throw new Error(`${layerPath}.opacity: expected finite number in [0,1]`);
      if (layer.tint !== undefined) {
        const tint = record(layer.tint, `${layerPath}.tint`);
        if (!artworkColorRoles.some(role => role === tint.role)) throw new Error(`${layerPath}.tint.role: unknown card color role`);
        if (typeof tint.fallback !== 'string' || !/^#[\da-f]{6}$/i.test(tint.fallback)) throw new Error(`${layerPath}.tint.fallback: expected #RRGGBB`);
      }
    }
  }
  return resource as ArtworkResource;
}

export function resolveArtworkLayers(definition: ArtworkDefinition, palette: Partial<Record<ArtworkColorRole, string>>): ResolvedArtworkLayer[] {
  return definition.layers.map(layer => ({ id: layer.id, asset: layer.asset, opacity: layer.opacity ?? 1,
    ...(layer.tint ? { tintColor: palette[layer.tint.role] ?? layer.tint.fallback } : {}) }));
}
