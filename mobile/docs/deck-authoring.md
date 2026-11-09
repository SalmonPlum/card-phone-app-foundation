# Bundled deck authoring

Each branded app selects one local package with `appConfig.deckId` in
`src/config/appConfig.ts`. `src/decks/index.ts` validates bundled manifests and
exports `configuredDeck`; session and animation code do not need deck-specific
branches. The current sample is **Tichá zahrada / Quiet Garden** (20 cards, version
1.2.0). The original eight retain their IDs, order, content and artwork; 12 new
cards follow them with sparse IDs 104–234. Names include Czech diacritics and
multiword labels for future search/layout testing. Every card has distinct offline
artwork and complete Czech/English meaning and description sections.
**Tvary pohybu / Shapes in Motion** is a visibly different three-card replacement.
Set `deckId` to `alternate` to select it.

## Manifest and identity

Start from `src/decks/sample.ts` or `alternate.ts` and satisfy `DeckManifest`.
Use `schemaVersion: 2`, a nonblank string deck ID and version, Czech/English deck
names, a back asset key, and 1–100 cards. Each card needs a nonnegative safe integer
ID, a shared face key, and complete nonblank `name` plus a `sections` content map
in both `cs` and `en`. Every section declared in the deck template is required.
Section text supports plain-text paragraphs.

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

## Optional theme-aware fronts and backs

See [card artwork authoring](card-artwork.md) for the versioned optional
`artwork` resource, fixed layers, theme-colored alpha masks, localized variants,
complete PNG fallbacks and validation. Define each card once; its designated
layers take the current theme's named colors automatically. Fixed artwork remains
supported. Quiet Garden now exercises layered fronts/back; Shapes in Motion stays
fixed as a compatibility fixture.

## Deck-defined detail sections

Each deck defines `detailTemplate.sections` once. Each entry has a stable section
`id` and localized `titles.cs` / `titles.en`. The array determines display order;
card content-map key order does not. Cards provide their own text by section ID.
Different decks can define different headings, IDs and numbers of sections.

For example, a schema-2 deck can declare:

```ts
detailTemplate: {
  sections: [
    { id: 'meaning', titles: { cs: 'Význam', en: 'Meaning' } },
    { id: 'guidance', titles: { cs: 'Doporučení', en: 'Guidance' } },
    { id: 'reflection', titles: { cs: 'Zamyšlení', en: 'Reflection' } },
  ],
},
// On each card:
translations: {
  cs: {
    name: 'Semínko',
    sections: {
      meaning: 'Malý začátek.',
      guidance: 'Vyberte jeden malý krok.',
      reflection: 'Čemu dnes věnujete péči?\n\nDopřejte si čas na odpověď.',
    },
  },
  en: {
    name: 'Seed',
    sections: {
      meaning: 'A small beginning.',
      guidance: 'Choose one small step.',
      reflection: 'What will you care for today?\n\nTake time to answer.',
    },
  },
},
```

Validation requires a nonempty template; unique IDs matching
`^[a-z][a-z0-9_-]*$`; nonblank Czech/English headings; and nonblank content for
**every declared section on every card in both languages**. Missing/blank sections,
undeclared content keys, invalid IDs, duplicate IDs and malformed maps fail with
a field path. There is no new section-count cap. Optional/empty sections and rich
text are not supported in this first version. Paragraph breaks are preserved;
text is not truncated. Extra resource fields do not automatically become sections:
declare each section in the template and put its text in the content map.

The shared renderer displays all template sections in Catalogue, drawn results,
direct links and swipe-up reading immediately after drawing. Names stay fixed
above the readers; existing artwork scrolling and reveal behavior are unchanged.
Headings are deck content, not hardcoded interface translation keys.

### Compatibility with original decks

`validateDeck` still accepts raw schema-1 objects containing each translation's
`meaning` and `description`. It returns canonical schema 2 with a Meaning/Description
template and copies both complete bodies into the section map, preserving names,
IDs and artwork overrides without mutating the original input. Use the returned
validated deck. New TypeScript packages using `satisfies DeckManifest` must use
schema 2. The bundled sample and alternate decks are migrated with all original
text and assets intact; their two current sections are content choices, not a UI limit.

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

All 25 supplied images are authored locally by `scripts/generate-deck-art.py`;
they contain no third-party card art. Regeneration is optional and requires
Python 3 plus Pillow (`python3 scripts/generate-deck-art.py`). Neither Python nor
Pillow is needed to build or run the bundled app.

## Interface localization

`src/i18n/en.ts` defines `TranslationKey`; `cs.ts` must supply exactly the same
keys. `t(key, locale, values)` interpolates named `{fields}`. Keep interpolation
names identical in both languages. Validation checks dictionary parity, blank
strings, and interpolation fields. Missing interpolation values remain visible
as `{fields}` to expose authoring mistakes.

The app now defaults to English and uses its saved Settings language choice for interface and card content. `resolveLocale` remains a standalone helper, not the app default policy. Pass preferred BCP 47 language tags to `resolveLocale`, in preference order. It
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
