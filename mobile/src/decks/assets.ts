import type { ImageSourcePropType } from 'react-native';
import type { AssetKey } from './assetCatalog.ts';

export type AssetRegistry = Readonly<Record<string, ImageSourcePropType>>;
// Literal paths are required so Metro can include every offline image.
export const assetRegistry = {
  'sample.back': require('../../assets/decks/sample/back.png'),
  'sample.seed': require('../../assets/decks/sample/seed.png'),
  'sample.spring': require('../../assets/decks/sample/spring.png'),
  'sample.path': require('../../assets/decks/sample/path.png'),
  'sample.lantern': require('../../assets/decks/sample/lantern.png'),
  'sample.bridge': require('../../assets/decks/sample/bridge.png'),
  'sample.tree': require('../../assets/decks/sample/tree.png'),
  'sample.star': require('../../assets/decks/sample/star.png'),
  'sample.circle': require('../../assets/decks/sample/circle.png'),
  'alternate.back': require('../../assets/decks/alternate/back.png'),
  'alternate.spark': require('../../assets/decks/alternate/spark.png'),
  'alternate.wave': require('../../assets/decks/alternate/wave.png'),
  'alternate.mountain': require('../../assets/decks/alternate/mountain.png'),
} satisfies Readonly<Record<AssetKey, ImageSourcePropType>>;
