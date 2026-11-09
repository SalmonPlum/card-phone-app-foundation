# Theme-aware card artwork — validation 2026-11-06

Implemented the approved resource contract and runtime layered renderer for both
fronts and backs. The user prioritized functional real-pack authoring/rendering;
the user confirmed it works on their phone on 2026-11-09. This establishes
functional phone acceptance, without asserting exhaustive performance or
accessibility review. No commit or push requested.

## Delivered behavior

- Define each card once. Optional versioned `artwork.assets` descriptions paint
  ordered fixed-color images and masks tinted from named `background` / `accent`
  theme roles. No theme IDs, per-theme card definitions or per-theme image copies.
- Existing logical front/back/localized keys remain. Each layered key retains a
  complete fixed PNG fallback; fixed and legacy packs keep their single-image
  path. Definitions validate before sessions mount.
- One renderer and common size lookup cover drawing, Catalogue, results, measured
  overlays and direct details. Stable layer/raw-source keys retain images across
  theme changes. Changing dimensions also fits draw/reading/hitboxes correctly;
  default 600×900 poses and existing animation durations remain unchanged.
- Composition readiness requires every layer. Missing callbacks or layer failure
  switch to the complete fixed image after at most1500ms; fallback has a separate
  bounded1500ms wait. Successful fallback is usable, not fatal. Terminal failure
  settles the existing placeholder/readiness path. Old/duplicate callbacks cannot
  settle a different artwork/locale/retry generation.
- Shared raw masks already loaded for a previous card remain loaded without
  waiting for native events that an unchanged source does not emit.
- Terminal back errors now produce a localized placeholder and accessible Draw
  alert/retry above the dock, including foreground phases. Dedicated artwork
  retry generations do not reset sessions, frame clocks or card surfaces.

## Testing pack and resource files

Quiet Garden is version1.2.0, still20 cards with original numeric IDs, order and
complete bilingual text. Its21 logical front/back definitions use25 new explicit
RGBA layers, sharing front masks. The original25 complete PNGs, including the
alternate fixed deck, retain their exact SHA256 hashes. Total registry:50 PNGs.
The generator authors regions explicitly rather than replacing colors in a
flattened finished image.

A three-theme back/seed/lantern contact sheet was rendered and inspected at
`/tmp/cards-artwork-contact.png`. Pixel checks confirm the paper edge remains
fixed while the authored field takes each theme's background color. This proves
offline composition intent; native tint/alpha/clipping still needs phone review.

Authoring reference: [Card artwork](../mobile/docs/card-artwork.md), with exact
resource fields, full-canvas exports, mask alpha, role/fallback/opacity semantics,
localized examples, immutable source identities and validation instructions.

## Verification evidence

Initial integrated Jest run passed **44 suites / 361 tests**. Full TypeScript,
ESLint, deck/theme/font validation and Android Metro export passed. Resource
validation covers50 PNGs,56 interface translations per locale,3 themes and11
font faces with108 required Czech/English glyphs.

Initial domain run passed143 of144 tests. The only failure was an existing PNG
metadata assertion that omitted the newly exposed `hasAlpha` field. Its assertion
was updated; all4 affected asset-file tests passed. The final affected domain run
passed37 tests including resource validation, authoring files and draw/reading
geometry. Combined domain verification covers all144 cases with no unresolved
failure; unchanged results were reused.

Independent scoped review found one P2: terminal back-art failure had no visible
recovery. The integration reproduction and explicit-retry loading regression
observed RED, then GREEN after localized placeholder/alert and generation-safe
retry. Six affected suites /76 tests passed, plus TypeScript/scoped ESLint.
Two additional localized front/back composition regressions passed in their two
suites /36 tests. Combined verification covers **44 suites /365 tests** (78 tests
across the six post-review affected suites). No material review findings remain.

A final Android export after the recovery fix passed:
`/tmp/cards-artwork-final-android-export`. Source dimensions, layer count and
registration validations remain valid; no new dependency/native code is involved.

Useful logs: `/tmp/cards-artwork-final-jest.log`,
`/tmp/cards-artwork-final-domain.log`,
`/tmp/cards-artwork-final-affected-domain.log`,
`/tmp/cards-artwork-review-fix-green.log`,
`/tmp/cards-artwork-localized-green.log`,
`/tmp/cards-artwork-post-review-export.log`.
RED evidence includes contract/loading/fixture regressions, shared-mask reuse,
nonstandard draw dimensions, and terminal back retry.

## Phone acceptance (2026-11-09)

The user reported “Yes it works on my phone.” Functional phone acceptance is
recorded. The cases below remain a detailed checklist; the general confirmation
does not establish that each was individually exercised.

## Detailed phone checks

- Reload and switch all three themes: back field/ornament and front frames/details
  change automatically while fixed illustrations and paper regions remain fixed.
- Inspect Catalogue, results, direct details, drawing/manual reveal and reading;
  check mask alignment, antialiased alpha, rounded corners and native proportions.
- Change theme during shuffling, before/after the flip midpoint and while reading.
  Confirm no flashing reverse, restarted clock, lost session or reading position.
- Test successive draws, tab/background/resume, both locales, larger app/OS text,
  reduced motion, fallback/retry and screen-reader navigation.
- Check frame performance and memory with layered stacks and the20-card grid.

Automated scheduling tests and Metro export do not establish native smoothness,
loading under suspension, tint compositing or accessibility acceptance. Slider
repair, unrelated dependency security work and release/device checks remain open.
