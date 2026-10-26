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
  "alternate.back": "assets/decks/alternate/back.png",
  "alternate.spark": "assets/decks/alternate/spark.png",
  "alternate.wave": "assets/decks/alternate/wave.png",
  "alternate.mountain": "assets/decks/alternate/mountain.png"
} as const;
export type AssetKey = keyof typeof assetCatalog;
export const assetKeys: ReadonlySet<string> = new Set(Object.keys(assetCatalog));
