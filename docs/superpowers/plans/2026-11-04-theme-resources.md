# Theme resources: staged implementation plan

**Goal:** Separately authored theme resources define colors and typography for the app, like card resources.
**Spec:** [Palette and resource requirements](../specs/2026-10-28-color-palette-setting-design.md).
**Execution:** Inline in the existing working tree; preserve all pending features and user-owned changes. No commits/push requested. The user explicitly requested separate steps, not implementation of everything at once. Steps 1–2 are implemented; the user confirmed stage 2 works on their phone and authorized stage 3. Continue one stage at a time. Stage 3 is implemented and the user gave positive phone feedback. Stage 4 fabric is now implemented; stop for phone texture/performance review.

## Stages

1. **Resource foundation (completed):** a separately editable JSON resource describes Mystic Arbor, Celestial Midnight and Solstice Ochre, including default theme, localized names, semantic UI/card colors and named typography roles. Pure TypeScript contracts and validation reject malformed resources. No changes to rendered UI, dependencies, fonts, settings or card artwork.
2. **Selection and UI colors (implemented; functional phone confirmation):** load the resource, persist the selected ID independently of language/reveal mode, offer its themes in Settings, and apply semantic UI colors across screens. Test restart, save/read races, stale IDs, active-session identity and dark-theme contrast. Review on phone before proceeding.
3. **Typography (implemented; positive phone feedback):** bundle the specified font families/weights offline and connect resource typography roles to all text surfaces. The user reviewed the result and said “looks good.” Specific large-text/accessibility/startup/performance checks remain distinct; Settings layout polish is not accepted by this feedback.
4. **Shuffle presentation (implemented; phone review pending):** resource-controlled woven texture behind unchanged card surfaces. Keep the accepted hint inside the bottom of the mat; earlier move-above instructions are superseded. Native repeat quality and performance need phone review.
5. **Optional theme-aware backs:** author explicit recolorable regions and choose generated image variants or runtime composition, keeping fixed-artwork decks valid. Preserve fixed faces, ratios and all session/lifecycle guards. Theme-aware faces remain a later follow-up.

## Step 1: resource foundation

**Files:** `mobile/src/themes/resource.json` (author-owned data), `contracts.ts` (pure types), `validateThemeResource.ts` (pure boundary validation), adjacent `__tests__/themeResource.node.test.ts`, and `mobile/docs/theme-authoring.md`.

**Contract:** `validateThemeResource(input: unknown): ThemeResource` validates schema version 1, nonempty theme array with unique safe IDs, version and bilingual names, an existing default theme ID, complete semantic UI/card color sets, and complete typography roles. Each role defines family, supported weight, positive finite size/line height and finite letter spacing. Do not hardcode initial theme IDs or font families in the validator. Return the original valid object without mutation. No runtime loader/provider until stage 2.

**Decisions for this step:** JSON is independent of application code. Keep Mystic Arbor as the resource default to preserve the existing baseline (implementation choice, not a claim the user chose a default). UI colors use semantic roles instead of forest/brass names. Card color roles describe optional future artwork inputs and do not recolor fixed artwork. Font family names are authoring metadata in this stage; font files/registration and availability checks belong to stage 3. Use source named colors and typography from saved Stitch design systems, adapting section-heading/body roles to the shared reader hierarchy. App code must not maintain a second list of allowed theme IDs.

- [x] Write resource tests: valid arbitrary theme IDs and custom fonts, duplicate IDs, missing defaults, malformed locales/colors/typography, no mutation, initial resource matches source themes.
- [x] Run the targeted Node tests and observe failure before implementation.
- [x] Add contracts, resource and validator; run targeted tests green.
- [x] Run domain tests, typecheck, scoped lint and diff checks; review resource data and authoring instructions. No UI suites/export required for this unconnected pure-data stage.
- [x] Update current status with verification and the next stage. Stop after step 1.

## Review focus

- Reject incomplete/invalid resources with a useful field path rather than silently applying partial themes.
- Allow another app to supply different theme IDs and font families without editing validator code.
- Reject missing default theme references and duplicate IDs.
- Validate finite text metrics and every required color/typography role.
- Keep theme metadata independent of native modules and card/session state; no runtime changes in step 1.

## Step 2: selection and UI colors

Authorized by the user's “continue” after step 1. Scope is colors only: retain system font families/sizes, current shuffle layout, fixed face/back assets and animation/session identity. No dependencies, font loading, texture assets or themed backs in this step.

**Files/interfaces:** `src/themes/index.ts` validates/imports the JSON resource; `src/themes/ThemeProvider.tsx` provides `useThemeSettings()` with resource themes, current theme, readiness, `setTheme(id)`, save-error/retry; `src/platform/themeStorage.ts` persists only the ID in a separate private file. `src/ui/useThemeStyles.ts` memoizes styles from the current semantic colors. Existing screen components switch static color styles to factories; no screen keys or session-provider keys depend on theme. Root provider surrounds the existing session tree and sets status-bar style from selected appearance.

**Rulings:** Resource default applies for absent/unknown saved IDs or a failed read. Explicit choices beat late reads; serialize writes and suppress stale save outcomes. Keep screen/session children mounted during startup hydration and theme changes. Invalid resources fail at the authoring boundary. Additional `onSelected` and `shadow` colors express selected-control contrast and dark shadow paint without theme-ID branches. Keep physical stack-edge colors fixed with the existing artwork. All Settings choices, including language/reveal selections, use the correct selected foreground. Text/font metrics remain unchanged until step 3.

- [x] RED→GREEN provider/storage tests: restore/default/stale IDs; remount persistence; read failures/races; ordered writes; delayed failures/retry; arbitrary resource IDs and defaults.
- [x] RED→GREEN Settings and color tests: resource-derived localized choices, selection/save errors, paired contrast in each supplied theme, independent language/reveal preferences.
- [x] Integrate root, all screens/readers, dock and draw cover colors; verify real router session/clock/image retention across theme changes and subsequent results/direct details.
- [x] Run full Jest once after integration (shared UI/navigation change), domain, typecheck, lint, deck validation, final Android Metro export, diff checks and scoped independent review. Repeat only affected checks after fixes.
- [x] Document resource roles, stage-2 validation and pending phone checks; update status and stop before fonts or other stages.

## Execution record

Started 2026-11-04. Repository is an existing feature checkout with substantial uncommitted work; resource-only additions stay in place to preserve that baseline. No worktree/branch creation, dependency installation or generated assets are needed for step 1.

Step 1 complete: five resource tests observed RED for the missing validator, then GREEN after implementation. Final `npm run test:domain`: 103 tests passed, zero failures. `npm run typecheck`, scoped ESLint on the three new TypeScript files, and `git diff --check` passed. Independent scoped review found no blockers or important issues. No UI, artwork or dependency changes; no app Jest/export/device runs for this disconnected data stage. Authoring instructions are in `mobile/docs/theme-authoring.md`. Stop here; stage 2 is next, not started.

Step 2 implemented 2026-11-04. Full Jest: 30 suites / 243 tests passed. After adding two extra phase-clock regressions, the affected router suite passed 18 tests; unchanged suites retain their full-run results. Domain: 105 passed. TypeScript, full lint, deck/translation validation (13 PNGs, 44 keys per locale), Android Metro export and diff checks passed. Provider/storage, resource/contrast and Settings tests observed RED→GREEN. Independent scoped review found no blockers. Final post-test scoped lint/typecheck and documentation checks are recorded in the validation report. No dependencies, fonts or artwork were changed. Phone acceptance is pending; stop before stage 3. See [validation](../../2026-11-04-theme-colors-validation.md).

## Step 3: offline fonts and typography — implemented; phone review pending

The user confirmed that stage 2 works on their phone and authorized continuing.
They separately requested Settings visual polish because its current appearance
is unacceptable. Record that as future design work; stage 3 does not redesign
Settings layout or implement shuffle styling/themed artwork.

Initial attempt was blocked before stage-3 product changes. Downloads through
both normal and elevated execution failed DNS resolution for
`raw.githubusercontent.com` and `registry.npmjs.org`; browser fallback reported
that the browser access host is unavailable. Local font/cache inventory did not
contain the selected families. Do not substitute other fonts, fabricate files,
or claim the resource's family names mean the fonts have been bundled.

Resumed after the user enabled CLI network access and authorized testing downloads
and continuing. npm and GitHub are now reachable. Pin font source to Expo Google
Fonts commit `7d1c94f239a387cad7a8391c472741338331740f` and retain checksums/licenses.
Implement stage 3 only, then stop for phone typography review.

Ruling: preload all required static faces at initial startup before mounting the
session tree. A loading failure offers Retry and Continue with system fonts on a
readable localized screen. Continuing locks fallback fonts for that app run;
retry never changes metrics under an active session. Theme selection thereafter
changes already-loaded faces and resource metrics without remounting sessions or
image hosts. Use explicit face aliases with normal native weight to avoid
synthetic styles. Shared memoized style factories receive resolved typography
alongside semantic colors. Keep text scaling enabled and preserve measured headers.

- [x] Acquire 11 static faces and 7 licenses with pinned source/checksums; validate
  registrations and Czech/English glyphs.
- [x] RED→GREEN pure font-reference/role resolution and startup readiness/error/
  retry/fallback/stale completion tests.
- [x] RED→GREEN rendered title/section/body hierarchy and theme-font switching;
  connect all text surfaces without introducing layout redesigns.
- [x] Run full final app/domain/type/lint/resource/deck/export checks once, obtain
  scoped review, record pending phone acceptance and stop before stage 4.

### Required offline faces

Use static regular/upright TTFs with explicit aliases per family/weight, avoiding
platform-dependent synthetic weights. The official Expo Google Fonts repository
provides static face files and `LICENSE_FONT` for each family:
`https://github.com/expo/google-fonts/tree/main/font-packages/`.

| Resource family | Package directory | Required weights |
| --- | --- | --- |
| EB Garamond | `eb-garamond` | 500 |
| DM Sans | `dm-sans` | 400, 600 |
| Noto Serif | `noto-serif` | 400, 500 |
| Manrope | `manrope` | 400 |
| Space Grotesk | `space-grotesk` | 600 |
| Literata | `literata` | 500, 600 |
| Plus Jakarta Sans | `plus-jakarta-sans` | 400, 600 |

These 11 faces are derived from the actual resource roles; do not add unused
weights. Retain source/version/checksum and font license alongside bundled files.
Verify Czech and English glyph coverage, including diacritics and punctuation,
from font character maps before runtime integration.

### Implementation decisions and checks to resume

- Register font assets with Metro-visible literal paths, with pure metadata for
  family/weight/asset validation; document resource authoring and font registration.
  No second list of allowed theme IDs or theme-specific renderer branches.
- Declare the already installed Expo-compatible `expo-font` version directly from
  the existing lock/cache (currently nested version 58.0.10); inspect lock changes
  and preserve the security baseline. No unrelated dependency upgrades.
- Resolve each resource text role to an explicit registered face and its numeric
  metrics. Card titles, section headings and body must use distinct roles; section
  headings must no longer borrow the small UI-label style. Apply consistently to
  shared/direct details, drawn reading, catalogue, navigation and Settings text.
- Keep native text scaling enabled. Preserve measured headers and full content;
  test constrained layouts and retain artwork/session/animation identity.
- Decide startup font readiness at the root before session/image presentation,
  rather than unexpectedly changing font metrics during an active enlargement.
  Loading failures need a readable fallback and recoverable retry, with tests for
  stale/unmounted completions. Theme switching must use already available fonts.
- RED→GREEN tests for role resolution, missing family/weight registration, asset
  presence/glyph coverage, loader readiness/failure/retry and rendered title/
  section/body differences in all themes. Extend real router checks for session,
  image/clock retention and geometry after larger typography.
- Run relevant tests during development. Once integrated, run full Jest once,
  domain, typecheck/lint, resource/deck validation and Android export; obtain scoped
  independent review and leave physical font/layout/accessibility acceptance for
  phone review. Stop after stage 3.

Settings visual polish is a separately saved follow-up using the fetched Stitch
Settings screen: layout, density, grouping, hierarchy and visual presentation need
review. A working theme picker is not Settings visual acceptance.


Stage 3 complete in the working tree. Initial full Jest: 32 suites / 255 tests; after
review's stalled-theme-read fix: 4 affected suites / 39 tests. Final domain: 111 passed,
TypeScript/full lint, validate:themes, deck validation and final Android export
pass. Scoped review rechecked the fix with no remaining blockers. Source assets
are pinned/checksummed, and expo-font hoisting preserved version/artifact/integrity
and security overrides. Settings visual polish remains saved, not implemented.
See [stage-3 validation and pending phone checks](../../2026-11-04-theme-typography-validation.md).


## Subsequent small refinement: redundant page titles

User requested removing visible Draw/All cards/Settings titles because the dock
already identifies the destination. Removed the Draw a card caption and page
titles in Catalogue, Settings and results; preserved card names, detail/Settings
section headings, results count/actions and the mat's localized accessible action.
Catalogue no longer reserves an empty header row. This supersedes moving the
visible draw instruction above the mat; remaining stage 4 is fabric styling.

New real-router regression observed RED for the visible draw caption, then GREEN
for both locales after removal. Seven affected suites / 103 tests passed,
TypeScript/scoped lint and diff checks passed; scoped review found no blockers.
No unrelated suite/export rerun for this local presentation removal. Phone visual
spacing review remains pending. Settings layout polish remains separate work.


## Below-animation draw hint

Later user refinement: show “Tap to draw a card” beneath the shuffle animation,
without restoring any top page title. Implemented English/Czech plain caption
outside the mat and before the footer. It is visible only when drawing is allowed;
opacity/accessibility hide it otherwise while its layout slot stays mounted,
preserving mat geometry across queued/foreground transitions. The mat's existing
accessible action/guards remain unchanged. This does not implement fabric styling.

Verification: new bilingual hint regression observed RED, then GREEN. The
interaction suite passed 14 tests after correcting an unsupported TestInstance
query to RNTL within(); the unchanged native-clock/router/layout suites passed
53 tests in the integration run. TypeScript, scoped lint, deck/translation checks
(48 keys/locale), theme/font glyph validation and diff checks passed. No whole-app
or bundle rerun for this scoped caption addition; phone placement remains to review.


## Draw-hint placement correction

The user's latest preference supersedes the outside/below caption: place it
inside the colored shuffle mat at the bottom, centered with 16dp bottom/side
insets. The hint is a child of the existing full-mat Pressable, so touching it
uses the same guarded draw action. Use `onMat` text color, not canvas secondary
text. Absolute positioning keeps its geometry independent of enabled/queued/
foreground visibility; page titles stay removed. No animation-engine changes.

The user subsequently reviewed this placement and said “looks good”; keep it.
Remaining stage-4 work is the fabric-like shuffle background.

Placement correction checks: 2 affected suites / 42 tests passed; TypeScript,
scoped lint and whitespace checks passed. Phone placement/contrast review remains
pending. No unrelated suite or bundle rerun for this position/color-only change.

## Stage 4: fabric surface implementation

User accepted the hint at the bottom inside the colored frame and authorized
continuing with fabric. Preserve that hint, mat bounds, native card surfaces,
session identity and every animation path/timing. Settings polish and themed card
backs remain separate.

Implementation choice: one original procedurally authored seamless neutral RGBA
weave PNG, tiled behind the cards with native Image repeat. This avoids a large
view grid, per-frame effects and runtime asset/network work. Keep theme base mat
colors; add optional resource `shuffleSurface: {texture, opacity}` for each theme.
No surface entry means a plain mat. Validate texture keys and finite opacity 0–1.
Use a pure texture catalog plus literal native registry, analogous to deck assets.
Replace the old decorative dots with fabric; add no frame/layout changes.

- [x] RED→GREEN optional resource validation, plain fallback, resource-driven
  intensity and noninteractive persistent texture surface across draw phases.
- [x] Author/bundle the original tile and inspect a local preview in all three
  colors. Check its dimensions/alpha and conservative text contrast over relief.
- [x] Integrate the static surface behind existing image hosts; test draw/input,
  native clocks, theme/session retention and measured layout. Run domain,
  TypeScript/lint, resource/deck checks and final Android export. Scope review to
  this stage; no dependency or animation-engine changes.
- [x] Record device visual/performance checks and stop after fabric implementation.


Stage 4 execution: original repeat texture visually inspected in a local
three-palette preview. Resource/surface/scene tests RED→GREEN; five affected
suites / 70 tests passed. Metro rejected a direct @2x require; corrected to a
base-file require and generated 1x/2x variants (84,607 bytes total). The affected
surface/native-clock suites then passed 31 tests. Final domain: 113 tests, TypeScript,
full lint, deck/theme validation, Android export and diff checks passed. Review
rechecked density registration with no blockers. No dependencies or animation
engine changes. Stop for phone review; see [fabric validation](../../2026-11-04-shuffle-fabric-validation.md).


## Stage-4 phone bug: repeat image restricted to one tile

Phone feedback showed fabric only in the top-left square. Installed native
Image wrappers prepend intrinsic source dimensions; absoluteFill supplies edges
but does not override those width/height values. This reproduced in both native
platform implementations (received 128 instead of parent-relative sizing).
ShuffleSurface now explicitly sets width/height to 100% with repeat unchanged.
New real-wrapper iOS/Android tests prove the source remains 128×128 while the
image view fills its parent. Original assets, clipping, controls and motion are
unchanged. Recheck full-frame native repeat on the phone; earlier mocked Image
checks did not cover intrinsic sizing.

Coverage-fix checks: 4 affected suites / 47 tests, TypeScript, scoped lint and
diff checks passed. No unrelated suite/export rerun for this sizing-only fix.


## Checked tablecloth refinement

The user confirmed the coverage correction, then requested more visible checks
so the mat resembles a tablecloth. Added `checked-cloth` as a second resource
texture and selected it in all three supplied themes; the original subtle
`woven-linen` remains selectable by resource authors. Source bands produce light,
single-band and crossed-band tones in 32dp squares, with the existing fine weave
underneath. The original generator writes both patterns at 1x/2x. The checked
family totals 55,240 bytes; native image sizing/repeat and theme opacity are unchanged.

A new asset regression observed RED, then GREEN for distinct macro check patches.
PNG/contrast validation now checks actual RGBA relief samples for each selected
texture, rather than applying the largest dark-band alpha to hypothetical white
pixels. The new checks are mostly darker and preserve hint contrast. Variable
alpha is required, without assuming every pattern contains fully clear pixels.
A local three-palette preview was inspected; true phone appearance remains pending.

Checked-style verification: 47 affected Jest tests, 114 domain tests, TypeScript,
scoped lint, deck/theme validation, Android Metro export and diff checks passed.
Phone appearance remains pending. No dependencies or runtime animation changes.

### Floating bottom menu clarification

The user rejected the transparent-wrapper-only change because the Catalogue still ended above the menu. The menu must overlay the collection viewport so cards show around the rounded pill. Implemented absolute dock placement with measured scroll-end clearance, touch pass-through outside the pill, equivalent draw padding and detail bottom inset, plus Settings end padding. This replaces the older invariant that every tab host excludes the dock: collection hosts now extend to the bottom; draw/details continue to reserve usable space above the dock. Five affected suites / 65 tests, TypeScript, scoped lint, Android export and diff checks passed. Phone appearance and touch/scroll review remain pending.

### Detail reader follows the floating menu

Phone feedback exposed that whole-Draw padding kept drawn-card details above the menu. Move dock reservation into the shuffle/control scroll only and subtract it when computing the reveal target, leaving the reader viewport full height with measured scroll-end padding. Shared Catalogue/results detail readers also extend behind the menu and use end padding, retaining artwork bottom clearance. 102 tests in six affected suites, TypeScript, scoped lint and diff checks passed; phone acceptance remains pending.

### Hide reverse beneath closing face

Latest confirmation-exit refinement: the user reported seeing the card back again while the drawn face closes. Investigation found the UI frame continues to select the face during resume, but the reverse image and selected-stack edges were still painted beneath it during parent-opacity fading. These overlapping layers are a plausible native fade bleed-through source; mocked tests cannot establish the exact phone pixels. Selected backs and edges now become invisible at the same UI-frame flip midpoint that reveals the face, and stay hidden throughout reveal/confirmation exit. The back returns for subsequent face-down phases; all image hosts remain mounted. The accepted 900ms exit, drift, reader pose, cover fade and session guards are unchanged. Regression observed RED for visible reverse beneath the revealed face, then GREEN; 79 affected tests passed, and the strengthened 29 native-clock tests additionally verify manual/automatic flip visibility, hidden edges and closing visibility. TypeScript, scoped lint, Android export and diff checks passed. Phone feedback: the user said “Looks better.” Retain this version as the baseline; further animation polish remains future work.
