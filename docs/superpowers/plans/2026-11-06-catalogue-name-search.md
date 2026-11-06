# Catalogue Name Search Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, task by task.

**Goal:** Implement the approved live Catalogue name search in the selected app language.

**Architecture:** Pure normalized substring matching returns original card objects in manifest order. Catalogue owns its query and fixed search header; the shared collection receives visible cards separately from full detail ownership. A bounded keyboard-aware opener waits for dismissal/settled layout, remeasures the source, and rejects stale callbacks.

**Tech Stack:** Existing TypeScript/Expo/React Native, native Keyboard/TextInput APIs, Jest/Node; no dependencies.

**Spec:** [Approved search design](../specs/2026-11-06-catalogue-name-search-design.md), user said “Yes implement.”

## Global Constraints

- Current-language names only; ignore case, Czech accents and surrounding/repeated whitespace. No body search, fuzzy search or history.
- Live filtering, preserved order/IDs/objects, clear action, localized no-match state. Keep field/list hosts mounted while typing.
- Query persists through mounted tabs/details and theme/text-size changes; language changes recompute matching without clearing the query.
- Query changes reset grid offset, without changing its remount key. Details retain full-card ownership and filtered return state.
- First result tap with the keyboard open must dismiss it and use fresh source/host geometry; pending opens cancel on content/focus/background/unmount changes.
- Theme/scaled typography, >=48dp targets, unrestricted text scaling, rounded artwork, session/image identity, animation timing and dock clearance remain intact. Slider remains deferred.
- Execute in the existing feature checkout, preserving all accepted/uncommitted work and user-owned files. No extra approval, commit or push requested.

## Review Focus

- Empty/diacritic/decomposed queries, punctuation treated literally, current-language-only matching and stable identities.
- Stable input focus/list identity and reset behavior after filtering from deep scroll.
- Keyboard/layout races, absent hide events, stale measurements and lifecycle boundaries.
- Locale/size/theme changes, no-match recovery and an already-open detail retaining its card.
- Shared results/navigation/measurement behavior remains unchanged when search is absent.

### Task 1: Pure matching

**Files:** create `mobile/src/features/cards/cardNameSearch.ts` and adjacent `.node.test.ts`.
**Interfaces:** `normalizeCardQuery(value:string):string`; `filterCardsByName(cards:readonly Card[],locale:Locale,query:string):readonly Card[]`.

- [x] Test empty/whitespace identity, accent/case/decomposition, substring/spacing, literal punctuation, locale scope, order/references/no mutation. Observe RED, implement, confirm GREEN.

### Task 2: Keyboard-safe opener and shared collection boundaries

**Files:** create `useKeyboardCardOpen.ts` and tests; modify `CardCollectionScreen.tsx`, `CardGrid.tsx` and affected tests.
**Interfaces:** opener consumes enabled/active/contentKey/layoutKey, existing open and bounded measureCard functions. Grid gains optional resetKey; collection gains optional visibleCards/filterKey. Defaults preserve results behavior.

- [x] Test immediate opening without keyboard; with keyboard wait for hide plus two animation frames, remeasure source, then open once. Bound missing events with a 1500ms fallback; cancel stale pending work on content/focus/background/unmount. Exercise pending measurement and layout-change rescheduling. Observe RED, implement, confirm GREEN.
- [x] Preserve full set for detail lookup and sizing, pass visible subset to stable grid. Add independent reset-key offset reset without query-dependent FlatList key. Set handled keyboard taps/on-drag dismissal for first-tap selection.

### Task 3: Catalogue input, localized states and integration

**Files:** create `CatalogueSearchBar.tsx`; modify CatalogueScreen, i18n/en/cs, Catalogue integration tests and status/validation docs.

- [x] Add RED tests for live filtering/clear/no matches, stable hosts/scroll reset, selected-language-only matching, locale/theme/size changes, filtered detail return and keyboard-visible first-tap opening. Retain existing results/navigation tests.
- [x] Implement themed fixed header with native TextInput, decorative search icon, accessible clear control and empty state, using existing typography/spacing.
- [x] Run affected checks, then one integrated full Jest/domain/type/lint/deck/theme check set and Android Metro export for shared collection/navigation changes. Fix failures and rerun only affected checks.
- [x] Request one independent scoped review; address material findings and record phone keyboard/visual/accessibility checks. Leave code reviewable in the working tree.

## Execution record

Implemented inline in the existing checkout. Pure matching and keyboard lifecycle
regressions observed RED then GREEN. Integration covers live/clear/no-match,
language/theme/size/tab retention, filtered detail return, preparation cancellation
and keyboard-visible first-tap selection. Full checks passed 39 suites / 323 tests,
121 domain tests, TypeScript/full lint, resource validation and Android export.

One independent scoped review found a delayed tile measurement could survive a
query change while its tile remained mounted. Two additional regressions (query
change and query round trip) observed RED; a per-filter interaction token captured
at touch-down now rejects these stale opens without remounting tiles. Affected
post-fix tests passed 5 suites / 59 tests, TypeScript/scoped lint and fresh Android
export passed. Combined coverage is 39 suites / 325 tests. Review finding resolved;
phone keyboard/visual/accessibility/performance checks remain pending. No commit
or push. See [validation](../../2026-11-06-catalogue-name-search-validation.md).
