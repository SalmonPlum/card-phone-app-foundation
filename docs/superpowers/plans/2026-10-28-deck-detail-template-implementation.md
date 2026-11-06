# Deck-defined sections implementation plan

> Execute inline; user authorized implementation. No commits/push requested.

**Goal:** Each deck defines ordered bilingual section headings; every card supplies section text; all readers render every section.
**Architecture:** Schema 2 canonical DeckManifest uses detailTemplate.sections and translations[locale].sections. validateDeck accepts schema 1 through a lossless two-section adapter. Shared localization resolves template order/titles; shared CardDetailsText renders the list for all reading surfaces.
**Spec:** ../specs/2026-10-28-deck-detail-template-design.md
**Tech:** Existing TypeScript, Expo/React Native, Jest and Node; no dependencies.

## Constraints and review focus

Preserve all current bilingual content, numeric IDs, offline assets, artwork/animation/session behavior and language preferences. Plain text paragraphs only. Every template section is required for every card in both locales; optional sections and rich text are future decisions. Reject malformed/duplicate IDs, missing/blank translations, and undeclared card section keys. Preserve canonical input object/order and do not mutate legacy input. Template order overrides content object key order. Validate legacy localized artwork as before.

## Task 1: Canonical schema and adapter

- [x] RED: a schema-2 deck with three differently ordered content keys validates and localizes in template order; malformed templates/content rejected; schema-1 adapter preserves both old fields without mutating source.
- [x] Introduce DetailSection, canonical schema2, section content map, localized ordered section helper; implement validation and schema1 normalization.
- [x] Migrate bundled decks and fixtures without losing any text/art/ID. Retain focused legacy tests and update existing callers/tests to canonical fields.

## Task 2: All card readers and authoring docs

- [x] RED: custom third section and headings render in shared reader, direct details, overlay and drawn-card reader; locale updates and ordered nontruncated paragraphs.
- [x] Pass template/deck explicitly through detail/overlay/draw reader; iterate shared section renderer. Keep name/artwork layout and input unchanged.
- [x] Run deck/package validation, affected domain/card/draw/results/navigation/session tests, typecheck/scoped lint and final Android export once. Broaden only for failures/shared risks.
- [x] One independent scoped review; fix substantive findings, update status/design/authoring/verification Markdown and record pending phone checks.

## Execution record

Implemented inline. RED observed for schema2 acceptance/legacy normalization and all three custom-section renderer tests; GREEN after canonical validation/adapter/renderer changes. One existing test mock cleanup issue was corrected locally and the six direct-detail tests passed. Full targeted evidence and pending device checks: [verification](../../2026-10-28-deck-detail-template-validation.md). One independent scoped review found no blockers. No commits or push.

Ruling: every section is required in both locales for this first release; optional/empty sections remain out of scope. Schema1 remains accepted at the validation boundary and returns canonical schema2, avoiding parallel renderer branches. Existing bundled text was preserved exactly rather than inventing extra sample content. All readers receive the actual template explicitly to avoid global-deck coupling.
