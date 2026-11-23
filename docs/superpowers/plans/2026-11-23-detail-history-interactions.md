# Detail and History Interaction Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for direct execution.

**Goal:** Add artwork-tap dismissal and replace History's Select button with long-press selection and a top toolbar.

**Architecture:** Put a scroll-aware animated artwork hit area in CardDetailReader and connect existing overlay/direct close actions. Keep History selection state in its screen, reusing archive deletion/confirmation.

**Tech Stack:** Existing React Native, Reanimated, Expo Router and Jest.

**Spec:** [Approved behavior](../specs/2026-11-23-detail-history-interactions-design.md).

## Global Constraints

Keep persistent artwork, geometry/timing, draw confirmation, session identity and all saved-history safeguards. No new packages or native changes. No visible Select entry or checkbox glyphs. Full Czech/English copy, accessible row selection, fixed selection-only toolbar and minimum 48 dp targets. Keep preexisting uncommitted/local work intact.

## Review Focus

- Artwork scrolling is not interpreted as a tap.
- Old/duplicate/transition artwork callbacks cannot dismiss another detail.
- Long-press release does not reopen/toggle the chosen History record.
- Expiry/deletion cannot leave stale counts or delete unselected live records.
- Large-text toolbar wraps above the list and remains separate from the dock.

### Task 1: Artwork action

Files: `mobile/src/features/cards/CardDetailReader.tsx`, `CardDetailOverlay.tsx`, `CardDetails.tsx`, their tests and locale dictionaries.

- [x] Add failing tests for shared reader/overlay and direct artwork actions, drag cancellation, closing/duplicate/stale guards and moving hit-area geometry.
- [x] Observe RED, implement optional `onArtworkPress` / `artworkActionKey` reader props. The animated hit area lives in scroll content, follows the current artwork rect plus scroll offset, and preserves native vertical scroll cancellation.
- [x] Connect existing overlay close and standalone back callbacks; keep artwork surfaces and drawing reader behavior unchanged. Guard actions by active identity and one-shot consumption. Run tests GREEN.

### Task 2: History selection

Files: `mobile/src/features/history/HistoryScreen.tsx`, its tests and locale dictionaries.

- [x] Write failing tests for long press selecting the first row, no glyphs/Select entry, fixed top Cancel/count/Delete toolbar, toggling, release suppression, Back/cancel/confirmation, custom accessibility selection and expiry/removal.
- [x] Observe RED. Implement using existing color styles and deletion controller; keep accessible checked state despite no glyph. Let native Pressable suppress release after long press; also guard captured release callbacks for the just-held record.
- [x] Preserve normal reading, existing retention/errors and conditional routing. Disable Delete at zero. Update existing selection tests and run GREEN.

### Task 3: Integration and review

- [x] Verify actual Catalogue/History/results/standalone closing as appropriate with affected shared tests and real router regression; reuse accepted draw/session tests.
- [x] Run affected suites, strict types/full lint, deck/interface validation and Android export to `/tmp/cards-detail-history-final-android-export`.
- [x] Obtain one fresh review; reproduce/fix important findings and rerun affected checks, broadening only when justified.
- [x] Record results, phone checks and approved choices in status/validation docs. Leave work uncommitted.

User approved the concrete toolbar/interaction proposal; continue established direct execution. No further approval round needed.

Completed 2026-11-23: full Jest 60 suites/510 tests, TypeScript, lint, deck/interface validation and Android export passed. Fresh review findings fixed; phone interaction/layout review pending. No commit/push.
