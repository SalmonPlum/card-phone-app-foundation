# Bottom Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Implemented through `fee60c3`; both task reviews and final integration fix review approved. App143/domain71/typecheck/lint/decks/Android export pass. Phone dock/motion/Back/accessibility acceptance remains pending.

**Goal:** Remove the Home landing page, open directly on Draw, and provide the selected Stitch-style Draw/Catalogue bottom dock without losing a live session.

**Architecture:** A root in-memory provider owns the existing secure session controller. Expo Router JS tabs retain the Draw/Catalogue screen instances and native focus handling; a custom safe-area dock reserves layout space. Catalogue overlay state temporarily locks/hides dock interactions without resizing its host.

**Tech Stack:** Existing Expo Router/React Native/TypeScript/Reanimated; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-27-bottom-navigation-follow-up.md`, including scheduled implementation decisions.

## Global Constraints

- Preserve all prepared shuffle/reveal and catalogue expansion motion, phase timings, corrected2:3 proportions, persistent image hosts, current-packet draw boundary and stale-token guards.
- Draw and Catalogue are the only tabs. No Home landing, dummy destinations, settings/history/journal/profile/audio features or saved sessions.
- Opening/focusing/pressing Draw never resets an existing session. New session is explicit; process recreation starts fresh.
- Catalogue reads all configured cards without consuming or reordering the session. Both screens use the same configured deck and cs/en locale.
- Dock reserves its layout height/safe area once; controls/artwork remain above it. No overlay host resizing when modal interaction is locked.
- No dependencies/lock/native config/security changes. Preserve user-generated gitignore/expo-env/audit files.

## Review Focus

1. Tab switches during packet/flip/reveal preserve progress/identity and never commit an extra card on background or delayed callbacks.
2. Screen remounts, repeated tab presses and native focus changes cannot create/reset sessions; explicit reset rejects old callbacks.
3. Catalogue overlay intercepts Android Back and disables dock/accessibility while open, then unlocks without a host-size jump.
4. Safe area and large-font dock height reduce measured content once; one-column foreground sizing/scroll restoration still use the actual host.
5. Deep links/legacy draw URL and Android Back work without a phantom Home or accumulating duplicate Draw screens.

## Task 1: Shared in-memory session owner

**Files:** Create `mobile/src/session/{SessionProvider,useSessionController}.tsx` (controller may use `.ts`); modify `mobile/src/app/_layout.tsx`, `mobile/src/features/draw/DrawPreview.tsx`, `mobile/src/features/draw/usePreviewSession.ts`; create `mobile/src/session/__tests__/SessionProvider.test.tsx`; preserve existing controller/clock tests.

**Interfaces:**
- Move the existing `usePreviewSession(deck:DeckManifest)` implementation unchanged into `useSessionController(deck:DeckManifest)` under session. Keep a thin compatibility re-export at the old path so existing focused timing tests exercise the same implementation; no duplicate controller logic.
- Export `SessionController = ReturnType<typeof useSessionController>` (state,error,reset,retry,draw,complete,confirm,stop current contracts) and `SessionProvider({children}: {children:ReactNode})` using `configuredDeck`; `useSession():SessionController` throws a clear programmer error outside provider.
- Provider initializes once per mounted app lifetime; an entropy failure remains retryable without reset loops. Root layout wraps its navigation in the provider. DrawPreview consumes it, removes mount-reset and uses configuredDeck rather than sampleDeck for scene/results. Existing focus/background clock guards remain untouched.

- [ ] Write failing tests proving one initialization, consumer unmount/remount retains sessionId/remaining/drawn/phase, explicit reset creates fresh identity and rejects previous tokens, independent provider remount starts fresh, and initial entropy error retries safely. Use deterministic entropy only at test native boundary.
- [ ] Run `npm test -- --runInBand src/session/__tests__` and observe expected behavioral failures before implementation.
- [ ] Move controller and implement provider/consumer wiring. Keep original controller reducer/RNG/packet logic and all phase semantics identical. Never add persistence or insecure entropy fallback.
- [ ] Run provider plus existing draw tests, then full Jest/domain/types/lint/decks. Existing Home/routes remain functional until Task2. Commit scoped session work and write report.

## Task 2: Stitch bottom dock and route integration

**Files:** Create `mobile/src/app/(tabs)/{_layout,index,catalogue}.tsx`, `mobile/src/navigation/{BottomDock,TabInteractionContext}.tsx`, `mobile/src/features/cards/CatalogueScreen.tsx`, navigation tests under `mobile/src/navigation/__tests__/`; modify root layout and old index/catalogue/draw-preview routes, `DrawPreview.tsx`, standalone card route if fallback requires adaptation, i18n dictionaries, and existing shell/catalogue router tests/README. Delete old landing-page component/routes once group routes own their canonical URLs; no duplicate index/catalogue paths.

**Interfaces:**
- Consume Task1 `SessionProvider/useSession` from root; tab screens do not own a controller or reset it.
- Root stack owns `(tabs)` and standalone `card/[id]`; `(tabs)` layout uses existing exported `Tabs` with initial route `index`, no tab change animation, `freezeOnBlur:false`, `unmountOnBlur` behavior disabled/omitted appropriately for installed version. Standard back behavior returns Catalogue to initial Draw. Keep both tabs mounted after first use, preserve local overlay/list state.
- `BottomDock` accepts installed Expo Router `BottomTabBarProps`, renders only index/catalogue routes with tab press/long-press event handling and current selected state; navigation to current tab is a no-op. Use short localized Draw/Catalogue labels (add `drawTab` cs`Tahání`/en`Draw`, `catalogueTab` cs`Katalog`/en`Catalogue`). No icon dependency: simple code-native card/grid glyphs marked decorative.
- `TabInteractionProvider` exposes `{blocked:boolean;setBlocked(value:boolean):void}` and a hook; catalogue publishes active overlay through layout effect/cleanup. Dock reserves same size but has disabled touches/no-hide-descendants while blocked. Default hook behavior outside tabs can be no-op for standalone screen composition; real app always has the provider.
- Catalogue component moves to features/cards with thin tab route. Remove Home link and retain localized catalogue title; source overlay measurement/controller equations unchanged. SafeAreaView bottom edge excluded inside dock-reserved tab content; effective overlay bottom inset is0 because dock has already consumed it. Top/side safe areas remain respected. Direct detail route retains ordinary full-screen safe areas.
- Legacy `/draw-preview` redirects to `/`; standalone card route fallback `/catalogue` works with grouped tabs. No Home shell.

- [ ] Write failing real-router tests for `/` showing Draw+two tabs and no home, Draw→Catalogue→Draw with same session/remaining/drawn state, repeated current-tab presses no reset/route growth, results retention, configured deck and cs/en labels. Replace obsolete landing-page expectations with navigation behavior; retain invalid/valid card links.
- [ ] Write failing controlled timing integration for switch during strip and flip/reveal: UI pauses on blur, no off-tab commit, resumes one logical completion on return. Include background while away and explicit new-session stale completion.
- [ ] Write failing modal/Back tests: catalogue overlay locks dock interaction and a11y without changing host/list instance; Back dismisses before tab navigation; unlock permits Draw; plain Catalogue Back returns Draw; root Draw permits normal exit. Legacy route/direct-link tests cover recovery without Home.
- [ ] Write layout tests using actual rendered dock/content/host bounds or native layout boundary evidence for narrow/large fonts and safe insets; assert no double bottom inset or absolutely covering dock. Retain real native-image and source/foreground growth regressions; adjust expected host/insets for reserved dock deliberately.
- [ ] Run focused navigation/card tests and observe intended RED. Build tabs/dock/context and migrate route composition, adjusting import paths for moved screens. Keep original timing mocks faithful to native deferred shared-value scheduling.
- [ ] Ensure Close remains accessible, dock locking does not resize/open-close the overlay, and catalogue scroll survives tab switches. Keep Draw mat/control min bounds usable above dock; no prepared pose/clock changes.
- [ ] Run fullJest/domain/typecheck/lint/decks/diffcheck and Android export to `/tmp/cards-bottom-navigation-export`. Document warnings/remaining phone checks. Update README routing/session/Back behavior; commit scoped source/docs.
- [ ] Independent task review then plan-wide integration review. Phone acceptance pending: dock alignment/fonts, pause/resume packet+flip/reveal, no reset/duplicates, catalogue continuous return/scroll, 2:3 proportions, safe-area/large-font bounds and Android Back. Do not claim native performance from tests.
