// Pure authoring metadata, separate from native image requires.
export const shuffleTextureCatalog = {
  'checked-cloth': {
    path: 'assets/textures/checked-cloth.png', width: 320, height: 320,
    variants: [{path: 'assets/textures/checked-cloth@2x.png', width: 640, height: 640, scale: 2}],
  },
  'woven-linen': {
    path: 'assets/textures/woven-linen.png', width: 128, height: 128,
    variants: [{path: 'assets/textures/woven-linen@2x.png', width: 256, height: 256, scale: 2}],
  },
} as const;
export type ShuffleTextureKey = keyof typeof shuffleTextureCatalog;
export const shuffleTextureKeys: ReadonlySet<string> = new Set(Object.keys(shuffleTextureCatalog));
