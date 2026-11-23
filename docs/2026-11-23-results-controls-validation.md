# Compact results controls validation — 2026-11-23

Approved: top-right visible circular New session restart button beside the count,
only when cards exist. Empty results show one compact Draw cards action.

- Observed RED: new empty/nonempty visibility and icon checks failed before implementation.
- Five targeted results control/reset/retry cases passed; 12 unrelated cases skipped.
- One existing Stop/results/detail-return integration passed; 16 unrelated cases skipped.
- Strict TypeScript and scoped ESLint passed for ResultsScreen, IconButton and results tests.
- Diff whitespace check passed. No full suite, export or unrelated validations.
- Focused diff review: reset/retry callbacks and scroll ownership preserved; restart icon
  uses existing theme-native strokes; translated labels and 48 dp targets retained.

Pending: phone review of icon appearance, top-right alignment and compact Draw cards
at normal/large text sizes in both languages/themes. Automated layout checks do not
establish device appearance. Reload; no native rebuild required. Work uncommitted.

## Empty-state phone refinement

Added 16 dp extra spacing above Draw cards and a decorative back arrow before the
text. Preserved the accessible translated label, wrapping and 48 dp target. Four
selected empty/nonempty/short-screen reset-recovery cases and scoped ResultsScreen lint
passed. No full suite; phone appearance review pending.

## New session icon refinement

Changed the top-right glyph to overlapping cards with a restart arrow, as chosen
by the user. One focused nonempty New session visibility/reset case passed, plus
TypeScript and scoped lint. No unrelated suites. Phone glyph review pending.
