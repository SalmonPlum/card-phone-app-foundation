# Drawn-card inline reading — 2026-10-28

Implemented in the working tree; phone acceptance pending. No commit/push or dependency installation performed for this feature.

## Result

The user explicitly moved this task ahead of manual-reveal settings. After the existing enlargement and flip, the initially large, uncropped 2:3 face remains below a fixed localized name. Plain swipe-up and tap-card confirmation hints appear below it. Swipe up to shrink the same native image toward a thumbnail and read the shared Meaning/Description sections; return to the top to restore it. Information starts below the initial viewport and is hidden during the flip. This supersedes the earlier face/name-only restriction during Draw.

Card/thumbnail taps confirm; text/hint taps and drag completion do not. Explicit accessibility activation confirms independently of touch-drag history. Confirmation retains the current reading pose through the existing 900ms fade/rise and guarded final-card results handoff. The image keeps its existing parent throughout.

Reading uses a single native ScrollView with a static expanded spacer and a translated, shrinking hit target/opaque band. Full artwork fits approximately 90% width subject to height, measured fixed title and hints (hints reserve at most 25% height). Reduced motion preserves the large initial face, then changes directly to compact on scrolling. No session/domain logic, Back/route policy, flip settings or palette behavior was changed. The future deck template feature will replace the current shared renderer’s fixed two sections in this reader too.

## Verification

- Behavioral RED observed for missing swipe hint/information before implementation.
- Affected draw, navigation, results and session integration: **9 Jest suites / 90 tests passed**. One subsequently added lifecycle/alignment regression was checked with the **26-test native-clock suite**, all passing. These are targeted results, not a whole-app rerun.
- Geometry, foreground sizing and motion: **14 Node tests passed**.
- TypeScript and scoped ESLint passed.
- Deck validation passed: sample 8 cards, alternate 3 cards, 13 local PNG assets and **36 interface translations per locale**.
- Android Metro export passed: `/tmp/cards-drawn-reading-export`. This is bundling evidence, not a native device/performance test.
- Git whitespace/diff check passed.
- One scoped independent review completed. Initial pause-event concern was resolved by clarifying native alignment policy and adding a regression; no remaining concrete blocker identified.

Coverage includes initial full artwork, fixed top during collapse, matching face/hit target geometry, restore at y0, persistent native image, no information before flip, both locales, swipes/text versus intentional card tap, accessibility activation, stale press callbacks, new session/card offset reset paired with UI frame publication, stale native callbacks, collapsed confirmation exit, reduced motion, and same-card pause/language round trips.

## Pause alignment decision

Pause never resets the mounted reader. Intentional scrolling is disabled while paused. A delivered native scroll event still represents actual native content movement, so its offset updates the face, cover and translated hit target consistently. A pause-only guard that freezes artwork while content moves would create misalignment. The regression exercises a late paused event and resumed pose retention; actual momentum during tab/background transitions requires a phone check.

## Pending phone acceptance

Reload the existing development app; no native rebuild is required for this feature. Verify face-originated swipes, translated thumbnail hit testing, drag cancellation, tap after scrolling, long text/large fonts/wrapped names in English and Czech, safe-area placement, background/tab/language changes, native momentum, screen-reader reading/confirmation and natural 900ms return from a collapsed card. Automated Reanimated doubles cannot establish touch arbitration, visual quality or performance.

Previously saved animation polish, manual reveal, deck-defined sections, palette, security follow-up and release/device validation remain outstanding. Settings and earlier detail changes retain their own device acceptance items.
