# Swipeable Bottom Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve four/five-tab crowding with a horizontally swipeable dock and single-line labels.

**Architecture:** Keep BottomDock as the router's measured floating dock, replacing equal-width items with a native horizontal ScrollView. A small pure geometry module clamps offsets/reveals selected items and derives edge hints; native measurements remain authoritative.

**Tech Stack:** Existing React Native ScrollView, Expo Router and Jest/Node tests; no dependencies.

**Spec:** [Approved design](../specs/2026-11-23-swipeable-bottom-menu-design.md).

## Global Constraints

- Keep the pill/theme/icons/order, transparent surroundings, safe-area measurements and full accessible tab names.
- Labels use one line; items size to content, at least 48 dp, at most the viewport width.
- Swiping scrolls only the dock; tapping retains preventable tab/long-press events.
- Reveal selection on route/layout/content changes; ordinary drag never snaps to selection.
- Show decorative edge hints only where content is hidden. Disable scrolling and tab actions when blocked.
- Preserve active sessions, artwork, clocks and screen clearance. Respect reduced motion.
- Preserve existing uncommitted Info/local Expo/audit work. No commit/push requested.

## Review Focus

- Stale item layouts after language, font, width or route-list changes must not scroll to an obsolete position.
- Direct route changes and notification navigation reveal selected items without resetting a session.
- Dragging and momentum must not trigger tabs or immediately snap back to selection.
- Long authored labels/large Czech text remain bounded and accessible; hints never cover labels/targets.
- Conditional History/Info removal clamps offsets, and blocked overlays disable both dragging and presses.

### Task 1: Scroll geometry and dock behavior

**Files:** create `mobile/src/navigation/dockScroll.ts`, `__tests__/dockScroll.node.test.ts`, `__tests__/BottomDock.test.tsx`; create `mobile/src/navigation/useDockScroll.ts` for measurement/gesture lifecycle; modify `BottomDock.tsx`.

**Interfaces:** `clampDockOffset(offset:number, viewport:number, content:number):number`; `revealDockItem(offset:number, viewport:number, content:number, item:{x:number;width:number}):number`; `dockOverflow(offset:number,viewport:number,content:number):{left:boolean;right:boolean}`.

- [x] Write failing pure tests for left/right minimal reveal, bounds, no overflow, oversized item and content shrink.
- [x] Run Node tests and observe RED, implement finite/clamped geometry, run GREEN.
- [x] Write failing dock tests for horizontal scroll, one-line/nonshrinking items, measured overflow hints, drag-only scrolling, selected-route reveal, focus reveal, reduced motion and interaction blocking.
- [x] Implement ScrollView with native onLayout/content-size/scroll measurements and a keyed item-layout cache. Use fixed 14 dp decorative hint gutters outside the scroll viewport so hints never overlay targets; no hint glyph when content fits. Distribute content with minimum viewport width when all items fit.
- [x] Keep scroll offsets in refs for immediate/native event consistency. Auto-reveal only on selection or geometry invalidation, after fresh measurements; do not react to ordinary offset changes by snapping back. Reconcile after drag/momentum ends if a route/layout request is pending. Focused tabs request visibility as well.
- [x] Run dock and geometry tests to GREEN.

### Task 2: Integration, review and verification

**Files:** modify `mobile/src/navigation/__tests__/layout.test.tsx`, `infoNavigation.test.tsx`, `mobile/docs/info-page.md`; update current status/design/validation documents.

- [x] Update earlier two-line assertions to the approved single-line policy. Reuse existing root tests for paused session/theme/locale/text-size retention, conditional routes and measured dock clearance.
- [x] Run affected dock/navigation/history/results tests, TypeScript and full lint. Run domain tests once for the new geometry; export Android to `/tmp/cards-swipe-dock-final-android-export`.
- [x] Obtain one fresh review covering final changes against this spec; reproduce/fix important findings with RED→GREEN regressions and rerun affected checks. Broaden only for shared-navigation failures/unresolved risks.
- [x] Record automated results, pending phone swipe/layout/screen-reader checks and author-visible single-line behavior. Preserve all unrelated files and leave changes uncommitted.

## Execution

The user approved the design and explicitly requested implementation in this chat
on 2026-11-23. Continue the established direct execution method without another
approval round. Self-review confirms each design requirement and failure class
has a task and test boundary. The visible spacing defaults above are builder
choices within the approved behavior, subject to phone feedback.

Completed 2026-11-23: 60 Jest suites / 498 tests, 177 domain tests, TypeScript, lint and Android export passed. Fresh review findings fixed; phone acceptance pending. No commit/push performed.
