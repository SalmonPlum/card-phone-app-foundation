# Card artwork: fixed images and theme-colored layers

Define each card **once**, independently of the available themes. Front and back
artwork use the same format. The theme supplies named colors automatically;
artwork masks specify precisely where those colors appear. Adding another theme
does not require another copy of the card definitions or artwork.

## Fixed artwork

Existing `faceAsset`, `backAsset`, `translations.cs.faceAsset` / `.en.faceAsset`
and `localizedBackAssets` keep their current meaning. A logical artwork key with
no entry in the optional `artwork.assets` map renders its complete PNG unchanged,
even when the app theme changes. The alternate pack demonstrates this mode.

Every logical key, including a layered one, must retain a complete PNG registered
under that key. This is the compatibility image and runtime error fallback.
Images, masks and theme resources are all bundled offline.

## Layered artwork description

A schema-2 deck can add an optional separately versioned artwork resource:

```ts
artwork: {
  schemaVersion: 1,
  assets: {
    'my-pack.back': {
      width: 600,
      height: 900,
      layers: [
        { id: 'paper', asset: 'my-pack.back.paper' },
        {
          id: 'field',
          asset: 'my-pack.back.field-mask',
          tint: { role: 'background', fallback: '#28554a' },
        },
        {
          id: 'decoration',
          asset: 'my-pack.back.decoration-mask',
          tint: { role: 'accent', fallback: '#bb9957' },
          opacity: 0.9,
        },
      ],
    },
    'my-pack.seed': {
      width: 600,
      height: 900,
      layers: [
        { id: 'illustration', asset: 'my-pack.seed.fixed' },
        {
          id: 'frame',
          asset: 'my-pack.front.frame-mask',
          tint: { role: 'background', fallback: '#28554a' },
        },
        {
          id: 'decoration',
          asset: 'my-pack.front.decoration-mask',
          tint: { role: 'accent', fallback: '#bb9957' },
        },
      ],
    },
  },
},
backAsset: 'my-pack.back',
// On the corresponding card:
faceAsset: 'my-pack.seed',
```

Definitions may be authored inline or imported from a separate local resource
module, as in [sampleArtwork.ts](../src/decks/sampleArtwork.ts). The manifest
content remains framework-free; it contains no native Image objects or theme IDs.

| Field | Meaning |
| --- | --- |
| `width`, `height` | Positive safe-integer pixel dimensions of the complete canvas. |
| `layers` | 1–8 layers painted in array order, bottom to top. |
| `id` | Nonblank, unique layer identity within this definition; keep it stable. |
| `asset` | Raw PNG registry key. Its own artwork definition, if any, is not recursively composed. |
| absent `tint` | Preserve all original pixel colors and alpha. |
| `tint.role` | `background` or `accent`, resolved from the selected theme's `cardColors`. |
| `tint.fallback` | Opaque `#RRGGBB` used when that role is unavailable in a preview. Unknown roles are validation errors. |
| `opacity` | Optional finite value in [0,1], default 1; multiplied by source alpha. |

The theme resource owns each role's actual color. For example, changing
`cardColors.background` updates every layer assigned to `background`, across
fronts and backs. Fixed illustration layers keep their original colors. A fully
theme-colored composition may contain masks only; a mixed composition adds fixed
illustration layers. No particular fixed layer or layer order is mandatory.

Mask regions are an artistic decision. A `background` layer can cover the entire
field, just a frame, or selected panels. The renderer does not guess regions or
recolor a flattened multicolor illustration.

## Exporting real-pack artwork

1. Preserve a complete, usable fixed PNG for every logical artwork key.
2. Export each layer on the **entire same canvas**, with exactly the same width
   and height as that complete PNG. Keep all artwork aligned to the same origin.
3. Export fixed illustrations with their authored colors and transparency.
4. Export tintable regions as PNG alpha masks: opaque where theme color should
   appear, transparent elsewhere. White RGB is a convenient authoring convention;
   tinting uses the alpha shape. Antialiased edges and partial alpha are retained.
5. Use PNG alpha-capable formats (RGBA, grayscale with alpha, or a palette with
   transparency). Tint masks without alpha support fail validation.
6. Register every raw PNG in `src/decks/assetCatalog.ts` and the literal Metro
   `require()` registry in `src/decks/assets.ts`. Layer PNGs use their own keys;
   they do not replace the complete logical-key PNG.
7. Add the definition to the deck's `artwork.assets`, select logical keys from
   cards/back fields, and run `npm run validate:decks`.

This version has no independent layer offsets, transforms, cropping, SVG or
blend modes. Use full-canvas masks to author placement. Every complete front,
back and localized override in a deck retains the same native aspect ratio.
Compositions and their fallback/layer files require exact matching dimensions.
All rendering surfaces share size lookup; drawing also supports authored ratios
other than the fixture's 600×900 without changing its reference animation timing.

Treat bundled resources and registries as immutable during rendering. If a raw
image is replaced in a new pack/resource, give it a new asset identity/version;
the renderer can reuse already-loaded shared masks across successive cards.
Layer keys use stable layer IDs and raw source keys, never selected theme IDs.

## Localized artwork

Language selection happens before composition lookup:

```ts
backAsset: 'my-pack.back',
localizedBackAssets: { cs: 'my-pack.back-cs' },
// Inside a card:
faceAsset: 'my-pack.seed',
translations: {
  cs: { name: 'Semínko', sections: { /* complete Czech text */ }, faceAsset: 'my-pack.seed-cs' },
  en: { name: 'Seed', sections: { /* complete English text */ } },
},
```

Add definitions for `my-pack.back-cs` / `my-pack.seed-cs` if those variants should
be layered; otherwise they stay fixed PNGs. Each layered localized key still
needs its complete fixed PNG. Share language-neutral masks where possible. Deck
text is always complete in both Czech and English, independently of image reuse.

## Loading, failures and retries

The shared renderer waits for every required layer before exposing the complete
composition or reporting it ready to a detail overlay. Theme-only tint changes
reuse loaded images. Shared raw masks that loaded for the previous card do not
need another native load event.

A layer error or a 1500ms missing-callback timeout abandons the partial composition
and loads the complete fixed fallback. A successful fallback is usable artwork:
it does not trigger the reader's fatal error. The fallback also has a 1500ms
bound. If it fails, the existing localized error/placeholder and retry path applies;
readiness still settles so an overlay can open and close. Abandoned-generation
events and duplicate native completion/error callbacks are ignored. An explicit
reader retry starts a fresh composition attempt. Back-art terminal failures also
show a localized Draw alert and retry above the dock, available during manual
reveal as well; retry changes artwork generation without restarting the session
or animation clock.

## Testing fixture and checks

Quiet Garden version 1.2.0 supplies definitions for its back and all 20 fronts.
Back field and ornaments use theme colors; its outer paper edge stays fixed.
Front frames/decorations follow themes while their core illustrations/paper
regions remain fixed. The original complete PNGs and alternate pack are intact.
The deterministic generator emits explicit regions and reusable masks:

```sh
python3 scripts/generate-deck-art.py  # optional authoring environment: Pillow
npm run validate:decks
npm run validate:themes
npm run typecheck
npm test -- --runInBand
npm run test:domain
```

`validate:decks` checks descriptions, source registration, dimensions, mask-alpha
support, complete localized content and asset coverage. Unit/integration tests
cover tint selection, fixed regions, readiness, stale callbacks, geometry and
persistent surfaces. Review real device texture/alpha edges, clipped corners,
mid-flip theme switching, fallback/retry, larger text and native frame performance
before accepting a real pack.
