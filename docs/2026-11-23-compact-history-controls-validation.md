# Compact History controls — validation 2026-11-23

Implemented the [approved design](superpowers/specs/2026-11-23-compact-history-controls-design.md)
and [plan](superpowers/plans/2026-11-23-compact-history-controls.md) after the user
explicitly requested implementation. All earlier uncommitted work is preserved.

## Delivered

- Floating X/count/trash selection toolbar above the bottom dock. It overlays
  rather than shifts the list, respects horizontal safe areas and uses measured
  dock clearance. When not selecting it remains mounted only to measure its
  footprint: invisible, inaccessible and noninteractive. The list reserves the
  maximum observed toolbar height in both modes to avoid scroll-range shrinkage.
- Selecting zero live records cancels immediately. Expired/deleted IDs are removed
  from selection before committing an updated archive view; a record returning
  with the same ID does not reactivate canceled selection. Long press, row color,
  accessible checked/custom selection, Cancel/Back and confirmation are preserved.
- History rows and saved-reading header display date/time and card count only.
  No visible or announced deck/status metadata. Storage snapshots and completion
  metadata remain complete. The saved-reading header groups a small return arrow
  with compact theme label/caption text, retaining full date/count and font scaling.
- Native line icons replace large text Close/Back pills. X closes detail, arrows
  return, trash requests confirmed deletion. Accessible labels, native overlay
  focus ref, 48 dp targets and prior guarded callbacks remain. Standalone Back is
  before the title. Artwork surfaces, shrinking, motion and drawing are unchanged.
- The preceding Settings divider implementation is retained. Its 14 passing
  Settings tests and scoped lint remain valid; not rerun for unchanged code.

## Targeted evidence

Initial changed-behavior tests observed seven expected failures, then GREEN.
Final valid results cover **45 unique targeted cases**:

- History: **18 tests passed**, including zero-selection exit, source removal and
  same-ID reappearance, stable list identity/end clearance, measured toolbar height,
  side insets and dock positioning, metadata removal, icon Back and prior deletion/
  selection/accessibility/artwork-close behavior.
- Detail components: **24 tests passed** for existing artwork/close/scroll/guard
  behavior and new icon-only Close/Back presentation. Their valid results were
  retained after the subsequent History-only fix.
- Router: **3 selected cases passed** (15 unrelated cases skipped): live Catalogue
  open/close, Czech navigation and stale standalone return/refocus.
- Strict TypeScript and scoped lint covering changed production/test files passed
  without warnings. Diff/whitespace checks passed.

Focused fresh review identified an absolute-toolbar horizontal safe-area issue.
The new nonzero-inset regression observed RED, then GREEN after explicit side
insets were included. Review also suggested stronger measured-footprint and
same-ID reappearance assertions; both pass. No unresolved material findings.
Selection source adjustment avoids an effect-driven extra UI commit and requires
no React Compiler lint suppression.

Logs in `/tmp/`: `cards-compact-history-red.log`, `cards-compact-history-green.log`,
`cards-compact-history-pruning.log`, `cards-compact-review-red.log`,
`cards-compact-review-green.log`, `cards-compact-route-tests.log`,
`cards-compact-types.log`, `cards-compact-lint.log`.

Per the user's explicit scope, **no full suite**, domain/security/deck validation,
dependency work or Android export was run. No new native module/rebuild is needed.
No commit/push performed.

## Phone review pending

Reload the existing client. Check floating toolbar appearance/placement, no list
jump, final-record access, horizontal insets, larger Czech/English text, zero-count
cancel, confirmation, compact reading header, icon clarity/screen-reader focus,
artwork close behavior and Settings lines. Native layout fixtures do not establish
physical appearance, gesture feel or accessibility acceptance.

## Phone correction: keep circular button surfaces

The user clarified that only text should become icons, and reported poor arrow
centering. Navigation/close icons now sit in explicit 48×48 dp circles with themed
surface/border; the 22 dp icon frame centers within them. The back arrow uses a
single symmetric chevron and centered shaft. Three affected icon-control cases
passed (39 unrelated cases skipped). Scoped lint/types checked; no full run or
export. Phone appearance/centering requires recheck.

## Phone refinement: top floating toolbar

The user liked the floating toolbar but requested top placement. It now sits below
the top safe area with the same side offsets, icons and actions. Its measured
header area stays reserved in both modes to avoid selection reflow or covering
the first record. Retention guidance hides while selecting, and storage errors
remain below the toolbar. Bottom padding now clears only the navigation dock.
Two placement/clearance regressions observed RED then GREEN; six selected History
cases passed, with 12 unrelated cases skipped. TypeScript, scoped History lint
and diff checks passed. No full suite or export. Logs: `/tmp/cards-top-toolbar-`
`{red,green,types,lint}.log`. Reload for phone review.
