# Catalogue Card Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow the actual tapped catalogue face into a modal-style detail overlay, then return it continuously to its tile.

**Architecture:** Keep the catalogue route/grid mounted. A reusable in-screen overlay owns a persistent face and UI-thread rectangle animation, coordinated by a guarded in-memory controller. The catalogue supplies fresh tile measurement and receives a hidden-source ID; no router transition occurs on catalogue selection. Direct card links retain a standalone details fallback.

**Tech Stack:** Existing Expo/React Native TypeScript, Reanimated/Worklets, React Native Testing Library/Jest. No dependencies added.

**Spec:** `docs/superpowers/specs/2026-10-27-catalogue-card-overlay-design.md` (approved).

## Global Constraints

- The tapped card itself moves closer from its actual catalogue tile, then reveals details. Closing returns the card to that tile.
- The catalogue remains mounted and visible behind it, at the same scroll position.
- No router push/pop in this catalogue interaction. Keep a theme-colored opaque screen base; do not expose a black/empty intermediate page.
- One persistent overlay image through expansion, details and return; avoid native image remount/fade flashes. Keep full-artwork sizing correction.
- Reuse existing Reanimated UI-thread animation and local artwork; no new shared-element dependency or native window needed.
- Czech and English labels/content. No gestures/settings/search/filter additions.
- Reduced motion uses immediate/fade presentation and dismissal.
- Results integration, the accepted shuffle, and deferred draw enlargement are outside this change.

## Review Focus

1. Scrolled tile coordinates and safe-area offsets: start/end at the visible face, never screen origin or stale positions.
2. Native image handoff: no blank frame, duplicate visible face, intrinsic-size overflow, or remount during animation.
3. Close while opening, repeated taps, and delayed measurement: one selected ID, reverse from current pose, stale completions ignored.
4. Scrolled long details and viewport/font change: reset text scroll behind the persistent face before reversing; stale/missing target fades safely.
5. Android Back, accessibility, backgrounding: dismiss overlay first, restore interaction/focus without changing catalogue route or session.

## File ownership

- Create `mobile/src/features/cards/overlayGeometry.ts`: pure rect validation/conversion/target fitting.
- Create `mobile/src/features/cards/useCardOverlay.ts`: guarded lifecycle, source/host measurement, open/close and completion tokens.
- Create `mobile/src/features/cards/CardDetailOverlay.tsx`: persistent face, Reanimated transforms/backdrop, scrolling detail body, Close and accessibility.
- Modify `mobile/src/features/cards/{CardGrid,CardTile,CardDetails}.tsx`: expose fresh measurement/focus, hide source while preserving layout, extract reusable text if needed. Preserve CardFace intrinsic-height fix and disable default image fade for overlay handoff.
- Modify `mobile/src/app/catalogue.tsx`: compose overlay, intercept Back while open, lock list scrolling, keep route unchanged.
- Modify `mobile/src/i18n/{en,cs}.ts`: add Close label only if existing Back cannot express close; keep key parity.
- Keep `mobile/src/app/card/[id].tsx` functional as direct-link fallback; simplify/remove obsolete catalogue-only animation adapters/tests if unused, without weakening direct-link validation.
- Update affected card tests and create `__tests__/{overlayGeometry,CardDetailOverlay,overlayNavigation}.test.tsx` (geometry may be .test.ts). Update README phone steps.

## Task 1: Continuous catalogue-to-detail overlay

This is one integrated task because geometry, image handoff and controller must agree to yield a reviewable working interaction.

**Interfaces:**
- Consume existing `Card`, `CardId`, `Locale`, `AssetRegistry`, `TileOrigin` and configured deck. Preserve reusable `CardGrid`/`CardDetails` for future results.
- `Rect = {x:number;y:number;width:number;height:number}` and pure `toLocalRect(windowRect: Rect, hostRect: Rect): Rect | null` reject nonfinite/nonpositive inputs, subtract host origin.
- `fitForegroundRect(host: {width:number;height:number}, aspectRatio:number, topInset:number, bottomInset:number): Rect` fits full face with 16dp side padding, room for a 48dp Close control plus spacing, and max face height 60% of usable host height, centred horizontally. No cropping.
- Extend grid ref/handle with `measureCard(id:CardId, callback:(rect:Rect|null)=>void):void` and `focusCard(id:CardId):void`; unknown/unmounted sources return null safely with bounded callback semantics.
- Extend grid props with `hiddenCardId?:CardId|null` and `scrollEnabled?:boolean`; active=false disables new opens. Source opacity changes preserve tile/caption layout and measured face host. Refactor away any grid-only one-shot navigation lock that prevents reopening after modal dismissal.
- Overlay accepts selected card/locale/registry, measured host/source and close callback through controller. Controller owns stages `closed|preparing|opening|open|closing`, unique generation tokens, fresh measurement on close, and layout validity. Exact internal hook state signatures can follow existing conventions; retain numeric ID0 correctly.
- Catalogue disables content interaction/accessibility while overlay is active; Close/Android Back call same dismissal. Direct-link routes do not use catalogue overlay state.

- [ ] Write failing pure geometry tests: host origin(10,24), source(26,200,158,237.66) yields local(16,176,158,237.66); invalid/zero/nonfinite dimensions rejected; target fits small/tall safe areas and artwork aspect ratio.
- [ ] Run geometry tests and observe intended failures, then implement pure geometry and rerun.
- [ ] Write failing interaction/controller tests: measured opening starts at source rect; catalogue pathname never changes; grid instance/offset retained; details absent until opening completion; persistent image instance survives open/hold/close; original tile hidden only after overlay ready.
- [ ] Write failing edge tests: close at intermediate progress reverses from sampled current pose; duplicate opens/closes and stale completions ignored; measure after unmount/focus loss cannot reopen; missing or invalid closing target fades; viewport/font change invalidates stale rectangle; close from scrolled details returns image without jump; id0/nonconsecutive IDs and cs/en labels correct; Android Back closes before route Back; reduced motion and accessibility focus restoration covered.
- [ ] Run focused card tests and observe behavioral RED. Do not merely assert styles from shallow Image mocks; retain real native-image sizing tests and meaningful controlled UI/native timing boundaries.
- [ ] Implement one persistent overlay image surface with Reanimated UI-thread transforms (translation/scale from rects), no React per-frame updates. Approximately420ms cubic ease-out opening, matching reverse duration; backdrop dims continuously. Keep current geometry and progress coherent atomically when interrupting opening. Start only once host/image ready; no native route transition.
- [ ] Reveal scrollable text and localized Close after enlargement. Keep image in same surface through detail scrolling; clipping/scroll synchronization must preserve its current pose. On close hide/reset detail scroll behind persistent image before reverse. If that requires the face to remain fixed above a scrollable text area instead, document this builder choice and preserve complete readable text and controls.
- [ ] Add modal accessibility/focus restoration and Android Back handling, robust background/blur cleanup and reduced-motion immediate/fade behavior. No new gestures or insecure data paths.
- [ ] Update catalogue router tests to overlay semantics; retain valid/invalid direct links, numeric IDs and grid sizing tests. Remove only obsolete post-navigation catalogue motion tests/code.
- [ ] Run `npm test -- --runInBand`, `npm run test:domain`, `npm run typecheck`, `npm run lint`, `npm run validate:decks`, `git diff --check`; expect zero failures. Export `CI=1 npx expo export --platform android --output-dir /tmp/cards-overlay-android-export`; document environmental warnings separately.
- [ ] Self-review against spec and write report with RED/GREEN evidence, native boundaries, builder choices and remaining phone checks. Commit only scoped source/tests/docs, preserving user-owned `.gitignore`, `expo-env.d.ts`, and audit JSON.
- [ ] Independent review of full task diff, resolve blocking findings with regressions. Native phone acceptance stays pending: continuous opening/return, no black blink/duplicate face, Close/Back, long text, cs/en, reduced motion, retained scroll. Do not claim measured FPS/device success from mocked tests.
