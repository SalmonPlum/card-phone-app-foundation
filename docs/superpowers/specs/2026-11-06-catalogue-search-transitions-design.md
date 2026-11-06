# Catalogue search transitions

## Intent and chosen approach

The user accepted search on the phone but found instant card removal abrupt.
They selected fading individual cards and smoothly rearranging the grid.

Approaches considered:

- **Chosen: individual fades and grid movement.** Makes disappearing cards and
  the positions of retained cards understandable; requires coordinating motion
  with measurement and rapid edits.
- **Alternative: fade between whole result sets.** Simpler transition, but hides
  retained cards and does not show where they move.

## Behavior

- Removed cards fade out; retained cards glide to their new positions; cards
  returning after edits or clearing fade in. Card artwork and captions move
  together. No stagger, bounce, rotation or resizing effect.
- Refined after phone feedback that the initial animation was too fast: 300ms
  fades and 450ms eased movement. These slower timings await phone review.
- Typing and filtering remain immediate. A newer query interrupts or retargets
  the current transition; transitions do not queue old results.
- Animate actual result-set changes, including a language change that changes
  matches. Initial mount, tab return and theme/text-size changes alone do not
  trigger search-entry effects.
- Empty results and clear participate in the transition; the search field stays
  mounted and focused. Retain the existing reset-to-top behavior after edits.
- Respect OS reduced-motion settings by applying result changes immediately.

## Constraints and interaction

Use existing React Native/Reanimated dependencies and preserve the virtualized
grid, stable card IDs, native artwork proportions and rounded corners. Matching,
query retention, session identity and drawing/detail animation timings stay as
currently accepted. Results screens do not receive search transitions.

Leaving cards cannot be opened or receive accessibility focus. A selection during
movement must use safe geometry or the existing fade fallback, never stale tile
coordinates. Preserve keyboard dismissal and stale-selection cancellation. An
already-open detail retains its card and returns to the current filtered list.

The builder chooses the animation integration after checking the installed
multi-column grid support. Verify rapid edits, clearing, empty results, retained
tile identity, reduced motion, keyboard selection and shared results behavior.
Phone review establishes motion quality; automated tests establish behavior.

## Scope and status

Small refinement to Catalogue search. Slider repair remains deferred. No commit
or push requested. User approved this written design with “I approve implement.”

## Implementation record

Implemented with native Reanimated card and row layout worklets, keeping the
multi-column virtualized FlatList. Capturing mounted tile origins takes at most
32ms while the input remains responsive; late/missing geometry falls back to
fading. Safe detail geometry is retained through a conservative 650ms window.
Active native timing checks cancellation per frame, and motion state is
published on the UI runtime before result commits. See the validation report
for automated evidence and pending phone acceptance. No commit or push.
