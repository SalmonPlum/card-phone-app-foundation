# App customization and foundation guide implementation plan

> Use superpowers:executing-plans for direct execution in this checkout.

**Goal:** Implement the resumed presentation resource design and document how an AI agent builds a final app from the foundation.
**Architecture:** A strict, pure validator owns the resource contract; one bundled resolver feeds existing translations and dock drawings. App identity, decks, themes and Markdown retain their own authoring paths.
**Spec:** ../specs/2026-11-23-app-presentation-resource-design.md (resumed by user).

## Constraints

Keep complete en/cs overrides and exact interpolation names. Stable route/action IDs,
offline resources, existing defaults, secure randomness, motion and session identity
remain unchanged. No packages, audio implementation, new Settings or commit/push.
Preserve local Expo files and audit export. Targeted checks only.

## Tasks

- [x] Write failing pure resource tests for defaults, all route/icon mappings,
  bilingual overrides, Info label and invalid/schema/locale/placeholder inputs.
  Implement `src/config/presentationResource.ts`, bundled `presentation.ts`,
  `resources/app/presentation.json`, and `scripts/validate-app.ts`.
- [x] Test translation interpolation/fallback and actual renamed Stop/navigation;
  wire `i18n/locale.ts` and `navigation/BottomDock.tsx`. Keep generic Jest fixtures
  independent of editable app JSON. Verify Info overrides do not alter content or
  enable an absent page, and icon selection retains existing route targets.
- [x] Add `validate:app` and `test:app` scripts; validate before existing launch/
  native build scripts. Run pure resource tests, affected locale/router/dock tests,
  strict types and scoped lint only. Review malformed/prototype-key inputs and
  author launch validation; no full suite/export.
- [x] Write `docs/foundation-guide.md` with resource map, app identity, step-by-step
  author workflow, agent prompt, targeted validation matrix, native/phone boundaries
  and explicit backlog. Add `mobile/docs/app-presentation.md` contract/reference and
  link both READMEs and existing author docs. Update current status and validation.

Review focus: missing/unknown keys; bilingual placeholder parity; defaults unaffected;
Info absent/overridden; labels/icons never change session actions or navigation IDs.
