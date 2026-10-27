# Drawn Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace temporary text results with the approved shared card grid and continuous details experience.

**Architecture:** A reusable card-collection screen owns the existing catalogue host/grid/overlay wiring. Catalogue supplies all configured cards; Results supplies committed IDs in draw order from the shared session. Results remains the completed-state view of the Draw tab, outside the drawing layout’s padding.

**Tech Stack:** Existing React Native/Expo Router/TypeScript/Reanimated; no dependencies.

**Spec:** `docs/superpowers/specs/2026-10-27-drawn-results-design.md`; original approved result requirements and the implemented catalogue-overlay/bottom-navigation contracts remain binding.

## Global Constraints

- Reuse exactly the same card-face grid and detail overlay for catalogue/results. Native aspect ratio, captions, spacing and one-column growth cap stay consistent.
- Results preserve committed draw order, include numeric ID0 and sparse IDs, and never consume/reorder session cards by browsing.
- Face/name only in tiles; full meanings/descriptions appear in details after enlargement. No second flip or page-first transition.
- New session is explicit; tab round trips and final-card exhaustion retain results. Empty results are a normal state.
- Preserve prepared shuffle/reveal/overlay math, timing, persistent image surfaces, lifecycle/epoch guards, corrected proportions and safe dock layout.
- Czech/English and forest/ivory appearance, no new tabs/features/dependencies/lock/native config/security changes.
- Follow workspace AGENTS.md; preserve user-generated gitignore/expo-env/audit files.

## Review Focus

1. Results root outside Draw padding: true host width and safe areas must not cause cropped/oversized tiles or double dock inset.
2. Two mounted collection screens: an unfocused collection cannot unlock the focused modal’s dock, including a late results mount.
3. Empty/single/odd/exhausted and100-card results: correct order/width/virtualization, explicit reset and no automatic fresh deck.
4. Failed fresh-session entropy and stale callbacks: old results stay available and Retry does not recommit or reuse old identity.
5. Tab/detail round trips, background/layout changes and New session: scroll, focus, return target and dock unlock remain coherent; no old results survive fresh reset.

## Task 1: Share collection presentation and integrate results

**Files:** Create `mobile/src/features/cards/CardCollectionScreen.tsx`, `mobile/src/features/results/ResultsScreen.tsx` and `__tests__/results.test.tsx`/focused shared collection tests. Modify `CatalogueScreen.tsx`, `DrawPreview.tsx`, affected card/navigation/session integration tests and README. Change shared CardGrid only if genuinely needed to host the existing empty layout or screen scoping; do not alter its tile math. Avoid context/controller/animation changes unless required for focused-only dock publication.

**Interfaces:**
- `CardCollectionScreen({cards,locale,assetRegistry,title,scrollKey,hostTestID,headerContent?,emptyContent?}: CardCollectionScreenProps)` consumes readonly `Card[]`, existing Locale/AssetRegistry and ReactNode slots. It owns the current catalogue host/ref/layout/safe-area/foreground width cap, CardGrid handle, useCardOverlay, useReducedMotion, modal Back and persistent CardDetailOverlay. No deck/session-specific mutation in this component.
- Catalogue supplies configuredDeck.cards, localized catalogue title and `catalogue:${deck.id}` key. ResultsScreen consumes `useSession()` and uses `cardsForIds(configuredDeck,state.drawnIds)` with `results:${deck.id}:${state.sessionId}` key, count and explicit reset/empty action. Use existing t keys `results`, `drawnCount`, `newSession`, `emptyResults`, `drawCards`, `entropyError`, `retry`; no new content schema.
- DrawPreview branches to ResultsScreen when phase results BEFORE wrapping drawing content in its padded SafeAreaView. Keep Draw focus/AppState/deferred callbacks and scene/Stop semantics unchanged. No route push/pop or new tab for results.
- Generic collection keeps dock-reserved content/bottomInset0 and top/side safe areas. Publish `setBlocked(active)` only while collection is focused, releasing on focus cleanup; inactive mounts/updates must not clear another visible collection’s lock. Keep the provider’s existing API.
- Actions live in hidden/disabled underlying collection content while overlay active. Error/retry UI remains available if New session fails while previous state is still results. Successful reset switches the same Draw tab to fresh shuffle and clears results-specific view state.

- [ ] Read existing guide, selectors, catalogue host and native overlay/clock/image sizing tests. Record baseline full Jest before changes; do not redo completed catalogue or navigation work.
- [ ] Write failing result integration tests: Stop→ordered face tiles (e.g. IDs99,0,7), no meanings in tiles, tap correct card→full details→Close/Back same grid/offset; one result normal width; empty state→explicit draw; final-card confirmation→all results without reset.
- [ ] Write failing regressions for Results→Catalogue→Results retaining session/order/grid, explicit New session fresh UUID/full deck and stale callbacks rejected, configured alternate deck and cs/en, failed reset entropy preserving old results/Retry, and inactive result collection mounting while catalogue modal must leave dock locked.
- [ ] Observe RED via focused card/results/navigation tests before implementation. Use actual router/provider/controller and existing deferred native clock boundaries where appropriate; do not replace real behavior with mock-only assertions.
- [ ] Extract existing collection wiring with compatible Catalogue host test ID and no animation-body changes. Implement ResultsScreen and Draw’s full-width results branch. Keep actual image/host instances through open/hold/close and lists mounted across tab switches.
- [ ] Update old temporary-result assertions to the approved new flow (tiles first, full text after opening). Preserve their configured-deck/reset/retention coverage. Retain existing narrow/large-font native image and foreground sizing tests; verify full-width results host and body above dock at the same controlled native layout boundary. Use virtualization for100 items, avoid nested FlatList inside a ScrollView.
- [ ] Verify all five Review Focus cases; no style-mirroring tests. Run full `npm test -- --runInBand`, `npm run test:domain`, `npm run typecheck`, `npm run lint`, `npm run validate:decks`, `git diff --check`, and Android export `/tmp/cards-results-export`. Expect zero failures; separate environmental warnings.
- [ ] Update README with results/session behavior and phone checks. Write report with RED/GREEN, actual boundaries and physical limitations; scoped commit excluding user files. Independent task review plus final plan integration review, fixing blockers with regressions.
- [ ] Phone acceptance pending: correct draw order, full artwork, tile expansion/return without blink, Stop/exhaustion/empty, New session, dock and Android Back, long cs/en text and large-font layout. No performance/native acceptance claim from mocked tests or Metro alone.
