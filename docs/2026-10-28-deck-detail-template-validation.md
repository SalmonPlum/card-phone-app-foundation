# Deck-defined detail sections — 2026-10-28

Implemented in the working tree after user authorization. Phone acceptance pending. No dependencies, native module changes, commits or push.

## Result

Canonical DeckManifest schema 2 defines `detailTemplate.sections: {id,titles:{cs,en}}[]` once per deck. Each card translation supplies its name, optional artwork override and `sections: Record<string,string>`. A shared localization helper follows template order and resolves localized headings/content. Shared CardDetailsText renders all sections without truncation in Catalogue/results overlays, direct card links and swipe-up reading immediately after drawing. All readers receive their actual template explicitly; there is no hardcoded Meaning/Description renderer fallback.

Validation requires a nonempty template, unique lowercase IDs matching `^[a-z][a-z0-9_-]*$`, complete nonblank bilingual headings and required nonblank content for every declared section on every card. Undeclared content keys and malformed maps are rejected with field paths. There is no new section-count cap. All sections are required in this first version; optional/empty sections and rich text are future work.

Raw schema-1 objects remain accepted by validateDeck. They are normalized without mutation to schema 2 with bilingual Meaning/Description headings and both complete original text bodies. Names, IDs, catalogue order, shared/localized artwork and back overrides remain intact. New TypeScript manifests use schema 2 and callers must use validateDeck’s returned canonical object.

Both bundled decks and fixtures are migrated. A comparison against Git HEAD confirmed every original card name, Meaning/Description body, numeric ID and artwork reference is preserved exactly. The shipped decks intentionally retain two content sections; custom three-section fixtures prove this is a deck content choice rather than a UI limit. Sessions, random selection, stored preferences, artwork proportions/parenting and approved animation timings were not changed.

## Verification

- Observed RED: schema2 acceptance and schema1 canonical normalization failed before implementation (2 new behavior failures); three custom-section renderer tests failed against the fixed renderer. All passed after implementation.
- Affected card/draw/results/navigation/root-session checks: **20 suites / 195 unique tests verified passing** across the integration run and the corrected direct-detail rerun. The initial integration run had 194 passes and one test-only mock-restoration failure. Fixing beforeEach to restore the native reduced-motion promise stub made all **6 direct-detail tests pass**; production code did not change for that failure. No unrelated whole-app rerun.
- Selected Node deck/template/package/session/asset validation: **62 tests passed**.
- TypeScript and scoped ESLint passed.
- Deck validation: sample 8 cards, alternate 3 cards, 13 offline PNG assets and 42 interface strings per locale passed.
- Android Metro export passed: `/tmp/cards-template-export`. This is bundling evidence, not a release build or device-performance check.
- Git whitespace/diff and current Markdown link checks passed.
- One independent focused review found no blockers and independently confirmed bundled text/identity/art preservation.

New regressions cover three custom sections, template order versus map insertion order, both locales, differing template orders/headings, complete paragraph bodies, malformed/missing/blank template/content fields, duplicate/invalid IDs, undeclared content, schema1 compatibility without mutation, artwork overrides, canonical input identity, direct reader locale updates, all sections in collection overlay, and extra sections only after reveal on Draw with text taps leaving confirmation untouched. Existing affected native image/scroll/reveal/manual waiting/exit/session tests remain passing.

## Phone handoff and next work

Reload the development app; no native rebuild is needed. Bundled cards should retain the same visible content. For a custom schema-2 deck, check three or more headings in template order, full long paragraphs, both locales, large fonts, fixed title/shrinking artwork, overlay return, after-draw reading and accessible heading traversal. Existing animation/device acceptance items remain separate; mocked tests cannot establish phone layout, focus or performance.

See [deck authoring](../mobile/docs/deck-authoring.md) for the new format and legacy behavior. The next saved feature is palette selection. Animation polish, dependency security follow-up and Android release/device validation remain outstanding.
