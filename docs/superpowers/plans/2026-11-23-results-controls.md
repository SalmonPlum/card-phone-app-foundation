# Compact Results Controls Implementation Plan

> Use superpowers:executing-plans for established direct execution.

**Goal:** Apply the approved compact top-right New session control and empty Draw cards action.

**Spec:** [Approved design](../specs/2026-11-23-results-controls-design.md).

- [x] Add failing checks to existing results tests for no New session at zero,
  icon-only reset in the count row and successful reset, plus adapt zero-card
  entropy-recovery coverage to use Draw cards rather than hidden New session.
- [x] Observe RED, add native restart icon and update ResultsScreen layout/styles.
  Preserve reset/retry callbacks and the shared scrolling collection.
- [x] Run only changed results cases: empty/nonempty controls, reset/retry and
  short-screen failure recovery. Check strict types/scoped lint; no full suite.
- [x] Record validation/phone checks and leave work uncommitted.

Constraints: current Draw/shuffle/Stop unchanged, 48 dp targets, complete cs/en
accessible text, no new packages. Reuse valid unaffected results. A short final
focused review covers only action visibility/layout and recovery.
