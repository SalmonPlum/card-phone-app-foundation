# Shuffle fabric: stage 4 validation

Implemented 2026-11-04 after the user accepted the hint at the bottom inside the
colored frame and authorized fabric styling. Stop here for phone review.

## Result

- A subtle original woven texture replaces the six decorative dots inside the
  shuffle mat. Base colors remain resource-defined. Current opacity is 0.26 for
  Mystic Arbor, 0.22 for Celestial Midnight and 0.24 for Solstice Ochre.
- Optional `shuffleSurface: {texture, opacity}` lives in the theme resource.
  Omission or opacity 0 gives a plain mat. Validation rejects unknown texture keys,
  malformed entries and nonfinite/out-of-range opacity.
- One neutral transparent raster family is bundled offline, with 128px/256px
  variants representing a 128dp tile. Native repeat avoids rendering thread grids
  or per-frame JavaScript texture work. No dependencies/network requests added.
- The static noninteractive image is behind all card surfaces, clipped by the
  existing rounded mat. It is hidden from accessibility. The accepted bottom hint,
  tap handling, mat bounds, session ownership, artwork and motion code are unchanged.
- The stdlib-only generator uses periodic warp/weft relief and grain. A local
  preview of all three color treatments was visually inspected; this is not a
  screenshot or native phone acceptance. All variants together are 84,607 bytes.

## Verification

- Resource validation, optional/plain rendering and missing scene texture tests
  observed RED→GREEN. Five affected Jest suites passed **70 tests**: surface,
  native clocks, draw interaction, router/session retention and measured layout.
- Android export initially rejected an explicit `@2x` require. Inspection of the
  installed Metro resolver confirmed that density-suffixed imports are rejected.
  The registry now imports the base filename and the generator emits both density
  variants. The affected surface/native-clock suites then passed **31 tests**.
- Final domain: **113 passed**. Asset checks inspect PNG dimensions/transparency
  and conservatively verify on-mat label contrast of at least 4.5:1 against both
  black/white relief at the largest actual alpha.
- Final TypeScript/full lint, deck/translation validation (13 card PNGs, 48 keys
  per locale) and theme/font validation passed. Duplicate test-import lint warnings
  were corrected before the final clean lint run.
- Final Android Metro export to `/tmp/cards-theme-stage4-final-export` passed,
  including both texture variants. No unrelated whole-app Jest rerun.
- Scoped review found no blockers and rechecked the density correction.
- Final diff/Markdown-link checks passed. User-owned baseline changes preserved.

## Pending phone checks

Check all themes for a cloth-like appearance, visible repeat seams, aliasing or
moiré, hint readability and clipping at narrow/large-text sizes. Inspect full
shuffle cycles, foreground reveal and the 900ms exit for texture/image flashes or
frame drops; switch themes with a session paused and resume. Mocked animation and
asset contrast checks do not establish native repeat quality or frame performance.

Settings layout polish remains explicitly requested. Optional theme-aware backs,
later theme-aware faces and card-name search remain separate work.


## Phone-reported coverage correction

The user reported only a small top-left texture square. Both installed native
Image implementations reproduced the root cause: source width/height 128 remain
in force when the supplied style contains only absolute edges. Explicit 100%
width/height now override intrinsic sizing while the native source stays 128×128
and repeat mode remains enabled. Two new native-wrapper regressions observed
RED→GREEN. Phone confirmation of full-frame coverage is still pending; the
initial preset-Image tests and palette preview did not establish that behavior.

Coverage-fix checks: 4 affected suites / 47 tests, TypeScript, scoped lint and
diff checks passed. No unrelated suite/export rerun for this sizing-only fix.


## Checked tablecloth appearance

After confirming coverage, the user asked for more visible checks/tablecloth
character. All three resources now choose `checked-cloth`, with 32dp gingham
squares over a fine weave. A new 1x/2x original tile family adds 55,240 bytes;
existing opacity/base colors and the full-parent image sizing fix remain.
The previous subtle `woven-linen` is retained as an authoring option. Large
light/stripe/crossing patches have an asset regression; contrast is checked over
actual relief RGBA samples. Local palette preview inspected; new check scale,
appearance and seams still need phone review. No runtime component/engine changes.

Checked-style verification: 47 affected Jest tests, 114 domain tests, TypeScript,
scoped lint, deck/theme validation, Android Metro export and diff checks passed.
Phone appearance remains pending. No dependencies or runtime animation changes.

## Larger checks after phone feedback

The user requested 2.5× larger checks. Changed checked-cloth squares from 32dp to 80dp and the logical tile from 128dp to 320dp (320px base / 640px @2x). Fine weave repeats independently at its original scale. The new family totals 176,952 bytes. Updated the native sizing fixture and macro-pattern samples; 114 domain tests, four affected Jest tests, TypeScript and diff checks passed. Phone appearance remains pending.
