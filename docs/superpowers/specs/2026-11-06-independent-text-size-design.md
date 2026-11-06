# Independent app text size

## Agreed intent and approach

The user wants Small / Standard / Large in Settings, saved separately from the
selected theme. They explicitly clarified that all app text should change,
including navigation, controls, Settings, card names and reading text. Changing
theme must retain the size choice and the corrected cross-theme visible-size
matching. OS accessibility text scaling remains enabled.

Chosen approach: one app-wide preference applied to resolved theme typography.
The considered reading-only alternative was rejected when the user specified all
text. The user subsequently requested a slider with small/large icons instead of
the three visible option words. Keep the three saved size IDs as slider stops;
an arbitrary continuous range is outside this refinement.

## Proposed behavior

- Small: 90%; Standard: 100% (default and the accepted current appearance);
  Large: 115%. These exact factors are the assistant's proposed implementation
  choice, rather than percentages the user previously specified.
- Scale font size, line height and letter spacing for every text role together,
  retaining the native-metric line-height safety margin. Apply this to all
  rendered app text, including startup/loading/error/retry messages and native
  image-error placeholders. Preserve artwork and its native proportions.
- Apply the app factor once to resource typography; React Native independently
  applies the OS text factor. Do not manually multiply by OS font scale as well
  or cap accessibility text size. Font families, weights and colors still come
  from the theme. Decorative icons remain icons, with unchanged geometry.
- Add a localized Font size / Velikost písma section near Language. Its slider
  has three snapping stops, with small/large A-shaped icons at the ends and no
  visible option words. One accessible adjustable control speaks the localized
  current size (Small / Standard / Large or Malá / Standardní / Velká) and supports
  increment/decrement actions. The thumb follows a horizontal drag continuously;
  releasing selects the nearest stop and applies the font change. Taps and
  screen-reader adjustments select directly. Avoid global text reflow during
  dragging; cancel a stale preview after track resizing or external changes.
- Preserve minimum 48dp touch targets. Let groups stack and labels wrap when
  combined app/OS scaling or narrow space requires it; do not shrink text to fit
  or truncate it. Keep measured menu/header heights and scroll-end clearance
  authoritative across every reader and tab.

## Persistence and startup

Use the existing app-private offline storage mechanism with a separate text-size
file; persist only the size ID, independently of language, theme and reveal mode.
Unknown, absent or unreadable values use Standard. Explicit selections beat late
reads; serialize writes and suppress stale save results. A failed save retains
the live selection and offers a localized retry within its own Settings section.

Restore text size before mounting sessions through the existing bounded startup
gate, alongside fonts and theme. Retain a bounded retry/system-font recovery
path for stalled reads; continuing uses the current size for that run and ignores
late restoration. Do not overwrite a saved size merely because startup fell back.
Size/theme changes must not remount sessions, reset reading or recreate artwork
hosts, and must preserve accepted animation timing and lifecycle guards.

## Scope, validation and remaining builder decisions

Use the existing Expo/React Native stack, provider patterns and theme typography
pipeline, with no new dependency or theme-resource schema change. Exact component
decomposition and responsive layout thresholds are builder decisions; retain the
accepted Settings treatment. A live preview is provided by the whole screen
changing immediately, so an additional sample widget is unnecessary.

Verify numeric scaling and safe line heights, restore/write races and independent
save failures, localized accessible choices, complete app text coverage, startup
recovery, and session/image/reading retention through size and theme changes.
Because this touches shared typography, root startup and navigation, run the
full final Jest/domain/static/resource check set once after integration, then
repeat only affected checks if fixes follow. Phone acceptance must cover both
locales, all themes, size extremes combined with larger OS text, menu clearance,
wrapped names and startup persistence. Mocks do not establish native appearance.

Status: implementation authorized by the user's “lets implement it first” after
reviewing the proposed design. The 90% / 100% / 115% factors are provisional for
phone comparison, not final visual acceptance. Implemented in the working tree;
see [verification and phone checklist](../../2026-11-06-independent-text-size-validation.md).
