// Pure metadata: importing this file never executes React Native image requires.
export const assetCatalog = {
  "sample.back": "assets/decks/sample/back.png",
  "sample.seed": "assets/decks/sample/seed.png",
  "sample.spring": "assets/decks/sample/spring.png",
  "sample.path": "assets/decks/sample/path.png",
  "sample.lantern": "assets/decks/sample/lantern.png",
  "sample.bridge": "assets/decks/sample/bridge.png",
  "sample.tree": "assets/decks/sample/tree.png",
  "sample.star": "assets/decks/sample/star.png",
  "sample.circle": "assets/decks/sample/circle.png",
  "sample.moon": "assets/decks/sample/moon.png",
  "sample.sun": "assets/decks/sample/sun.png",
  "sample.mountain": "assets/decks/sample/mountain.png",
  "sample.river": "assets/decks/sample/river.png",
  "sample.flower": "assets/decks/sample/flower.png",
  "sample.feather": "assets/decks/sample/feather.png",
  "sample.key": "assets/decks/sample/key.png",
  "sample.gate": "assets/decks/sample/gate.png",
  "sample.bench": "assets/decks/sample/bench.png",
  "sample.pond": "assets/decks/sample/pond.png",
  "sample.roots": "assets/decks/sample/roots.png",
  "sample.dew": "assets/decks/sample/dew.png",
  "alternate.back": "assets/decks/alternate/back.png",
  "alternate.spark": "assets/decks/alternate/spark.png",
  "alternate.wave": "assets/decks/alternate/wave.png",
  "alternate.mountain": "assets/decks/alternate/mountain.png"
} as const;
export type AssetKey = keyof typeof assetCatalog;
export const assetKeys: ReadonlySet<string> = new Set(Object.keys(assetCatalog));
