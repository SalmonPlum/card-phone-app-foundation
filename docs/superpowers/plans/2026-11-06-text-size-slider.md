# Text Size Slider Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline with focused RED→GREEN verification.

**Goal:** Replace the three text-size buttons with a slider, with small/large icons at the ends.

**Architecture:** A local `TextSizeSlider` uses native responder events and an adjustable accessibility control to snap to the existing three size IDs. The current provider, scale factors, persistence and shared typography stay intact. No dependency/native-client rebuild.

**Spec:** User's explicit slider/icon request, refining [independent text size](../specs/2026-11-06-independent-text-size-design.md).

## Global Constraints

- Three stops remain Small90% / Standard100% / Large115%; no visible option words.
- Small/large A-shaped icons are decorative; one localized adjustable control exposes the current size and increment/decrement actions.
- Tapping or dragging selects the nearest stop, clamps to bounds and writes only when the stop changes. Whole track has at least a 48dp touch target.
- Child rail/ticks/thumb do not intercept touches. Vertical movements do not change size; responder termination can yield before a horizontal drag is claimed.
- Preserve independent preference/error/retry behavior and all app scaling, theme/session/image/reading identity.

## Review Focus

Coordinate handling, drag deduplication, off-track bounds, vertical-scroll interaction, accessibility bounds/localization, and layout changes while dragging.

### Task 1: Slider and Settings integration

- [x] Add focused slider behavior tests for all stops, horizontal drag/deduplication, out-of-bounds/invalid layout, vertical movement, localized accessibility actions and minimum touch size; observe RED.
- [x] Implement `mobile/src/features/settings/TextSizeSlider.tsx` using the existing theme/style hooks and TextSize type. Replace only the Font size control in Settings.
- [x] Update Settings/router tests to adjust size through the slider; retain all existing persistence, error, theme and reader assertions.
- [x] Run affected Settings/slider/navigation suites, TypeScript, scoped lint and diff checks. No full-suite/domain rerun for unchanged provider/scaling logic unless a failure expands scope.
- [x] Request a scoped final review; fix material issues with targeted verification. Update current status/design/validation and retain working tree for phone slider review.

## Execution record

**Deferred by explicit user request:** the latest phone test was negative (“Not
good”). The slider is not accepted or resolved. Stop work on this control now;
save native interaction repair for a later iteration. Do not mistake the passing
checks below for phone acceptance or repeat the same fix without fresh native
evidence when resuming. No revert or commit/push requested.

Phone dragging follow-up: the user accepted appearance but reported that dragging
did not feel continuous. Four regression cases reproduced stop-bound thumb
movement, premature global resizing, target-relative movement errors and stale
width-change commits. Fixed with local continuous drag fraction, release-only
selection, page-origin/grab-offset coordinates and cancellation. Ten slider tests
and retained Settings/router checks cover 44 affected tests. TypeScript/scoped
lint pass. Independent scoped review approved with no findings; native dragging
and scroll arbitration still need phone feedback. No storage/scale changes.

Implemented as requested. New slider suite observed RED for the absent control, then GREEN. Six focused slider tests plus Settings/router integration passed: 3 suites/40 tests. TypeScript and scoped ESLint passed after moving prop/ref synchronization into a layout effect to satisfy the React refs rule; tracked diff checks passed. Independent scoped review approved with no findings.

User asked directly for this presentation/interaction refinement; all three saved values, scaling and persistence remain unchanged. No new full-suite, domain or export run for this isolated Settings control. Native dragging, scroll arbitration and visual/accessibility acceptance await phone review. Work remains uncommitted as before.
