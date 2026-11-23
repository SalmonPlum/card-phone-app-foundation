# Compact History Controls Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for the established direct execution method.

**Goal:** Implement the approved floating History selection toolbar, compact date/count presentation and accessible icon controls.

**Architecture:** Reuse History's archive/controller and existing close callbacks. Add a small native line-icon button, render selection as an absolute overlay above the measured dock, and reserve stable list end clearance for that overlay in both modes.

**Tech Stack:** Existing React Native/Expo Router/Reanimated/TypeScript; no packages.

**Spec:** [Approved design](../specs/2026-11-23-compact-history-controls-design.md).

## Global constraints

No full suite: targeted changed History/detail checks only, plus types and scoped lint. Keep artwork, motion, session and storage guards intact. Preserve prior uncommitted work. Icons keep localized accessible names and 48 dp targets. Settings dividers are already implemented/verified (14 tests), reuse those results.

## Review focus

Zero live selections must exit without reappearing when archive contents change; toolbar must not reflow/reset visible records; last rows must scroll clear above toolbar/dock; date/count stay complete at larger text sizes; icon ref/accessibility must preserve guarded close/back behavior.

### Task 1: Native icon controls

- [x] Create `mobile/src/ui/IconButton.tsx` with close/back/trash line icons, a native forwarded ref, 48 dp target and required accessible label.
- [x] Add failing assertions to existing detail tests for visible icon controls/no visible Close/Back text; run RED, replace detail/header controls and standalone recovery with icons, preserve callbacks/ref, run GREEN.

### Task 2: Compact History and floating selection

- [x] Update/add failing History tests for zero selection cancellation, hidden deck/status, icon-only compact header, absolute toolbar, stable list identity/end padding and measured clearance.
- [x] Observe RED. Derive active selection from live IDs; discard stale IDs after removal. Render toolbar outside normal layout above dock, with measured height and stable end clearance in both modes.
- [x] Display only localized date/time and card count in list and saved-reading header. Use body/label/caption roles rather than oversized headings; group arrow/date/count in a compact row. Keep all saved data and confirmation behavior.
- [x] Run affected History and detail/router tests to GREEN. No full suite or unrelated validation/export.

### Task 3: Verification and records

- [x] Run strict types and scoped lint for changed files. Obtain one focused final review, reproduce/fix material findings and rerun only affected checks.
- [x] Record exact test results and remaining phone checks in status/validation docs. Leave changes uncommitted.

User explicitly requested implementation of the decided changes on 2026-11-23. No further approval round needed.

Completed: 45 targeted cases (18 History, 24 detail, 3 selected router cases), strict types, scoped lint and diff review passed. Safe-area review finding fixed RED→GREEN. No full suite/export; phone acceptance pending.
