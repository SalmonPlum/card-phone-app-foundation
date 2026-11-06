# Fixed title and scroll-responsive card details

> Execute inline from the saved user request. Use targeted regressions and one final scoped review; preserve unrelated work and user-owned files. No commit/push requested.

**Goal:** Keep the card name visible at the top while the artwork shrinks on downward scrolling, freeing reading space, and grows again when returning to the top.

**Spec:** `../specs/2026-10-28-card-detail-scroll-design.md`.

**Architecture:** Use one scroll view below a fixed measured title/action header. A static expanded-artwork spacer lets native scroll move the text naturally; a pinned opaque artwork band and persistent face shrink from the same UI-thread scroll offset. The band shrinks by the same distance that text rises, reclaiming visible text area without resizing the scroll viewport or causing scroll/layout feedback. The overlay's existing face remains mounted above that band; closing atomically samples its collapsed rectangle before disabling scroll-driven geometry. Reuse the reading layout for direct links.

## Constraints and choices

- Fixed wrapping Czech/English name and Close/Back at the top; no duplicate name inside the body. Full meaning/description remain readable with font scaling, safe insets and the measured dock.
- Full artwork aspect ratio; minimum thumbnail height `min(112dp, expandedHeight/2)` as an implementation choice for phone tuning. Collapse is tied 1:1 to downward scroll until that limit, then the image stays pinned. Negative overscroll does not oversize artwork; returning to y0 restores it.
- Keep tile opening/return ~420ms, one persistent face, grid scroll/focus, modal dock locking, Android Back, stale generation/lifecycle guards and fallback fade. No drawing animation, deck, randomness or session changes.
- Reduced motion uses a compact face from entry, giving reading room without scroll-linked size animation.
- Header height is measured before opening starts. Foreground geometry reserves this height, artwork and text space; narrow/long-title layouts must fit the host.

## Files and interfaces

- `overlayGeometry.ts`: extend `fitForegroundRect(...,headerHeight=64)` to fit below measured header and reserve text space. Add `readingFaceRect(expanded:Rect,scrollY:number):Rect` (worklet, aspect-preserving pinned-top collapse) and `compactFaceRect(expanded:Rect):Rect`.
- `CardDetailReader.tsx`: fixed name/action header, animated scroll view, static spacer and shrinking opaque band. Consumes card/locale, host bounds/insets, target rectangle, shared scrollOffset, headerHeight/onHeaderLayout, reducedMotion and action; no session/router mutation.
- `CardDetailsText.tsx`: shared meaning/description sections, optional name for compatibility. `CardDetails.tsx` re-exports text and uses the reader plus a persistent animated face for direct details.
- `CardDetailOverlay.tsx`: same preparation/open/close controller, reader always mounted for header readiness, body visible only while open, UI motion records whether scroll-driven reading is active. Sample the collapsed rect atomically during close; do not reset scroll before sampling.
- `CardCollectionScreen.tsx`: preserve grid/overlay contract and measured dock; adjust foreground sizing cap only if new measured-header bounds require it.
- `src/app/card/[id].tsx`: route's Back control joins the fixed reader header for valid cards; retain invalid-link recovery.
- Existing geometry/overlay/native-size/direct-detail/navigation/results tests plus `helpers/overlayClock.ts` native scroll scheduler adapter.

## Task 1: Shared reader geometry and persistent overlay

- [x] Add behavioral RED for name outside scroll view, face/band shrinking with scroll, growth at top, retained native face and closing directly from the collapsed pose. Add geometry tests for long measured headers, constrained hosts, full aspect ratio and bounds.
- [x] Implement geometry and reader; extend overlay readiness for measured header, shared native scroll and atomic close sampling. Use a coherent UI reading flag so old/new mappers agree at close. Keep text hidden through opening/closing while header can be measured.
- [x] Update native-boundary fixtures to report header layout as well as face layout. Verify partial/full collapse, overscroll, compact reduced motion, Close/Back while scrolled and source identity/return.

## Task 2: Direct detail consistency and verification

- [x] Reuse reader in direct details with fixed Back/name and the same collapse; retain complete text, locale-specific assets and native Image sizing safeguards. Separate text sections to avoid circular imports.
- [x] Run affected card geometry/overlay/details/navigation/results tests, TypeScript and scoped lint; export Android once after integration. Broaden only for concrete failures or shared behavior changes, not unchanged draw/domain/security/deck suites.
- [x] Obtain one scoped code review, resolve substantive findings with focused regressions, and record results/choices in Markdown. Leave physical text layout, native scroll feel and animation quality pending phone review.

## Progress

- User explicitly requested continuing this saved detail feature after provisionally accepting the drawn-card animation. The drawing animation remains accepted for now with polish pending; do not change it under this task.

## Completion record

Code complete; phone acceptance pending. Initial affected checks: 14 Jest suites / 128 tests, TypeScript, scoped lint and Android Metro export passed. Final review's reduced-motion preference issue was fixed with observed RED→GREEN; 3 affected suites / 30 tests, TypeScript, scoped lint and final Android export passed afterward. See [verification report](../../2026-10-28-card-detail-scroll-validation.md). No independent re-review or unrelated full-suite rerun.

Ruling: unknown reduced-motion preference is compact in direct details, matching the existing hook's no-movement policy and avoiding an expanded-to-compact jump.

Ruling: retain bounded fitting below the measured wrapping header rather than force source-tile enlargement on extremely short/large-title hosts. The default grid cap may then produce a smaller destination; record that as a constrained-layout phone check, not a claim of native visual acceptance.
