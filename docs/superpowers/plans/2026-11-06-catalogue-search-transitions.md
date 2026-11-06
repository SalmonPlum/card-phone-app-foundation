# Catalogue Search Transitions Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, task by task.

**Goal:** Fade excluded/returning cards and smoothly reposition retained Catalogue cards.

**Architecture:** Keep the virtualized multi-column FlatList. Snapshot mounted tile positions before changing its displayed result set; use Reanimated entering/layout/exiting worklets for individual cards and row layout. Remounted retained cards start from their measured previous global position. Latest result changes cancel pending snapshots; selection during motion uses the existing safe detail fade.

**Tech Stack:** Existing React Native/Reanimated/TypeScript, Jest. No dependencies.

**Spec:** [Approved design](../specs/2026-11-06-catalogue-search-transitions-design.md); user explicitly said “I approve implement.” Execute inline in the existing feature checkout; no further approval, commit or push.

## Global Constraints

- 300ms fades, 450ms eased movement. No stagger/bounce/rotation/resizing.
- Stable mounted field/grid, numeric IDs, virtualization, native artwork proportions, rounded corners and current matching/query/scroll semantics.
- Only actual result membership/order changes animate. Unknown/reduced motion applies immediately; theme/size/mount/tab alone have no entry effects.
- Latest edits win; snapshot wait is bounded to one short 32ms window, without delaying input changes. Missing geometry uses fade.
- Leaving cards cannot receive interactions/accessibility; animation selection uses safe fade geometry. Preserve keyboard guards and open detail ownership.
- Results/drawing/detail timings unchanged. Slider deferred.

## Review Focus

- Cross-row remounts must glide from previous global coordinates rather than all fading in.
- Repeated edits, omitted native callbacks and late delivery must not restore old results.
- Reduced motion and focus/layout changes must not queue delayed results.
- Retained native hosts remain where FlatList retains their row; do not add query remount keys.
- Opening during movement must not use stale geometry; exiting visuals must be inert.

### Task 1: Motion lifecycle and native animation recipes

**Files:** new `mobile/src/features/cards/useSearchGridMotion.ts`, `searchGridAnimations.ts` and adjacent Jest tests.
**Interfaces:** hook consumes cards, enabled, layoutKey, bounded mounted-card measurer; returns displayed cards, snapshot origins, shared motion deadline/member IDs and a movement predicate. Animation recipes consume those values and produce entering/layout/exiting worklets.

- [x] Write failing lifecycle tests: initial/same IDs immediate, membership snapshots, 32ms fallback, rapid edit cancellation, disable/unmount/layout cancellation and movement-safe measurements.
- [x] Write failing geometry tests: retained cross-row starts at old global coordinates, new cards fade, retained old copies disappear immediately, removed cards fade, inactive/reduced motion recipes settle immediately.
- [x] Run RED, implement minimal hook/recipes, run GREEN.

### Task 2: Virtualized grid integration and validation

**Files:** modify CardGrid/CardCollectionScreen, add `SearchGridTransition.tsx`, affected grid/Catalogue integration tests, status/spec/validation docs.
**Interfaces:** CardGrid gains optional `animateSearchChanges` and `motionLayoutKey`. Default false preserves Results. Collection enables only focused Catalogue with resolved reduced-motion=false. Grid nulls source/return geometry during motion.

- [x] Add failing behavioral test for taps/measurements during motion and current filtered accessibility; retain existing keyboard/filter-generation regressions.
- [x] Integrate stable animated card wrappers and row renderer, preserving existing measurement refs and list hosts. Pass native row layout/focus callbacks through unchanged.
- [x] Run targeted tests; one final full Jest/typecheck/lint pass and Android export because this changes shared grid integration. Domain/resource results remain valid: those files are unchanged.
- [x] Obtain one independent scoped review, address material findings, record phone checks. No commit or push.

## Execution record

Completed inline in the existing checkout. Lifecycle/geometry suites observed
RED for missing modules and GREEN after implementation. The safe-geometry test
observed RED before grid integration. Integration exposed an old touch blocking
a fresh tap across filter changes: a focused token-payload regression observed
RED, then GREEN after clearing requests in a token-change layout effect.

One independent review found native timing continued after motion cancellation.
A frame-level cancellation regression observed RED, then GREEN after guarding
native timing frames against reset/replacement. Native publication now uses
`runOnUISync` before committing the displayed snapshot; its ordering regression
also observed RED then GREEN. Geometry remains conservative for the full 650ms
eligibility-plus-duration window, including cancellation. Theme/size changes
invalidate the layout key. No additional review round or approval requested.

Final verification: 41 suites / 342 tests, TypeScript/full lint, fresh Android
export and diff checks passed. Domain/deck/font results were reused because no
such files changed in this refinement. Phone checks remain pending; no commit or
push. See [validation](../../2026-11-06-catalogue-search-transitions-validation.md).
