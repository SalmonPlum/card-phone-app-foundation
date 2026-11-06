# Independent Text Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline, task by task.

**Goal:** Add a saved app-wide Small/Standard/Large text size independent of theme.

**Architecture:** A dedicated preference provider and private storage file own a size ID. Apply its factor once to resolved typography; the existing startup gate restores it before mounting sessions. Settings uses the existing segmented control presentation, with responsive layout based on app × OS scaling.

**Tech Stack:** Existing Expo/React Native, TypeScript, FileSystem, Jest/Node tests; no new dependencies.

**Spec:** [Independent text size](../specs/2026-11-06-independent-text-size-design.md), implementation approved by the user's request to implement it for phone review.

## Global Constraints

- Small 0.9, Standard 1, Large 1.15; default Standard. All rendered app text scales, including startup/error/retry messages; decorative icons and card artwork retain geometry.
- Scale font size, line height and tracking together once. Retain enabled OS font scaling, minimum 48dp targets, wrapped labels, measured headers/menu and native line-height safety.
- Persist only size ID separately from theme/language/reveal; explicit choices beat late reads, writes serialize, stale failures do not win.
- Restore before sessions mount; retain the bounded 15-second startup retry/fallback path and suppress late restore after continuing.
- Preserve session/reading/image identity, artwork proportions, animation paths/timing and existing user-owned files.
- Work inline in the current feature checkout; implementation now authorized, no further plan approval or automatic commit/push.

## Review Focus

- Rapid selections and late read/write failures must retain the current preference.
- Stalled size reads must not hang startup or alter metrics after recovery.
- Larger app size combined with OS scaling must wrap controls and keep scroll/dock clearance.
- Startup placeholders/errors and image-error text must scale, not only the shared readers.
- Theme changes and size changes must preserve sessions, reading and native image hosts.

### Task 1: Preference ownership and storage

**Files:** create `mobile/src/settings/textSize.ts`, `TextSizeProvider.tsx`, `mobile/src/platform/textSizeStorage.ts`, and adjacent provider/storage tests; update `mobile/jest.setup.ts` for native I/O isolation.

**Interfaces:** `TextSize = 'small' | 'standard' | 'large'`; `textSizeScale`; `useTextSizeSettings()` returns size, scale, ready, setTextSize, saveError, retrySave, retryTextSizeRestore, keepCurrentTextSize. `TextSizeStorage` reads nullable strings/writes size IDs.

- [x] Write/run failing tests for default/valid/invalid/read failure restoration, independent persistence/remount, late reads, serialized choices/stale failures, retry, fallback/retry invalidation and awaited native writes.
- [x] Implement provider with existing ThemeProvider race protections and lazy FileSystem adapter using `app-text-size.txt`.
- [x] Run the two new suites; expected all pass.

### Task 2: Typography and bounded startup integration

**Files:** modify `mobile/src/themes/typography.ts`, `ThemeFontGate.tsx`, `mobile/src/app/_layout.tsx`; test `typography.node.test.ts` and `ThemeFontGate.test.tsx`.

**Interfaces:** `scaleThemeTypography(typography, scale)` returns new role styles with size/tracking multiplied and line heights rounded upward; Standard returns unchanged metrics. `useThemeTypography()` incorporates preference scale. Gate consumes Task 1 readiness/retry/keep APIs; root places provider above it.

- [x] Add/run RED tests for exact 0.9/1/1.15 scaling, unchanged source/fonts/weights, all-theme line-height safety; delayed/stalled size restore, fallback ignoring late read, retry rejecting old results, and startup copy using the selected scale.
- [x] Implement scaling without applying OS font scale manually. Startup copy uses scaled system typography so unloaded fonts are not required; gate readiness is theme AND size ready under its existing deadline.
- [x] Run Node typography and gate suites; expected all pass with existing startup behavior retained.

### Task 3: Settings and complete integration

**Files:** modify Settings screen/tests, `i18n/en.ts`, `cs.ts`, navigation tabs/layout tests, and authoring/status docs.

**Interfaces:** localized Font size / Velikost písma choices, independent save error/retry, existing `SegmentChoice`. Responsive layout uses combined app/OS scale. Existing theme/deck resources remain unchanged.

- [x] Add/run RED tests for immediate global scaling, three localized accessible choices, independent save failure/retry, restoring size after theme changes, controls stacking, and session/image/reading retention. Cover measured dock/header updates via existing layout boundaries.
- [x] Implement Settings group after Language and responsive layout; preserve native minimum touch targets and all existing choices.
- [x] Run affected suites; then once run full Jest, domain, typecheck, lint, deck/theme validation and Android Metro export to `/tmp`. Expected zero failures; document and investigate any failure.
- [x] Request one independent scoped final review; fix material findings with targeted regression coverage and repeat only affected checks.
- [x] Record actual checks and remaining phone acceptance in current status; leave code reviewable for the requested phone comparison.

## Execution record

Implemented in the existing checkout from `8665d14`; left uncommitted for the requested phone comparison. Provider/storage 13 tests, typography 7 Node tests and startup 10 tests initially passed their focused cycles. Full final run passed 36 Jest suites/293 tests, 118 domain tests, TypeScript/full lint, deck/theme validation and Android export.

Independent review found startup recovery could overflow with enlarged text. The missing-scroll regression observed RED, then GREEN; post-fix startup/navigation/layout suites passed 40 tests, TypeScript/scoped lint and final Android export passed. Combined coverage is 36 suites/294 tests, with unchanged full-run results reused. Phone appearance/persistence/accessibility/performance remain pending. Follow-up requests for >=20 testing cards and rounded card corners are recorded in current status, not implemented.
