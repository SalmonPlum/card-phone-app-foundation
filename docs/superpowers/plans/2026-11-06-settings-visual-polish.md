# Settings Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved grouped Settings controls and resource-derived theme preview cards.

**Architecture:** Keep the existing Settings providers and callbacks intact. Present the two binary settings as grouped segmented choices and themes as preview cards; use window/font scale for the compact controls' responsive layout, and retain measured dock-end padding.

**Tech Stack:** Expo/React Native, TypeScript, Jest and React Native Testing Library; no new dependencies.

**Spec:** [Approved Settings design](../specs/2026-11-06-settings-visual-polish-design.md), approved by “Go implementing” on 2026-11-06.

## Global Constraints

- Minimum 48dp touch targets; no font scaling caps or truncated labels.
- All themes come from the supplied resource, including custom themes.
- Preserve independent saving/errors/retries, provider/session identity, card artwork and animation.
- Keep full-height scrolling and measured dock-height end padding.
- Execute inline in the existing feature checkout, preserving user-owned local files. User requested implementation; no push or further approval checkpoint.

## Review Focus

- Long localized or custom theme names grow without truncation.
- Narrow screens and enlarged system fonts stack binary choices into full-width rows.
- Palette previews show the candidate resource's colors after the active theme changes.
- Selection remains perceivable without color and decorative elements do not add accessible controls.
- Save errors/retries and final cards stay reachable above a measured floating dock.

### Task 1: Settings presentation and focused verification

**Files:**
- Modify: `mobile/src/features/settings/SettingsScreen.tsx` — screen-local presentation only.
- Modify: `mobile/src/features/settings/__tests__/SettingsScreen.test.tsx` — existing behavioral tests plus responsive/custom resource cases.
- Update: approved spec, `docs/current-status.md`, and this plan with outcomes.

**Interfaces:** Consume the unchanged `useLanguageSettings()`, `useRevealModeSettings()`, `useThemeSettings()`, `useDockHeight()` and active typography APIs. Keep the exported `SettingsScreen(): React.JSX.Element` contract.

- [x] Add focused tests: previews use four candidate semantic colors even with a custom resource; long names retain wrapping; width 320 or font scale 1.6 stacks controls while width 390/scale 1 uses a row; measured dock clearance remains in the scroll content. Preserve radio checked states and decorative accessibility isolation.
- [x] Run `npm test -- --runInBand --silent src/features/settings/__tests__/SettingsScreen.test.tsx`; confirm new behavior tests fail before implementation.
- [x] Implement local segmented choice presentation, responsive row/column decision (`width < 360 || fontScale >= 1.3`), visible radio indicators, and theme cards with noninteractive swatches from canvas/primary/accent/mat. Keep theme labels in active typography and use selected text/background pairs.
- [x] Run the Settings suite and `src/navigation/__tests__/tabs.test.tsx` / `layout.test.tsx`; all tests must pass. Run `npm run typecheck`, scoped ESLint, and application/doc diff checks.
- [x] Review the complete scoped diff, including the five review-focus cases; resolve material findings and rerun affected checks only.
- [x] Record verification and the remaining phone checklist in current status. Leave this visual refinement reviewable in the working tree for phone feedback; no automatic push.

## Execution record

Implemented inline; the current working tree remains available for phone review.
Four new responsive/palette cases failed against the previous implementation;
the corrected test run retained six passing cases, including prior dock
clearance. After implementation, all 10 Settings tests passed. Navigation tabs
and layout passed 26 tests. TypeScript and scoped ESLint passed after correcting
literal type inference in the new test table; tracked diff checks passed.
Independent review approved the scoped change with no findings. Native text
measurement, screen-reader traversal and visual/touch acceptance require the
phone review listed in current status. No additional full-suite, domain,
translation, export or release runs are needed for this unchanged-data,
Settings-only presentation change.
