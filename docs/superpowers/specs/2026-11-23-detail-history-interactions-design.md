# Detail artwork closing and History selection

Approved behavior from the user's requested refinements and “yeah sounds good”
response to the top selection toolbar proposal on 2026-11-23.

## Behavior

- A deliberate artwork tap closes Catalogue/results/History card details through
  the existing close path, or returns from a standalone detail link. Keep the
  existing Close/Back controls. Preserve artwork surfaces, native proportions,
  scroll-linked shrinking and close animation. Drawing reveal/confirm semantics
  are unchanged. Scrolling over artwork must not close the detail; taps during
  transitions, duplicate presses and stale callbacks must not close another card.
- History has no visible Select entry button. A long press enters selection and
  selects that record; later taps toggle records rather than opening readings.
  Show selection through row fill/border color, with no visible checkbox glyphs.
  Keep accessible checked state and a custom Select accessibility action.
- A fixed selection-only top toolbar contains Cancel, a selected count and Delete.
  It remains visible while the list scrolls, wraps if larger text needs room, and
  keeps 48 dp targets. Delete is disabled at zero; Cancel/Android Back exit mode.
  Deletion retains the existing confirmation and data/session guards. Ordinary
  taps outside selection still open a reading. Retention/error guidance remains.
- Entering selection by long press must not also toggle/open the record on release.
  Selected IDs are intersected with live records as they expire or are removed.
  Existing behavior of retaining selection across tab visits is preserved.

## Approaches

User selected the top toolbar over another bottom bar that would compete with
navigation. Reuse the existing themed row selection colors and deletion controller.
For artwork, use a hit area in the shared scroll reader matching the visible card,
leaving the painted image itself persistent and noninteractive. Native scrolling
can cancel its press naturally; add guards for dragged/stale/duplicate actions.

## Verification

Test card taps, scrolling, transition/stale/duplicate guards, standalone return and
real collection close. Test long-press/release, toggling/colors/no glyphs, toolbar,
confirmation/cancel/zero count, Back, accessibility action and record removal.
Run affected component/router tests, TypeScript, lint and Android export. Phone
checks cover gesture feel, top toolbar/large-text layout and closing animation.
No dependency, native rebuild, commit or push requested. Preserve existing work.
