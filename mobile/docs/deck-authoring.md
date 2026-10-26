# Bundled deck authoring

Each branded app selects one local package with `appConfig.deckId` in
`src/config/appConfig.ts`. `src/decks/index.ts` validates bundled manifests and
exports `configuredDeck`; session and animation code do not need deck-specific
branches. The current sample is **Tichá zahrada / Quiet Garden** (eight cards).
**Tvary pohybu / Shapes in Motion** is a visibly different three-card replacement.
Set `deckId` to `alternate` to select it.

## Manifest and identity

Start from `src/decks/sample.ts` or `alternate.ts` and satisfy `DeckManifest`.
Use `schemaVersion: 1`, a nonblank string deck ID and version, Czech/English deck
names, a back asset key, and 1–100 cards. Each card needs a nonnegative safe integer
ID, a shared face key, and complete nonblank `name`, `meaning`, and `description`
text in both `cs` and `en`. The description supports plain-text paragraphs.

IDs are stable identities, not array indices. Zero and nonconsecutive IDs are
valid; duplicate, negative, fractional, string, and unsafe integer IDs are
rejected. Catalogue order is manifest array order. Translation never changes an
ID. IDs are scoped to the deck, so different packages may reuse the same numbers.
Changing existing IDs is a content identity change; update package versions when
changing published content.

An optional `translations.cs.faceAsset` or `translations.en.faceAsset` overrides
the shared face. `localizedBackAssets.cs` and `.en` likewise override `backAsset`.
An omitted override uses the shared asset; a present blank or unknown key is
invalid. Overrides do not make text translations optional. Use `localizeCard` and
`localizeBackAsset` from `domain/deck.ts` to apply these rules.

## Local images and registration

1. Add original PNGs under `assets/decks/<deck>/`. Keep every face, back, and
   localized variant in that deck at the same aspect ratio. Current artwork is
   600 × 900 pixels, ratio 2:3, and contains no language-dependent text.
2. Add asset key → local path entries to `src/decks/assetCatalog.ts`.
3. Add the corresponding literal `require('../../assets/decks/...png')` entries
   to `src/decks/assets.ts`. Metro must see static literal paths. Do not construct
   `require` paths from a manifest at runtime.
4. Use those keys in the manifest, add the package to `bundledDecks`, and select
   the configured deck in app configuration.
5. Run the checks below before building.

`assetCatalog.ts` is pure metadata so Node validation never executes React Native
PNG requires. The registry is typed against its key union; the validation script
also compares every key and literal path, checks local PNG headers/dimensions,
checks per-deck aspect ratios, and rejects unregistered PNG files. Missing files,
missing locale text, or dangling keys stop validation with a field/asset error.

All 13 supplied images are authored locally by `scripts/generate-deck-art.py`;
they contain no third-party card art. Regeneration is optional and requires
Python 3 plus Pillow (`python3 scripts/generate-deck-art.py`). Neither Python nor
Pillow is needed to build or run the bundled app.

## Interface localization

`src/i18n/en.ts` defines `TranslationKey`; `cs.ts` must supply exactly the same
keys. `t(key, locale, values)` interpolates named `{fields}`. Keep interpolation
names identical in both languages. Validation checks dictionary parity, blank
strings, and interpolation fields. Missing interpolation values remain visible
as `{fields}` to expose authoring mistakes.

Pass preferred BCP 47 language tags to `resolveLocale`, in preference order. It
chooses the first supported Czech or English primary language (case insensitive)
and otherwise falls back to English. Thus `['en-GB', 'cs-CZ']` resolves to English,
while `['de-DE', 'cs-CZ']` resolves to Czech.

## Verification and randomness

Run from `mobile/`:

```sh
npm run test:domain
npm run validate:decks
npm run typecheck
npm test -- --runInBand
```

Domain fixtures for one, two, and 100 cards live in
`src/domain/__tests__/fixtures.ts`. The domain runner discovers only
`*.node.test.ts` below domain/i18n/platform and uses Node 22 native TypeScript
stripping. These files are excluded from Jest. It runs with test isolation
`none` because the managed environment's default child-process test mode emitted
only file-level failures without test diagnostics. Each test restores temporary
global changes, and domain tests use no native modules or external dependencies.

`randomInt(n, source)` samples uniformly from `[0,n)` for integer bounds 1–2³²,
using rejection at `floor(2³²/n) * n`. Bound 1 consumes no entropy. `shuffleIds`
returns a copy using downward Fisher–Yates. There is no production seed API or
`Math.random` fallback. `secureRandomSource` directly binds Expo Crypto's
`getRandomValues`; errors propagate so the session controller can offer retry.
Every request uses a fresh `Uint32Array`, and packet selection must call
`randomInt` separately after initial order generation rather than reuse an
initial shuffle sample.

Node tests cover adapter arguments, unsigned values, fresh samples, and thrown
errors through an injected Crypto facade. They do **not** verify Android/iOS
native entropy or device behavior. Confirm Expo Crypto availability and failure
handling in the native development/release build validation step.
