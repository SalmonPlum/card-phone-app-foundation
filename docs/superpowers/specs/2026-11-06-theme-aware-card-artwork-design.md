# Theme-aware card artwork: resource contract and layered renderer

## Intent and decisions

The testing pack is a fixture for future real packs. The user's priority is a
clear card/artwork description and functional rendering using theme colors,
covering both fronts and backs. This supersedes the previous back-only first
phase and deferral of all face rendering. Both background and decorative accents
should follow the theme. Fine illustration polish is secondary.

The user chose **render authored layers with theme colors**. Existing deck text,
IDs, localized artwork selection, fixed artwork and accepted motion remain.

## Approaches

- **Chosen: ordered authored PNG layers and tintable alpha masks.** Fixed layers
  keep their authored pixels; named theme roles color designated masks at runtime.
  A new theme needs colors rather than a new full image set. More image layers
  require native loading, identity and performance verification.
- **Alternative: generate complete PNGs for each bundled theme.** Keeps the
  existing single-image renderer but multiplies artwork and requires regeneration
  for each palette. It does not exercise the runtime color composition the user
  wants for real packs.

## Resource description

Keep existing `faceAsset`, `backAsset`, translated face overrides and localized
back overrides as logical artwork keys. Existing raw PNG keys continue working.
Add an optional, separately versioned `artwork` section to each deck manifest;
legacy schema-1 normalization and schema-2 content remain supported. This is an
additive schema-2 extension, not a forced migration of fixed decks.

Illustrative resource shape (names are the assistant's proposed contract):

```json
{
  "backAsset": "sample.back",
  "artwork": {
    "schemaVersion": 1,
    "assets": {
      "sample.back": {
        "width": 600,
        "height": 900,
        "layers": [
          { "id": "paper", "asset": "sample.back.paper" },
          {
            "id": "field",
            "asset": "sample.back.field-mask",
            "tint": { "role": "background", "fallback": "#28554a" }
          },
          {
            "id": "ornament",
            "asset": "sample.back.ornament-mask",
            "tint": { "role": "accent", "fallback": "#bb9957" },
            "opacity": 1
          }
        ]
      }
    }
  }
}
```

- A definition can be referenced by any front/back/localized artwork key; there
  are no separate front and back rendering formats. Layer order is paint order.
- A logical key with no definition uses its existing complete PNG unchanged.
  A layered key retains that complete PNG as its fixed fallback/compatibility
  asset. Definition keys must therefore also exist in the raw asset registry.
- Layers are full-canvas aligned transparent PNGs. All have exactly the declared
  pixel dimensions and match the logical key's complete fallback PNG. No per-layer
  positioning, cropping or transforms in this version.
- `id` is a unique, stable, nonblank layer identifier. `asset` references a raw
  statically bundled PNG, never another composed definition; composition cannot
  recurse. One to eight layers per definition bounds native image cost.
- An absent `tint` preserves that layer's original colors. A present tint uses
  `theme.cardColors[role]`, preserving the mask's alpha. Only authored tint masks
  are recolored; flattened multicolor artwork is not globally tinted.
- This version supports existing semantic roles `background` and `accent`, with
  no theme IDs in deck descriptions or screen code. More semantic roles can be
  added to the shared theme contract later without changing the layer structure.
- `fallback` is an opaque `#RRGGBB` color used for theme-independent preview or an
  unavailable color role. Unknown role names are authoring errors. Normal app
  startup validates theme resources, so shipped roles resolve from the theme.
- Optional `opacity` defaults to 1 and must be finite in [0,1]. Transparent mask
  pixels and per-pixel alpha allow selective regions/shading in one layer.

The builder may refine TypeScript names or helper organization while preserving
this resource behavior and documenting the exact final public authoring format.

## Validation and asset authoring

Validate manifests before creating sessions: nested artwork version, positive
safe integer dimensions, unique layer IDs, layer limits, registered source keys,
known roles, fallback colors and opacity. Reject malformed artwork with field
paths rather than silently rendering an unrelated image.

Offline asset validation checks exact dimensions for every composition layer and
its complete fallback, PNG alpha support for tint masks, deck-wide artwork aspect
ratios, literal Metro registration, and no missing/unregistered files. A layer
source refers directly to its raw PNG even if that key also has a composition.

Keep complete fixed PNGs and the alternate deck unchanged. Extend deterministic
fixture authoring to explicitly emit the testing pack's named regions; do not
infer thematic regions by recoloring arbitrary finished real-pack PNGs. Real-pack
authors supply their own aligned fixed layers and masks. Document export order,
alpha requirements, roles, opacity, fallbacks and localized examples.

## Rendering and integration

Introduce one shared artwork renderer used by drawing backs/fronts, Catalogue,
results, measured detail overlays and direct-link details. It resolves an optional
definition for the locale-selected logical key and paints its layers inside one
stable, noninteractive surface. All native images use zero automatic image fade.

Centralize artwork dimensions: compositions use declared/validated size; fixed
art uses its native PNG size. Every card-fitting calculation uses the same result,
including detail target sizing and the single-column grid limit. Preserve native
proportions, existing contain/cover behavior, rounded clipping and outer shadows.

Keep card/animation hosts mounted. Layer keys depend on stable layer IDs and raw source identities, never
on theme IDs/colors. Changing theme changes tint props on existing images rather
than resetting sessions, clocks, reading position, list offset or query. The
builder chooses a context/provider or explicit props to deliver deck artwork
metadata; fixed-art callers without definitions continue working.

Drawing retains its existing frame-driven back/front visibility and independent
persistent surfaces. The selected back must stay invisible after the flip
midpoint and during confirmation exit. Do not combine opacity/flip animation
with theme switching or alter any existing paths/durations. Physical stack edges
retain their current fixed artwork colors.

## Loading, errors and lifecycle

A composite reports ready only when every required layer for its current logical
artwork has loaded/settled. Theme-only tint changes do not restart image loading
or readiness. An artwork/locale change creates a new load generation; callbacks
from an old generation cannot mark the new artwork ready or failed.

Any native layer error switches that complete composition to its existing fixed
fallback PNG. No partially rendered artwork is accepted as ready. A successfully
loaded fallback is ready in a degraded fixed-artwork mode; it must not trigger a
parent fatal-error callback that would hide the usable fallback. Only fallback
failure notifies the existing reader retry/error path and uses the localized
artwork-error placeholder. Placeholder settlement also releases overlay readiness
so the user can see the error and close/retry. Completion/error signals are
deduplicated per generation; callbacks from abandoned layers are ignored after
the fallback starts. An existing explicit retry starts a fresh composition attempt.

A bounded 1500ms composition load wait handles missing native callbacks through
the same fallback path, avoiding indefinitely preparing detail overlays. Cancel
that wait on unmount/generation change. The fallback has its own bounded 1500ms
load wait; a missing fallback callback becomes a terminal error/settled placeholder,
so a composition cannot wait indefinitely in either mode. Fixed single-image
callers retain their current behavior. Preserve selected-card retry and safe overlay close/fade rules;
exact callback wiring is left to the builder with behavioral regressions.

## Testing pack and acceptance

Quiet Garden demonstrates layered rendering on its back and all 20 fronts.
Preserve existing shapes/illustrations and complete fallback PNGs. Author themed
background/accent regions alongside fixed illustration/paper regions, so tests
can prove fixed colors stay fixed while named regions change. On the back, the
field and ornament colors follow the theme; the cream outer edge remains fixed.
The alternate deck remains wholly fixed as the compatibility fixture.

Exercise three real resource cases: complete fixed artwork; fully theme-tinted
mask composition; mixed fixed illustration plus themed masks. The testing pack
may share common masks where shapes match. Include localized front/back override
fixtures without requiring localized production images where none are needed.

Verify pure validation/resolution, layer order/tint/fixed regions, intrinsic
sizing, fallback/readiness and stale callbacks. Integration covers all rendering
surfaces, every theme, mid-shuffle/mid-flip/reading theme changes, fixed alternate
decks, both locales, session/image identity and deck replacement. Run affected
checks while developing, one complete final integration check set, resource
validation and Android export. Inspect an offline contact sheet; native drawing,
clipping, loading, accessibility and performance require phone review.

## Scope and status

This is a shared artwork contract/renderer feature, not a card editor, runtime
pack downloader, SVG engine, custom color editor, theme selector redesign or
slider repair. Assets remain offline. No dependency is needed for native PNG
mask tinting. No new commit or push requested. The user approved this written design with “Ok i agree start implementing.”
Builder review returned “nothing important left.” Implementation proceeds inline.

## Implementation and verification

Implemented the additive resource contract and shared native renderer. Runtime
composition uses fixed PNGs plus alpha masks, with complete fallback images and
two bounded loading phases. Already-loaded shared masks remain cached across
successive cards; stale generation events and retry events are guarded. Back
terminal failures expose localized recovery above the dock, and a dedicated
artwork retry preserves session/clock identity. Draw/reader fitting now also
accepts authored dimensions while default2:3 geometry stays unchanged.

Quiet Garden1.2.0 supplies21 definitions and25 new RGBA layers; original fallback
and alternate images are unchanged. The [authoring guide](../../../mobile/docs/card-artwork.md)
describes the final format and localized examples. See [verification](../../2026-11-06-theme-aware-card-artwork-validation.md)
for44 suites365 tests,144 domain cases, static/resource checks, final export and
remaining phone acceptance. No commit or push.
