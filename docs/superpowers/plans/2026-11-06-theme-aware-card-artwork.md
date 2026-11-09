# Theme-Aware Card Artwork Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, task by task.

**Goal:** Define and render reusable fixed/themed layered artwork for fronts and backs, exercised by the testing pack.

**Architecture:** Optional versioned artwork definitions live in the existing deck manifest and refer to raw offline PNGs. Pure validation/resolution feeds a shared native renderer with bounded generation-safe loading/fallback. A deck-artwork context supplies definitions to drawing and all card readers; common size lookup preserves fitting geometry.

**Tech Stack:** Existing TypeScript/React Native Image tinting, Jest/Node, deterministic Pillow fixture authoring. No dependencies.

**Spec:** [Approved artwork design](../specs/2026-11-06-theme-aware-card-artwork-design.md). User said “Ok i agree start implementing”; continue inline without another plan approval, commit or push.

## Global Constraints

- Optional schema-1 artwork inside schema-2 deck: logical keys retain fixed fallback PNGs; legacy decks remain supported.
- 1–8 ordered full-canvas layers, positive safe integer dimensions, stable IDs, registered raw assets, optional finite opacity [0,1], theme background/accent with opaque fallback colors. No recursive composition.
- Native proportions, persistent artwork/animation hosts, selected back visibility, existing shuffle/detail/search timing and session identity stay intact.
- Every layer settles before readiness; 1500ms layer wait falls back to fixed artwork, with another bounded1500ms fallback wait. Generation guards reject stale events; terminal errors settle placeholders and existing retries restart composition.
- Theme-only tint updates preserve images/readiness. Alternate pack and existing fallback PNGs remain unchanged. Quiet Garden exercises back and all20 fronts; fixed, all-mask and mixed cases covered.
- Assets offline; user-owned Expo files/raw audit untouched; slider deferred. Work in current feature checkout, no commit/push.

## Review Focus

- Layer errors and timeouts must not accept partial composition or hang overlay preparation; fallback success must not trigger fatal reader error.
- Late load/error events after artwork/locale change, timeout, retry or unmount must not settle a new generation.
- Theme changes mid-flip/reading must retain layer hosts, source identity, session and frame-driven visibility.
- Metadata dimensions and PNG alpha/dimensions must agree across fixed fallback, compositions and all fitting surfaces.
- Fixed/legacy/localized packs and arbitrary card IDs must remain independent of theme IDs and app-specific artwork branches.

### Task 1: Resource contract, resolution and offline validation

**Files:** new `mobile/src/domain/artwork.ts`, adjacent `artwork.node.test.ts`; modify domain/contracts.ts, deck.ts, scripts/validate-decks.ts and asset validator tests.
**Interfaces:** ArtworkResource {schemaVersion:1,assets:Record<string,ArtworkDefinition>}; definition {width,height,layers}; layer {id,asset,tint?:{role:'background'|'accent',fallback:string},opacity?:number}. `validateArtwork(value,assetKeys):ArtworkResource`; pure `resolveArtworkLayers(definition,palette)` retains original fixed colors and substitutes named role/fallback tint. `validateArtworkFiles(decks,sizes)` enforces exact dimensions and tint-source alpha support.

- [x] Write Node regressions for valid fixed/mixed/all-mask resources, nonmutation/order/locale references, malformed versions/dimensions/IDs/limits/keys/roles/colors/opacity and raw-source non-recursion. Observe RED.
- [x] Implement contract/manifest validation and resolver. Preserve legacy fixed validation; test GREEN.
- [x] Add failing file validation cases for dimension and mask-alpha mismatch, implement and verify targeted Node cases.

### Task 2: Shared renderer and load lifecycle

**Files:** new `mobile/src/artwork/{ArtworkProvider.tsx,CardArtwork.tsx,useArtworkLoading.ts}` and adjacent tests.
**Interfaces:** provider consumes optional ArtworkResource; `useArtworkDefinitions` supplies map; `artworkSize(key,registry,definitions)` resolves composed or native fixed dimensions. CardArtwork consumes logical key/native fallback, registry, normal image style/mode/test ID, completion and fatal-error callbacks. No definition retains native fixed image behavior.

- [x] Test layer ordering, native tint/opacity, fixed regions, shared dimensions, theme updates retaining image identities, all-loaded readiness and fixed compatibility. Observe RED.
- [x] Test single/all-layer settlement, timeout→fallback, fallback success/failure/timeout, late abandoned callbacks, generation/locale changes, retry/unmount and callback deduplication. Observe RED; implement minimal lifecycle and renderer; confirm GREEN.

### Task 3: Testing pack artwork layers

**Files:** modify generate-deck-art.py, sample.ts, assetCatalog.ts/assets.ts; add raw layer PNGs; add fixture assertions to package/resource tests.
**Interfaces:** all sample logical front/back keys acquire validated definitions; original complete PNGs remain fallback assets, alternate pack stays fixed. Version sample1.2.0. Layer sources are authored explicitly in generator, full600×900 RGBA.

- [x] Add failing fixture tests for21 definitions, two semantic colors plus fixed regions, registered/same-size alpha masks and unchanged fallback/alternate hashes; observe RED.
- [x] Extend deterministic authoring, generate layers and literal registries, update manifest definitions/version and validate. Render/inspect a three-theme contact sheet; confirm GREEN.

### Task 4: Screens, regressions, documentation and final verification

**Files:** app/_layout.tsx; draw/ShuffleScene.tsx and Stack.tsx; cards/CardTile.tsx, CardDetails.tsx, CardCollectionScreen.tsx, CardDetailOverlay.tsx; affected tests and authoring/status/design docs.
**Interfaces:** root supplies configured deck artwork; draw selects localized logical keys and passes them to shared artwork under existing animated surfaces. Readers use shared size lookup and CardFace delegates rendering. Fixed direct callers remain supported without provider.

- [x] Add integration regressions covering layered fronts/backs, fixed alternate deck, locale override, all themes, mid-shuffle/flip/reveal/reading theme change, persistent layers/session, fallback overlay readiness and selected retry. Observe RED; integrate and confirm affected GREEN.
- [x] Update old native-load harnesses to deliver each real layer's completion rather than one assumed image event. Keep fixed-image boundary checks meaningful.
- [x] Document exact real-pack resource/export format and examples. Update current status/spec/plan/validation with decisions and pending phone checks.
- [x] Run one final full Jest/domain/typecheck/lint/deck/theme validation set and Android export; fix failures and rerun affected checks only. Request one independent scoped review, address material findings and leave work reviewable, uncommitted.

## Execution record

Completed inline in the existing feature checkout; no commit/push. Contract,
loading, fixture and integration regressions observed RED then GREEN. The authoring
guide is `mobile/docs/card-artwork.md`. Layer identity uses stable IDs plus raw
source keys; successful shared masks are cached across logical artwork changes.
This avoids missing completion events for unchanged native sources.

Draw geometry also now consumes declared/native dimensions: optional artworkHeight
propagates through stack, reader and hitbox math. Default2:3 geometry/animation is
retained. Native-load test helpers now settle every actual image; root geometry
fixtures use the real validated600×900 canvas instead of the previous mock ratio.

Initial final Jest44/361, TypeScript/full lint/resources/export passed. Domain
143/144 passed with one legacy metadata assertion missing hasAlpha; its four
asset-file tests then passed, as did37 affected domain cases. Independent review
found terminal backs could stay blank; two RED→GREEN regressions established the
localized error/artwork-only retry fix. Six affected suites76 tests passed, plus
two localized composition cases in two suites36 tests. Combined44 suites365 tests,
144 domain cases; final TypeScript/scoped lint and Android export passed. The user confirmed functional phone acceptance on 2026-11-09 (“Yes it works on
my phone”). Exhaustive loading/performance/accessibility checks remain distinct;
see the validation report. No unresolved material review findings.
