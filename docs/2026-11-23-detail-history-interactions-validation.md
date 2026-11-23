# Detail and History interaction refinements — validation 2026-11-23

Implemented the [approved behavior](superpowers/specs/2026-11-23-detail-history-interactions-design.md)
and [plan](superpowers/plans/2026-11-23-detail-history-interactions.md). The user
accepted the swipeable menu on the phone, requested artwork-tap dismissal and
long-press History selection, and accepted the proposed fixed top toolbar.

## Delivered

Catalogue/results/History details close on an artwork tap using the existing
transition and persistent image. Standalone details return through the same
focus-aware one-shot action as Back. Explicit Close/Back controls remain available.
The shared reader's hit area follows the painted rectangle in scrolling content,
including the scroll compensation for collapsed artwork. Native vertical scrolling
cancels the press. Active generation and duplicate guards prevent stale dismissal.
Screen-reader activation has an explicit action that remains usable after scroll;
standalone refocus restores its return action. Drawing reveal/confirm is unchanged.

History enters selection by holding a record for 500 ms or using its accessible
Select action. The first record is selected immediately; subsequent taps toggle
records. No visible Select entry or checkbox glyphs. Selected rows use theme
fill/border and contrasting `onSelected` ink. Accessible checked semantics remain.

The top Cancel/count/Delete toolbar is outside the FlatList, stays visible during
scrolling and can wrap at larger text sizes. Delete is disabled at zero and
retains confirmation/snapshot/live-ID behavior. Cancel and Android Back exit
selection. Release clears the temporary held-record guard synchronously: installed
React Native Pressability suppresses touch-release `onPress` after a long press,
so the next independent accessibility click must not be consumed. Counts remain
accurate after records expire or are removed; controller/storage/session logic
was not changed. Existing selection retention across tabs remains.

## Tests and review

Missing artwork actions and long-press toolbar behavior observed RED, then GREEN.
Regressions cover moving hit geometry (including vertical scroll compensation),
scroll cancellation, duplicate/stale/inactive action guards, standalone Back+image
one-shot behavior and refocus. Real router tests verify Catalogue/results/History
return behavior and that an old standalone callback cannot dismiss a newly pushed
detail. Live sessions and saved text/readings remain intact.

History tests cover first long press/release, toggling, row color/no glyphs,
fixed-toolbar placement, confirmation/deletion, Cancel/Back, custom accessibility
selection, zero count after removal and dark-theme selection contrast.

Fresh review found three P2 issues; each was reproduced RED and fixed GREEN:
artwork accessible activation after drag, held-record latch surviving normal
long-press release, and independent/unfocused standalone return actions. No
unresolved findings remain. Captured-handler regressions use the installed RNTL
fiber-aware handler lookup because its renderer exposes host-only props.

## Final automated checks

- Full Jest: **60 suites / 510 tests passed** after review fixes.
- Strict TypeScript and full lint passed without warnings.
- Deck/interface validation passed: both decks, 50 PNGs, 102 strings per locale.
- Final Android Metro export passed: `/tmp/cards-detail-history-final-android-export`.
- Diff/whitespace checks passed. Prior 177 domain results remain valid for unchanged
  domain/controller/storage code; no unrelated security/release check claimed.

Logs in `/tmp/`: `cards-detail-tap-red.log`, `cards-history-gestures-red.log`,
`cards-detail-history-review-red.log`, `cards-detail-history-review-green.log`,
`cards-detail-focus-integration.log`, `cards-detail-history-final-jest.log`,
`cards-detail-history-final-types.log`, `cards-detail-history-final-lint.log`,
`cards-detail-history-final-decks.log`, `cards-detail-history-final-export.log`.

## Pending phone review

Reload the existing client; no native rebuild or dependency is needed. Check
artwork taps and vertical drags at full/collapsed image sizes, closing animation,
standalone Back/image actions, History hold/release/toggle/cancel/confirmed delete,
large Czech/English toolbar layout, all-theme selection colors and screen-reader
activation/checked state. Automated native doubles do not establish physical
gesture feel, visual quality or accessibility acceptance.

No commit/push performed. Preserve existing uncommitted Info/swipe-menu work,
local Expo/audit files and machine-specific Android SDK/JDK configuration.
