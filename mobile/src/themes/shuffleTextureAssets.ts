import type { ImageSourcePropType } from 'react-native';
import type { ShuffleTextureKey } from './shuffleTextureCatalog';

export const shuffleTextureAssets: Readonly<Record<ShuffleTextureKey, ImageSourcePropType>> = {
  'checked-cloth': require('../../assets/textures/checked-cloth.png'),
  'woven-linen': require('../../assets/textures/woven-linen.png'),
};
