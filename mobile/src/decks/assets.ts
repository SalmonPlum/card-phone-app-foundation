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
  'sample.moon': require('../../assets/decks/sample/moon.png'),
  'sample.sun': require('../../assets/decks/sample/sun.png'),
  'sample.mountain': require('../../assets/decks/sample/mountain.png'),
  'sample.river': require('../../assets/decks/sample/river.png'),
  'sample.flower': require('../../assets/decks/sample/flower.png'),
  'sample.feather': require('../../assets/decks/sample/feather.png'),
  'sample.key': require('../../assets/decks/sample/key.png'),
  'sample.gate': require('../../assets/decks/sample/gate.png'),
  'sample.bench': require('../../assets/decks/sample/bench.png'),
  'sample.pond': require('../../assets/decks/sample/pond.png'),
  'sample.roots': require('../../assets/decks/sample/roots.png'),
  'sample.dew': require('../../assets/decks/sample/dew.png'),
  'alternate.back': require('../../assets/decks/alternate/back.png'),
  'alternate.spark': require('../../assets/decks/alternate/spark.png'),
  'alternate.wave': require('../../assets/decks/alternate/wave.png'),
  'alternate.mountain': require('../../assets/decks/alternate/mountain.png'),
} satisfies Readonly<Record<AssetKey, ImageSourcePropType>>;
