# Catalogue card-name search

## Intent and selected approach

The user accepted the 20-card testing deck and requested implementing the saved
Catalogue search bar. They selected searching **only the current app language**,
with case and accents ignored. The alternative of searching Czech and English
names together was offered and not selected.

Use immediate local substring filtering over the supplied deck's localized card
names. This fits the existing offline 1–100-card contract without indexing,
dependencies or network requests. Meanings/descriptions are outside search scope.

## Proposed user behavior

- Keep a themed search field above the Catalogue grid, visible while scrolling.
  Retain the accepted page-title removal; do not add a repeated Catalogue title.
- Placeholder/accessible label: Search cards by name / Hledat karty podle názvu.
  Provide a clearly accessible clear action when the input contains text.
- Filter while typing. Normalize case, Czech accents, leading/trailing whitespace
  and repeated whitespace. Preserve manifest order, numeric identities and
  original card objects. Empty/whitespace-only input shows the full deck.
- Show a localized no-matches message when appropriate; keep the field and clear
  action available. Clearing restores the complete deck without restarting a
  session. Avoid adding search history, counts or advanced search controls.
- Keep query state during tab round trips and detail opening/closing, without
  disk persistence. A language change keeps the typed query and recomputes the
  matches against the newly displayed names. Theme/text-size changes retain it.
- Query changes show matches from the top of the grid; a tab/detail round trip
  retains the current filtered view and scroll position. Keep the input and grid
  hosts stable while filtering, so typing does not dismiss the keyboard.
- A match opens the existing details in one tap, dismissing the keyboard and
  using settled native layout measurements. Preserve the filtered return target.
  Cancel stale pending opens after query changes, tab/background changes or
  unmount; keyboard/layout events must not open an old selection later.

## Integration constraints

Keep filtering in the Catalogue feature and name matching in a pure helper. The
shared collection may accept visible cards separately from its full card set so
an open detail retains its owning card through filtering/localization changes.
Results retain their existing presentation and have no search bar in this change.

Use the existing theme colors, resolved/scaled typography, rounded surfaces and
at least 48dp control targets. Labels/input must support Czech, larger app text
and OS accessibility scaling without truncation. Preserve rounded artwork,
proportions, persistent detail image surfaces, session identity, animation timing
and measured dock/header/scroll-end clearance. No dependencies or schema changes.
Slider repair remains deferred.

## Verification and remaining builder decisions

Test matching with both locales, case, composed/decomposed accents, whitespace,
literal punctuation, empty results, order and unchanged identities. Cover live
input/clear, no-match recovery, query retention, filtering-to-detail return,
language/theme/size changes and stale keyboard/open callbacks. Exercise measured
keyboard/layout changes and the existing results/navigation integrations.

Exact icon strokes, spacing and keyboard-settlement coordination are builder
decisions within these constraints. Run focused tests during implementation and
one final integrated check set for the shared collection/navigation changes.
Native keyboard, focus, scrolling and visual acceptance require phone review.

Status: approved by the user's “Yes implement”; implementation is authorized.
