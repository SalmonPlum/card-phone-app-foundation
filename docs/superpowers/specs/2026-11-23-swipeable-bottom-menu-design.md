# Swipeable bottom menu

## Intent

The About me page received positive phone feedback, but four/five equal-width
destinations crowd the floating dock and wrap labels. The user selected the
swipeable-menu approach on 2026-11-23. This small change replaces squeezing with
horizontal scrolling while retaining the current menu's appearance and routes.

## Approaches

- Selected: a horizontally scrollable floating dock, retaining all destinations
  in their current order. Labels get comfortable widths; some destinations may
  require a swipe to reach on narrow screens.
- Considered: primary destinations plus a More sheet for About me and Settings.
  This gives a stationary menu but adds a tap and groups destinations differently.
  The user chose scrolling instead.

## Proposed behavior

- Keep the rounded theme-aware pill, icons, selected label/icon/pip and transparent
  surroundings. Only the dock scrolls; its outer position stays fixed.
- Use a native horizontal ScrollView inside the pill. Items size to their label
  and padding rather than dividing screen width equally. Keep targets at least
  48 dp and retain app/system text scaling.
- Labels stay on one line. Normal labels have enough width for their complete
  text. If an unusually long authored label exceeds even the visible viewport,
  cap that item's width and ellipsize its label, preserving the full accessible
  name. This prevents an item becoming impossible to view or tap completely.
- When all items fit, distribute them comfortably within the pill and show no
  overflow hints. When they overflow, show subtle left/right chevron hints at
  edges with hidden content. Hints are decorative, do not cover touch targets
  or labels, and are hidden from accessibility.
- Swiping moves only the menu; it does not change the selected screen. Tapping
  a destination performs the existing preventable tab action. No paging, carousel
  looping, page-swipe navigation, auto-advance or new Settings preference.
- Reveal the selected destination automatically on route changes, including
  notification/deep-link navigation. Recheck its visibility after width, locale,
  font/text-size or available-destination changes. Ordinary swiping may move the
  selected item offscreen; do not snap back while the user explores the menu.
- Scroll only far enough to reveal the selected item, clamped to content bounds.
  Use native scrolling and respect reduced motion for programmatic scrolling.
  Screen-reader users retain individually named selected/disabled tabs and native
  horizontal scrolling; focused destinations must be reachable without a precise
  touch swipe.
- Preserve tab press/long-press events, modal interaction blocking, measured dock
  height/clearance, safe areas and touches through the transparent surroundings.
  Block menu scrolling as well as tab presses while interaction is blocked.
- Keep Draw as the starting route and retain the current order and conditional
  History/Info inclusion. Preserve active sessions, native artwork and accepted
  animation clocks/timing. The deferred Settings text-size slider is separate.

## Verification and builder choices

Use the installed React Native ScrollView; no dependency/native rebuild needed.
The implementation plan settles exact padding/minimum widths and chevron styling
using existing theme tokens. Cover overflow/no-overflow, one-line labels, large
Czech/long authored labels, layout changes, selected visibility and bounds,
conditional destinations, reduced motion, drag-versus-tap, event prevention and
blocked gestures. Reuse existing session-retention and measured-clearance tests,
adding affected integration regressions. Run affected tests, TypeScript, lint and
Android export; broaden only for shared-navigation failures or unresolved risks.

Phone review must check swipe discovery, touch feel, first/last destinations,
four/five tabs, themes/languages/large text and screen-reader navigation. Automated
layout reports do not establish physical visual/accessibility acceptance.

## Status

Swipeable approach chosen by the user. The user approved the design and requested
implementation on 2026-11-23 ("Yes looks good, lest implement it"). Preserve the uncommitted
Info feature and local Expo/audit files; no commit or push requested.
