# Testing Deck Expansion Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline with focused checks.

**Goal:** Expand the configured Quiet Garden test deck from eight to 20 cards for future theme-aware artwork and search testing.

**Architecture:** Append 12 unique cards to the existing manifest, retaining the original eight cards/IDs/order. Extend the existing procedural artwork generator with matching original 600×900 symbols and statically register the new offline PNGs. No app behavior or dependency changes.

**Spec:** User authorized expanding the testing deck to at least 20 cards if manageable. Existing deck-authoring contract applies; slider remains explicitly deferred.

## Global Constraints

- Preserve original card content/IDs/artwork; append sparse numeric IDs above 99 and bump sample version to 1.1.0.
- Full Czech/English name, meaning and two-paragraph description per new card; retain the deck's shared section template.
- Unique offline artwork in the existing garden style, 600×900/2:3, language neutral. Extend the current generator; do not regenerate or replace accepted existing assets.
- Update pure catalog and literal Metro registry together. Alternate deck stays unchanged.
- New cards: Moon, Sun, Mountain, River, Flower, Feather, Key, Open Gate, Garden Bench, Still Pond, Roots, Morning Dew.
- Preserve drawing/session/animation, rounded corners and all existing user-owned work. No search or slider implementation in this task.

## Review Focus

Bilingual completeness and natural wording; stable old identities/content; unique assets and deterministic generation; sparse route IDs; full-deck exhaustion and deterministic fixture assumptions after expansion.

### Task 1: Data, matching assets and integration

- [x] Update package test to require 20 cards, unique face keys and unchanged first-eight IDs; observe RED.
- [x] Append 12 complete bilingual cards to `mobile/src/decks/sample.ts`, extend `scripts/generate-deck-art.py`, generate only new PNGs and register them in assetCatalog/assets.
- [x] Update authoring docs and fixture assumptions for shell count/selectors/results; retain their original behavioral assertions with the expanded deck.
- [x] Run domain/resource checks and affected integration tests. Because configured deck size affects drawing/results, run one final full Jest/type/lint check and Android export; repeat only affected checks after corrections.
- [x] Inspect a contact sheet of new artwork and confirm original asset hashes/content are unchanged. Request a focused final review and record verification/remaining phone checks.

## Execution record

Completed the data/artwork expansion. Package regression RED→GREEN; 118 domain tests passed. Initial full Jest had 34 passing suites and four old-size assumptions in three suites. After fixture corrections those three suites passed 66 tests; a further exhausted-session fixture correction passed the 16-test results suite. Combined evidence covers 37 suites / 306 tests against unchanged production data/code.

TypeScript/full lint, post-fixture typecheck/scoped lint, deck/theme validation and Android export passed. Verified original eight card objects and 13 PNG hashes unchanged, 12 new distinct faces reproducible, and inspected their contact sheet. Independent focused review approved with no findings. Updated authoring/current status and recorded phone checks. Work remains uncommitted; slider stays deferred and search remains separate.
