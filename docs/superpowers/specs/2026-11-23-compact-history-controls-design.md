# Compact History and icon controls

## Intent and selected approach

History selection controls currently enter normal flow and move the records.
The user chose a floating selection toolbar instead of the proposed stable top
header. They also request icon controls and a smaller saved-reading header.

## Agreed behavior

- Holding a History record starts selection and selects it, as implemented.
  Later taps toggle records. Selecting zero live records immediately cancels
  selection, including when expiry/deletion removes the last selected record.
- Show a floating toolbar below the top safe area (updated after phone feedback): X/cancel, selected
  count, trash/delete. It overlays the list and never moves the records when
  entering or leaving selection. It is absent outside selection. Keep existing
  deletion confirmation, accessible checked state and color-only row selection.
- Account for the toolbar's measured footprint so final records remain reachable
  by scrolling. Keep the current scroll offset and row positions on selection
  changes; any extra clearance must not reflow the visible records. Top placement reserves the existing
  guidance/header area in both modes; only normal dock clearance is needed below. Respect
  safe areas and the measured bottom dock height.
- History list records and saved-reading headers show only date/time and card
  count. Hide deck name and status. Preserve all stored snapshots, completion/
  recording metadata and session/storage behavior.
- Replace the saved-reading's large Back to history button with a small left
  arrow. Group date/time and card count beside it in compact text with tighter
  spacing and modest hierarchy, preserving system/app text scaling.
- Use X for card-detail Close and arrows for return controls, with no large
  filled text pills. Phone clarification: keep visible circular theme-surface
  buttons around the X/return icons, changing only their labels to icons. Keep
  full localized accessible names and at least 48 dp
  touch targets despite smaller visible icons.
- Preserve artwork-tap closing, persistent image surfaces, native proportions,
  scrolling/animation timing, guarded return actions and accepted swipeable dock.

## Implementation proposals within that behavior

Use the existing React Native primitives and theme tokens, without adding an icon
package. Simple line icons should use consistent strokes rather than relying on
font-specific emoji. The floating toolbar uses a themed surface, rounded outline
and restrained shadow matching the dock. Its exact spacing and compact font roles
are builder choices subject to phone review. Keep long/large Czech text readable;
wrap metadata if needed rather than dropping the date or card count.

## Additional Settings refinement

The user also requests visible lines separating Settings options. Add a subtle
1 dp theme-border-colored divider between the seven existing option groups,
with no first/last divider. Keep the previous overall spacing by using 16 dp
on either side of each divider instead of the previous 32 dp section gap.
The separators are decorative and hidden from accessibility. This direct visual
edit does not alter settings behavior or the deferred slider interaction.

## Verification

Use targeted History/detail/icon-control tests only: zero-selection exit,
confirmation/Cancel/Back, no list jump, overlay/dock clearance, absence of deck and
status text, compact header, icon accessibility and retained guarded close paths.
Check types and scoped lint for changed files. Reuse valid unaffected results;
no full-suite run or unrelated resource/domain/security checks. Phone acceptance
covers floating placement, gestures, larger text, icon clarity and last-row access.

## Status

The user chose the floating toolbar and suggested icons, and explicitly omitted
deck name/status. The user explicitly approved implementation with “implement the changes we
decided”. The implementation and targeted verification are complete; phone layout
acceptance remains pending. No commit/push requested; preserve all existing uncommitted work.
