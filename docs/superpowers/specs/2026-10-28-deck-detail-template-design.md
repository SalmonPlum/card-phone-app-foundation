# Deck-defined detail templates

Status: implemented in the working tree on 2026-10-28 after the user authorized continuation. Phone acceptance pending. [Execution plan](../plans/2026-10-28-deck-detail-template-implementation.md); [verification](../../2026-10-28-deck-detail-template-validation.md).

## Confirmed intent

Each deck defines one shared template with section names and order; each card supplies localized content for those sections. All readers must render every section instead of being hardcoded to Meaning and Description. Different decks can define different templates. Preserve card names, native artwork, numeric identity, complete Czech/English content, offline packaging and session behavior.

## Implementation decisions — 2026-10-28

The user authorized implementation. Canonical schemaVersion 2 uses `detailTemplate: {sections: [{id,titles:{cs,en}}]}` and each card translation has `name`, optional `faceAsset`, and `sections: Record<string,string>`. Section IDs are stable lowercase ASCII identifiers (`^[a-z][a-z0-9_-]*$`), unique per nonempty template. All declared sections are required with nonblank plain-text content in both locales, and undeclared section content is rejected. There is no new maximum number of sections. Optional sections/rich content are out of scope for this first version. This required-section policy is an implementation choice that makes incomplete deck data fail clearly.

Schema 1 remains accepted at validation boundaries and is normalized without mutation to schema 2 with Meaning/Description headings and both existing text bodies intact. Bundled decks/fixtures migrate to schema 2 with unchanged names/content/IDs/assets. Template headings are deck content, independent of interface strings. All detail consumers receive their actual deck template explicitly; shared rendering follows template order, never map order. Identity/art localization remains available without a template; ordered section localization uses the deck. No dependency, session, timing or native artwork changes.

Approach: canonical versioned schema plus a legacy adapter avoids maintaining two renderer paths or silently ignoring extra sections. No runtime template editor or backend. Follow the linked implementation plan and use targeted tests plus one final focused review.

The shared CardDetailsText renderer receives the actual deck template explicitly through Catalogue/results collections, overlays, direct details and the held drawn-card reader. The bundled decks intentionally retain their existing two content sections; three-section custom fixtures verify the UI has no two-section limitation. See the [authoring guide](../../../mobile/docs/deck-authoring.md) for the schema and compatibility example.
