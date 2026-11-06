# Current status and next work

## Accepted UI checkpoint and next feature (2026-11-06)

The user accepted the Settings polish and the corrected theme font sizing on the
phone, then agreed to a checkpoint commit before the independent font-size
feature. This supersedes the earlier working-tree-only notes for those accepted
changes. Preserve the user-owned local Expo edits and raw audit report outside
the checkpoint; no push is requested here. Reuse the valid verification below
because the implementation is unchanged.

The user agrees with Small / Standard / Large choices, saved independently of
theme and retained across theme changes, while respecting OS accessibility text
size. The next design will define exact scale factors and text scope before
implementation.

## Theme type sizing and clipped card names (2026-11-06)

After giving positive phone feedback on Settings (“Looks good. Is enough for
now”), the user reported slight bottom clipping of detail card names in some
themes and requested the same visible type size across themes despite different
fonts. Investigation found differing resource sizes and negative line leading:
the bundled title fonts' natural line metrics exceeded the configured line
heights. React Native's installed Android `CustomLineHeightSpan` reduces first/
last-line bounds when this happens; glyph measurements also showed descenders
exceeding the available bottom extent.

The three shipped theme resources now use Mystic Arbor as the visible-size
reference: heading cap heights and body/UI x-heights match within rounding;
each role has common conservative line spacing. Card-title line height is 48dp,
with nominal font sizes 32 / 29.13 / 29.67dp for Garamond / Noto Serif / Literata
(approximately 20.8dp cap height). Resource versions are 1.0.1. Fonts, weights,
system scaling, dynamic header measurement, artwork and animation are retained.
`inspectFont()` exposes actual bundled TTF sizing metrics for regression checks;
no new dependency or runtime font-specific renderer logic was added.

See [sizing diagnosis and verification](2026-11-06-theme-font-sizing-validation.md).
Verification: 116 domain tests passed. The full Jest run plus two affected-suite
reruns after updating stale size assertions cover all 34 suites / 271 tests.
TypeScript, full lint, font/theme validation and diff checks passed. A font sample
using the actual offline files was rendered and inspected; it is not native UI
acceptance. Independent scoped review approved the fix; its stale authoring
example finding was corrected in documentation.
The user subsequently reviewed this correction on the phone and said “Looks
good.” Retain it as the accepted visual baseline; this does not establish every
large-text, wrapped-name, accessibility or lifecycle check. This is a correction
to the previous theme-specific metrics, not implementation of the independent
font-size preference below.

## Requested next iteration: independent font size

The user requested a font-size control independent of the selected theme. Save
this for the next iteration: theme choice should not determine the user's size
preference. Decide the available size choices, persistence and interaction with
OS text scaling when planning that feature. It is not part of the current
clipping/consistency fix. Preserve accessible scaling and measured readers.

## Settings visual polish (2026-11-06)

Implemented the [approved Settings design](superpowers/specs/2026-11-06-settings-visual-polish-design.md)
in the existing feature checkout after the user said “Go implementing.” Language
and reveal mode now use compact grouped controls; theme cards include four
resource-derived color swatches and visible radio selection. Active theme fonts
and selected foreground/background pairs are retained. Binary controls stack at
widths below 360dp or font scale at least 1.3; labels remain unrestricted and
touch targets are at least 48dp. Save errors/retries and measured dock-height
scroll-end clearance remain intact. No providers, artwork, animation, session
behavior, translations or dependencies changed.

Verification: new responsive/palette cases observed RED before implementation,
then all 10 Settings tests passed. The two affected navigation suites passed
26 tests. TypeScript, scoped ESLint and tracked diff checks passed. Independent
scoped review found no blockers or minor findings. The existing unchanged
foundation full-check results remain valid for untouched areas; no new full-suite
run, Metro export, release build or physical-device check was performed.

The user gave positive phone feedback on Settings and considers its polish
sufficient for now. This does not establish every specific accessibility/device
check. Remaining checks: inspect all three themes, English/Czech, large system text,
final-card/retry scrolling above the floating menu and screen-reader navigation.
Mocked tests do not establish native text measurement, visual/touch acceptance
or screen-reader traversal. Keep the current implementation in the working tree
for that review; no additional commit/push was requested. Optional theme-aware
backs, later faces, Catalogue search and saved animation/security follow-ups
remain separate work.

## Foundation Git checkpoint (2026-11-06)

The user authorized a foundation checkpoint commit and supplied
`https://github.com/SalmonPlum/card-phone-app-foundation.git`; it is configured as
`origin`. This supersedes the staged plan's earlier statement that no commit was
requested. Checkpoint `1201b3a` was created locally; after GitHub DNS resolution
failed in the agent environment, the user pushed it themselves and confirmed
success. The local branch now tracks `origin/feat/android-foundation`. Preserve
the existing history and branch.

Fresh checkpoint verification: 34 Jest suites / 266 tests, 114 domain tests,
TypeScript, full lint, deck/translation validation and theme/font validation all
passed. Staged credential-pattern scan found no matches. Application/document
diff whitespace checks passed with upstream font license files excluded; those
licenses are preserved verbatim. This checkpoint does not establish Android
release or physical-device acceptance, and the existing security follow-up
remains open. No new Metro export or security suite was run for this commit.

Keep user-owned `mobile/.gitignore`, `mobile/expo-env.d.ts` and the raw
`mobile/npm-audit-after.json` outside this checkpoint. Settings visual polish is
the recommended next task; optional theme-aware backs and Catalogue name search
remain saved work. The current accepted animation/fabric baseline is unchanged.

The user authorized continuing with Settings visual polish after pushing the
checkpoint, chose the grouped-controls/theme-preview direction, and approved
the written design. Implementation and remaining phone review are recorded in
the latest checkpoint above.

Updated 2026-11-04 from the user's instructions. This file records the current task order; older implementation checklists and phase-one notes are historical and must not override it.

## Latest checkpoint: staged theme implementation (2026-11-04)

Latest confirmation-exit refinement: the user reported seeing the card back again while the drawn face closes. Investigation found the UI frame continues to select the face during resume, but the reverse image and selected-stack edges were still painted beneath it during parent-opacity fading. These overlapping layers are a plausible native fade bleed-through source; mocked tests cannot establish the exact phone pixels. Selected backs and edges now become invisible at the same UI-frame flip midpoint that reveals the face, and stay hidden throughout reveal/confirmation exit. The back returns for subsequent face-down phases; all image hosts remain mounted. The accepted 900ms exit, drift, reader pose, cover fade and session guards are unchanged. Regression observed RED for visible reverse beneath the revealed face, then GREEN; 79 affected tests passed, and the strengthened 29 native-clock tests additionally verify manual/automatic flip visibility, hidden edges and closing visibility. TypeScript, scoped lint, Android export and diff checks passed. The user subsequently tested the change on the phone and said “Looks better.” Keep this version as the current baseline; broader animation polish remains saved future work, and this feedback does not establish exhaustive lifecycle/accessibility/performance checks.

Latest detail-reader correction: the user reported that drawn-card details still ended above the floating menu. Root cause: dock padding was applied to the whole Draw screen, including its reader. Draw now fills the viewport; only the shuffle/control scroll reserves the dock height, while reveal geometry uses the equivalent reduced usable height to preserve its position. The reader extends to the bottom and receives dock-height scroll-end padding. Shared Catalogue/results detail readers likewise use scroll-end padding instead of shortening their viewport; their artwork fitting still clears the dock. Native image hosts, reading/session identity and animation timing are preserved. Regressions observed RED for root Draw padding, then GREEN: 102 tests in six affected suites, TypeScript, scoped lint and diff checks passed. Native visual/scroll acceptance remains pending. This supersedes the whole-Draw padding and shortened detail-reader viewport described below.

Latest bottom-menu correction: the user clarified that cards must be visible underneath and around the rounded menu. Making the wrapper transparent alone did not achieve that: Tabs still allocated a separate bottom strip. The dock now floats with absolute positioning; Catalogue/results hosts extend underneath it, and grid content gets measured dock-height end padding so final cards can scroll clear. The wrapper uses `box-none` outside the pill so underlying content receives gestures; blocked overlays still disable the dock. Draw retains its former usable bounds through equivalent measured bottom padding, Settings gains scroll-end padding, and collection detail fitting/reading uses the dock height as its bottom inset. Card image identity, sessions and animation math/timing are retained. Regression observed RED for the old in-flow dock, then GREEN: 65 affected tests across five suites, including six layout fixtures for Catalogue/results and draw clearance; TypeScript, scoped lint, Android export and diff checks passed. Native appearance/scroll/touch acceptance remains pending. This supersedes the earlier transparent-wrapper-only attempt. The user accepted the larger checked fabric on the phone.

Latest scale refinement: the user found the checks too dense and requested 2.5× larger squares. Checked cloth now has 80dp squares (previously 32dp), with a seamless 320dp tile and independently repeating fine weave. Colors, opacity, full-frame sizing and animation are unchanged. Updated native asset-size regression covers the new 320dp source. Verification: 114 domain tests, four affected Jest tests, TypeScript and diff checks passed. The user subsequently accepted the larger checks on the phone.

Latest fabric refinement: the user confirmed texture coverage is good, but asked for a more checked/tablecloth appearance. The three theme resources now select `checked-cloth`: gingham checks (initially 32dp, now 80dp per latest feedback) with fine woven relief underneath. Theme base colors and opacity are retained; the subtler `woven-linen` tile remains available as a resource option. Native full-frame sizing, the accepted bottom hint, card surfaces and animation logic are unchanged. New pattern appearance awaits phone review; this feedback confirms the previous coverage fix, not every performance/accessibility check. Checked-style validation: 47 affected Jest tests, 114 domain tests, TypeScript/scoped lint, deck/theme checks, Android export and diff checks passed.

Latest phone bug/fix: the user reported that fabric covered only a small top-left square. Root cause reproduced with both installed native Image wrappers: asset dimensions (128×128) override edge-only absolute positioning. `ShuffleSurface` now explicitly sets image width and height to 100% of its full-frame parent, while retaining native repeat and the original tile size. New iOS/Android boundary regressions observed 128px RED, then full-parent sizing GREEN. The user subsequently confirmed the texture is good across the frame, then requested the checked-style refinement recorded above. Initial mocked Image tests/export did not establish native coverage.

**Stage 4 fabric background is implemented in the working tree; stop here for phone texture/performance review.** See [fabric validation and phone checklist](2026-11-04-shuffle-fabric-validation.md). All three themes now use a subtle offline woven tile with resource-defined intensity and a plain-mat opt-out. The accepted hint stays inside the bottom of the colored frame. Card artwork, image hosts, geometry, tap guards, session identity and motion timing are preserved. No dependencies were added. Settings layout polish, optional theme-aware backs and later faces/search remain separate work.

Fabric verification: five affected suites / 70 tests passed; after fixing density-variant asset registration, two affected suites / 31 tests passed. Final 113 domain tests, TypeScript/full lint, deck/theme checks, Android Metro export and diff checks passed. Scoped review rechecked the density fix with no blockers. A local palette preview was inspected; actual native repeat appearance, seams/moiré and frame performance still need phone evidence.

Latest phone feedback: the user accepted the hint inside the bottom of the colored shuffle frame (“looks good”). Keep this as the current placement. The stage-4 fabric background is now implemented as recorded above; do not relocate the accepted hint. Settings visual polish remains separately requested, followed in the saved theme roadmap by optional theme-aware backs. This feedback does not establish Settings visual acceptance or exhaustive device checks.

Latest draw refinement: the user moved “Tap to draw a card” **inside the colored shuffle frame at its bottom**. Implemented as centered, bottom-inset localized text within the mat's existing draw Pressable, using theme caption typography and `onMat` foreground for contrast. It remains hidden when drawing is unavailable and does not participate in layout, so queued/paused/reveal transitions cannot resize the mat. This replaces the prior outside/below placement; page titles remain removed. Fabric styling and larger Settings layout polish remain separate. English/Czech placement/action regressions observed RED→GREEN; draw interaction/native-clock, TypeScript/scoped lint and diff checks are recorded in the staged plan. Phone appearance remains to review.

Latest behavior decision (2026-11-04): remove redundant visible page titles because the bottom dock already names the destinations. Implemented: no top Draw/Draw a card page title, All cards/Catalogue, Settings or Drawn cards title, and no empty Catalogue header spacer. Retain the draw area's localized screen-reader action label, result counts/actions, card names and all detail/Settings section headings. This supersedes the earlier request to move the visible Draw a card instruction above the mat. Fabric styling remains pending; the larger Settings layout polish is still separate. Verification: seven affected Jest suites / 103 tests passed, TypeScript/scoped lint and diff checks passed; scoped review found no blockers. Phone spacing/appearance review remains distinct.

Latest phone feedback: the user reviewed stage 3 typography and said “looks good.” Treat this as positive visual acceptance of the current fonts/hierarchy, not proof that every large-text/accessibility/startup/performance check was exercised. The stage-4 fabric implementation is recorded above; the newer page-title removal decision supersedes moving the draw instruction. Settings visual polish remains separately requested; this feedback does not accept the Settings layout.

The user requested separate implementation steps and confirmed stage 2 theme switching works on the phone. **Stage 3 typography has positive phone feedback; stage 4 fabric is implemented and awaits its own phone review.** See [the staged plan](superpowers/plans/2026-11-04-theme-resources.md), [font verification and phone checklist](2026-11-04-theme-typography-validation.md), and [theme authoring](../mobile/docs/theme-authoring.md). CLI network access was restored; the earlier font-download blocker is resolved.

The three themes now use their own bundled fonts and resource-driven text metrics, including distinct card title/section/body styles across all readers. All 11 static faces and seven licenses are bundled offline. Startup prepares fonts and restores the selected theme before mounting sessions, with a bounded retry/system-font recovery flow. Theme changes preserve session/clock/image identity. Fixed artwork and motion are unchanged; the shuffle mat now has the separate fabric layer recorded above. Settings typography updates with the theme, but **Settings visual polish remains explicitly requested** after the user rejected its current appearance; this stage is not visual acceptance or a layout redesign.

Verification: full initial Jest 32 suites / 255 tests passed; after a review fix for stalled startup preference reads, four affected suites / 39 tests passed (including two new RED→GREEN regressions). Final 111 domain tests, TypeScript, full lint, theme/font checks (107 Czech/English characters per face), deck/translation validation, Android Metro export and diff checks passed. Independent review rechecked the startup fix and found no remaining blockers. `expo-font@58.0.10` was hoisted/directly declared with identical artifact/integrity and unchanged security overrides. The user gave positive phone feedback on font appearance; exhaustive layout/accessibility, native startup and performance checks remain pending.

Following positive phone typography feedback, shuffle fabric presentation is now implemented and awaiting phone review. Optional theme-aware backs, Settings layout polish, later theme-aware faces and card-name search remain saved work. Mystic Arbor is the initial resource default; all available themes come solely from the separately authored resource, without a second inclusion configuration.

## Agreed order

1. Completed 2026-10-28: the user checked the current results on their phone, said they look good, and authorized continuing.
2. The user confirmed the enlarged reveal works on the phone. Current refinement in the working tree: 900ms enlargement (previously 640ms) and a solid ivory (`colors.canvas`) cover. The user accepted the slower pace and requested full ivory coverage; the user accepted the solid cover, then requested a smoother confirmation exit. Base feature: the larger drawn-card reveal described in [the existing design](superpowers/specs/2026-10-26-large-card-reveal-design.md). The user confirmed this priority and authorized implementation. See the verification report below; preserve this work while handling subsequent feedback.
3. Implemented in the working tree; phone review pending: [fixed title and artwork shrinking on scroll](superpowers/specs/2026-10-28-card-detail-scroll-design.md), explicitly started after provisional acceptance of the drawing animation. Card name stays at the top; scrolling down shrinks the face to reclaim text space, scrolling to the top restores it. Applied to shared Catalogue/results details and direct links. See [verification report](2026-10-28-card-detail-scroll-validation.md).
4. Implemented in the working tree; phone review pending: [Settings and language selection](superpowers/specs/2026-10-28-settings-language-design.md). English defaults independently of device language; English/Čeština choices update all screens and persist only the locale. Settings is the third dock destination. Color palette remains a noninteractive Coming later placeholder; the reveal control was implemented in the next step below. See [verification/dependency report](2026-10-28-settings-language-validation.md).
5. Implemented in the working tree; phone review pending: [swipe-up reading after draw](superpowers/specs/2026-10-28-drawn-card-reading-design.md). Keep the initial large face, fixed name and tap-card confirmation; scrolling shrinks the same face and reveals shared detail content. This user-requested change supersedes face/name-only drawing inspection. See [verification](2026-10-28-drawn-card-reading-validation.md).
6. Implemented in the working tree; user feedback: “Looks good” (2026-10-28). Specific persistence/accessibility/lifecycle checks remain unverified: [automatic or tap-to-flip setting](superpowers/specs/2026-10-28-reveal-mode-design.md). Settings offers Automatic (default) / Tap to flip and saves the preference separately from language. Manual mode holds the enlarged back until touch, then requires a separate confirmation after flipping. The mode is snapshotted at draw acceptance; changing Settings affects later draws. See [verification](2026-10-28-reveal-mode-validation.md).
7. Implemented in the working tree; phone review pending: [deck-defined detail templates](superpowers/specs/2026-10-28-deck-detail-template-design.md). Canonical schema 2 defines headings/order once per deck and localized content maps per card. All sections render in every reader. Required bilingual sections are validated; raw schema 1 is normalized without content loss. See [verification](2026-10-28-deck-detail-template-validation.md).
8. Keep the dependency security follow-up and remaining Android release/device validation visible as outstanding work. They do not supersede the user's chosen next feature. No dependency remediation was performed as part of the reveal work.

Current refinement: option 1 (gentle fade and upward drift) was approved and is implemented in the working tree. After phone feedback that the 370ms fade still felt like a blink, face/name now fade and rise 16dp over the full 900ms return. The ivory cover uses the same reverse easing and duration as the 900ms enlargement, revealing the remaining stacks gradually throughout. Final-card confirmation waits for the same exit, keeping ivory behind it until results. See [the plan](superpowers/plans/2026-10-28-reveal-confirmation-exit.md) and [verification report](2026-10-28-reveal-confirmation-exit-validation.md). The user tested the slower exit and accepted it for now; further animation polish remains pending. This is provisional visual acceptance, not final animation sign-off. The detail-scroll redesign is now implemented and awaits its own phone review.

## Current checkpoint after reveal-mode settings

The user reviewed the reveal-mode result and said “Looks good” on 2026-10-28. Treat this as positive visual feedback; do not infer that restart persistence, accessibility or all lifecycle cases were exercised. The user subsequently authorized deck-template implementation; it is now implemented in the working tree.

Swipe-up reading and the automatic/manual reveal setting are implemented. Check back-only manual waiting, a deliberate reveal tap followed by separate confirmation, preference persistence, tab/background retention and after-flip reading on the phone. Settings language/persistence and the earlier detail layout retain their specific pending phone checks.

Deck-defined detail sections are now implemented too. Check representative custom sections and both locales on the phone. Palette selection/UI colors are now implemented as stage 2 above; fonts and visual refinements remain separate stages. Animation polish, security follow-up and Android release/device/accessibility/performance validation remain outstanding.

## Larger drawn-card reveal

The selected card should move toward the viewer and grow to fill most of the usable screen before flipping. Hold the complete face and localized name until explicit confirmation, then resume with the remaining cards. Preserve the accepted shuffle at 1.25×, persistent image surfaces, artwork proportions, and session/lifecycle guards. After the flip, swipe up to read meanings/descriptions inline while the same face shrinks; scroll to the top to restore it. This replaces the earlier face/name-only restriction at the user’s request.

The existing design proposes approximately 90% of usable width, constrained by available height, name/confirmation space, and artwork aspect ratio. The user confirmed the enlargement works and requested calmer travel and background emphasis; see [the refinement plan](superpowers/plans/2026-10-28-reveal-calm-tweaks.md). Do not restart discovery of the already confirmed sequence.

The enlargement is implemented in the working tree; see [the plan](superpowers/plans/2026-10-28-large-card-reveal.md) and [verification report](2026-10-28-large-card-reveal-validation.md). The user confirmed the initial enlargement works on their phone. The slower pace was accepted; the solid ivory cover was accepted, and the new gentle confirmation exit needs phone feedback; exhaustive layout/accessibility/performance checks remain distinct.

## Current implementation and evidence

- Drawn results use the shared catalogue grid/details presentation, retain draw order, and require explicit New session. Implementation `4c4dbe0`, constrained-screen fix `19433e1`, validation record `3bcb797`.
- The results plan records 21 Jest suites / 160 tests, 71 domain tests, typecheck, lint, deck validation, diff check, and Android Metro export passing. These are recorded earlier results, not fresh full-suite runs in this discussion.
- On 2026-10-28 the user reviewed the current results on their phone and said they look good. This is approval to continue, not evidence that every locale/font/accessibility/performance edge check was exercised. The user subsequently confirmed the initial larger reveal works; the requested pace/dim refinement needs its own phone feedback. Android release-build, native randomness, and 100-card device performance evidence remain outstanding.
- A fresh `npm run test:security` on 2026-10-28 produced 4 passes / 1 failure: the installed CLI Zod fails the bounded-array early-rejection check. The prepared override is not verified as installed. See [the security follow-up](../mobile/docs/security/follow-up.md); advisory status must be rechecked when that work resumes.
- Larger reveal verification: 10 affected Jest suites / 77 tests, 11 foreground/motion Node tests, TypeScript, lint, diff check and Android Metro export passed. These are the initial implementation results; the user then confirmed it works on their phone and requested the slower/dimmer refinement. Its latest checks are recorded in the refinement plan; device performance remains unverified.
- Latest calmer-reveal checks: 6 targeted Jest suites / 51 tests, 3 motion Node tests, TypeScript, scoped lint, diff check and Android Metro export passed. No whole-app rerun for this refinement.
- Solid canvas-cover refinement: 18 targeted native-clock tests and scoped lint passed; diff/whitespace checks passed. The user explicitly requires continuous fade-in with growth (transparent at start, fully opaque only at full size), which the implementation and midpoint regression verify.
- Latest phone feedback: the user accepted the solid-cover presentation and chose a plain confirmation instruction instead of a button under the card. Implemented localized “Pro potvrzení klepněte na kartu.” / “Tap the card to confirm.” with no colored/button-like caption. Card tap/accessibility action remains guarded. See [implementation and checks](2026-10-28-reveal-confirmation-instruction.md): 35 targeted app tests, 9 locale tests, TypeScript and scoped lint passed.
- Gentle confirmation exit: 10 affected Jest suites / 85 tests, 24 session/motion Node tests, TypeScript, scoped lint, Android Metro export and diff/Markdown checks passed. Independent scoped review found no blockers. Phone quality remains pending; no whole-app/deck/security suite rerun.
- Exit pace retuned from the initial 370ms face fade / 740ms overall exit to a full 900ms synchronized card/caption/cover fade, matching enlargement. Latest targeted checks: 4 Jest suites / 50 tests, 4 motion tests, TypeScript and scoped lint; see the updated exit verification report. No unrelated suite or bundle rerun for this timing-only refinement.
- Card-detail update implemented: fixed name/Close-or-Back, scroll-linked face shrinking/restoration, persistent collapsed return and compact reduced motion. Initial 14 affected suites / 128 tests passed; after the review fix, 3 affected suites / 30 tests passed. TypeScript, scoped lint and final Android export passed. Phone layout/scroll/a11y acceptance remains pending.
- Settings/language checks: 9 affected Jest suites / 68 tests, 9 locale tests, TypeScript, scoped lint, deck/translation validation and final Android Metro export passed. Review found an asynchronous native-write issue, fixed with delayed completion/rejection RED→GREEN tests. Existing FileSystem 58.0.11 was directly declared/hoisted from Expo using the identical cached artifact; existing security resolutions remain unchanged. Phone persistence/layout/a11y review is pending.
- Drawn-card inline reading: see [targeted checks and pending phone acceptance](2026-10-28-drawn-card-reading-validation.md). Shared Meaning/Description text is available after the flip, with fixed name, reversible face shrinking, safe tap confirmation and preserved 900ms exit.
- Reveal-mode setting implemented: Automatic/default and persisted Tap to flip; queued draw snapshot, untimed waiting, separate token-guarded reveal, existing flip/reading/exit retained. See [targeted validation and phone checklist](2026-10-28-reveal-mode-validation.md).
- Deck-defined sections implemented: schema2 template/order and required bilingual content maps, legacy normalization, explicit template propagation to all readers, migrated bundled decks without text/identity/art loss. See [targeted validation](2026-10-28-deck-detail-template-validation.md).
- User-owned changes to `mobile/.gitignore`, `mobile/expo-env.d.ts`, and `mobile/npm-audit-after.json` must be preserved.

## Verification agreement

During implementation, run tests for changed behavior and affected integrations. Broaden scope for shared code, dependencies, navigation, failures, or unresolved risks. Avoid full-suite runs after each small edit and avoid repeating valid checks against unchanged relevant code. Run any plan-required final full checks once after feature integration; subsequent fixes require affected checks, with broader reruns only when justified.

For enlargement, focus on destination geometry/full artwork, growth before flip, persistent native images/no jumps, confirmation, pause/resume, reduced motion, stale callbacks and session guards. Reuse existing coverage where it already exercises unchanged behavior. Physical visual quality and performance require phone evidence.

Documentation-only updates require link/content and diff review, not app test runs. Keep command output and progress reports concise to reduce token use.

## Correction to this session's recommendation

The assistant initially recommended security remediation first after reading the latest results plan and older status notes, overlooking the saved larger-reveal design and its place in the user's intended sequence. This was a context-reconciliation mistake, not a technical reason to delay enlargement. The user clarified that enlargement is next after checking the current results on the phone. That order is now explicit here and linked from the main entry points.

## Animation polish follow-up

The user tested the latest 900ms confirmation fade and said it is good for now, but explicitly requested that further polishing remain on the list. Keep the current implementation as the working baseline. Future polish should review the naturalness of fade/drift, card/name/cover coordination and the handoff back to drawing or final results on a phone. No additional timing or visual changes were requested in this acceptance message; do not silently treat the animation as finalized or reopen it ahead of other agreed work.

Palette selection/UI colors are implemented as stage 2; see [the requirement](superpowers/specs/2026-10-28-color-palette-setting-design.md) and the latest checkpoint above. This supersedes the historical Settings placeholder notes.

Palette artwork decision (2026-11-04): the user agreed to implement fixed faces with optional theme-aware backs first, while supporting decks whose face/back images remain fully fixed and only the UI changes. Theme-aware faces are explicitly deferred, including for the current cards, which the user said would benefit. This initial artwork decision is followed by the palette/resource implementation updates below; see the updated requirement above. Do not treat the proposed generated-PNG approach as an agreed technical decision yet.

Palette selection update (2026-11-04): the user chose **Celestial Midnight** and **Solstice Ochre** from Stitch. Their design systems and available screen HTML have been fetched and saved under `docs/design-references/stitch-themes/`; exact colors, font families and source links are recorded in the palette requirement above. This resolves the palette-choice question. Typography switching was subsequently confirmed below; Mystic Arbor is now the baseline resource default; font/artwork implementation remains staged.

Theme resource update and clarification (2026-11-04): themes change fonts so each has its own character. The user wants a separately authored resource file describing the themes, analogous to card resources. The app reads that resource and offers its themes; do not introduce a separate configuration step selecting which themes each final app includes. The assistant's earlier selection proposal was a misunderstanding and is superseded. The resource and its font/texture assets are bundled offline like cards; runtime import/download is out of scope. The implemented JSON resource declares its default; font loading and artwork rendering remain separate later stages. See the palette design for the resource requirement.

## Visual refinement priority

Phone feedback 2026-11-04: the user confirmed theme switching works on the phone and authorized stage 3 (offline fonts/typography). This is functional confirmation, not evidence that restart/accessibility/performance checks were all exercised. The user explicitly rejected the Settings menu's current visual quality ("looks horrible") and requested that **Settings visual polish** remain recorded as separate future work. Improve its layout, density, grouping and presentation using the supplied Stitch Settings reference; do not treat working controls or the font stage as visual acceptance of Settings. Do not fold a full Settings redesign into the typography stage.

Added at the user's request on 2026-11-04: improve the app's visuals, with typography as the most important visual concern. In card details, review font choice and make the font-size hierarchy between the card title, section headings and body text clear and readable. Review line height, spacing and font weight together with those sizes. Apply the resulting hierarchy consistently to Catalogue, results, direct-link details and inline drawn-card reading, preserving complete Czech/English content and system font scaling.

Carry this requirement into the next visual design/planning step alongside palette selection; color changes alone do not fulfill it. Exact fonts and sizes are not selected yet. Visual/readability acceptance requires phone review, including larger system text. This adds a priority to the saved work without authorizing an immediate typography implementation or changing the accepted artwork, animation and session behavior.

Additional requested visual changes (2026-11-04), saved for the same refinement work:

- Superseded by the later title-removal request: remove the visible “Draw a card” instruction entirely, alongside the redundant Catalogue/Settings/results page titles. Keep the mat’s accessible draw action and preserve card movement/usable shuffle area.
- Make the green shuffle background feel like fabric rather than a flat, boring surface. Plan a subtle cloth texture with readable contrast and verify its appearance and performance on a phone; bundle any texture asset offline.
- Draw more directly from the supplied Stitch project for fonts, type hierarchy, spacing and overall visual treatment. Revisit the [Stitch adaptation reference](superpowers/specs/2026-10-27-stitch-forest-restyle-design.md) and its local [Draw](design-references/stitch-forest/draw.html), [Catalogue](design-references/stitch-forest/catalogue.html) and [Details](design-references/stitch-forest/details.html) snapshots. They use EB Garamond for headings and DM Sans for body/UI text. Reassess the earlier first-pass system-font compromise during typography planning; exact font adoption remains to be decided, with offline bundling and Czech glyph support required.

## Future implementation: card-name search

Requested 2026-11-04: add a search bar to the all-cards Catalogue so users can find a card by its name. Saved for future implementation; this does not change the current visual/palette priorities. Define matching behavior and Czech/English handling during feature planning, and preserve access to the existing card details from matching results.
