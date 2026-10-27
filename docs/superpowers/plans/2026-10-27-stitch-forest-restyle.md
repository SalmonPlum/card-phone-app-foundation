# Stitch Forest Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the user's forest-green/warm-ivory Stitch styling to the existing native app while preserving prepared animations and flow.

**Architecture:** Shared native theme tokens supply colors, type and surface treatments. Existing screens and shared card components adopt these tokens; motion/domain/controller code remains unchanged. Reference HTML is design input only.

**Tech Stack:** Existing React Native/TypeScript/Expo/Reanimated, no dependency additions.

**Spec:** `docs/superpowers/specs/2026-10-27-stitch-forest-restyle-design.md` (records user-supplied design and selected color variant).

## Global Constraints

- Forest green and warm ivory; native serif headings and sans body for this pass, with Czech support.
- Preserve all prepared shuffle/reveal and catalogue overlay animations, timings, coordinate equations, image identity and interaction/lifecycle guards.
- Keep full artwork, numeric IDs, bilingual text, narrow/large-font fallback and in-memory scroll position.
- Do not add the mockups' profile/audio/search/filter/settings/journal/history/share/reflection features or content.
- No dependency/lock/native config changes or runtime network access. No WebView or remote font.
- Preserve user-owned generated `.gitignore`, `expo-env.d.ts`, and audit report.

## Review Focus

1. Required text/actions must remain readable against dark mats and pale panels, including disabled actions.
2. Extra header/panel/button spacing must not squeeze cards offscreen or obscure Stop/Confirm on small/large-font phones.
3. New decoration must not intercept touches, duplicate interactive images, or reparent persistent animated surfaces.
4. Shared details styling must apply to both overlay and direct links, without adding unsupported metadata/actions or changing their content.
5. Presentation edits in animation files must be strictly limited to static style tokens/decoration; compare protected motion/controller paths to base.

## Task 1: Apply shared Stitch visual styling

**Files:**
- Create `mobile/src/ui/theme.ts` and small reusable presentation components only if used by several existing screens.
- Modify `mobile/src/app/{index,catalogue,_layout}.tsx`, `mobile/src/app/card/[id].tsx`, `mobile/src/features/cards/{CardTile,CardDetails,CardDetailOverlay}.tsx` for presentation only.
- Modify `mobile/src/features/draw/{DrawPreview,ShuffleScene,Stack}.tsx` static styles/chrome only; never alter their animation logic or image geometry.
- Add interface keys only if a necessary existing action/title lacks localized copy. Keep key parity.
- Update README with styling/reference/font limitations and phone review steps. Update tests only for meaningful existing behavior/accessibility that actually changes; no tests mirroring color/style constants.

**Interfaces:** `theme` exports typed immutable `colors`, `type`, `spacing`, `radius`, and `shadow` presentation values; colors include canvas `#fbf9f3`, forest `#1a382b`, deepForest `#032217`, brass `#c5a059`, goldInk `#775a19`, sage `#d8e2dc`, panel `#f0eee8`, ink `#1b1c19`, mutedInk `#424844`, lightInk `#f4efe6`. Body uses platform sans; headings native serif (iOS Georgia/Android serif). No theme state/selector. Existing public behavioral props remain compatible.

- [ ] Read the three reference HTML snapshots and inspect existing component/layout tests, motion protection and native-image sizing regressions. Render/view reference screenshots through Stitch if needed.
- [ ] Record existing full test baseline before changes. This is reversible presentation work; do not add superficial tests for hardcoded colors. If a behavior/accessibility change is necessary, first add a focused behavioral regression and observe RED before implementing it.
- [ ] Implement shared theme and apply coherent native typography/colors/spacing/borders/pill controls. Restyle original garden artwork containers without modifying artwork/assets, fitting or image lifetime.
- [ ] Adapt draw chrome to a warm ivory outer shell, forest animation mat, readable secondary guidance/status, primary/secondary pill actions and restrained decorations. Keep animation mathematical code/scene hosts/input rules unchanged; no fixed screenshot-size assumptions or new control semantics. Prefer reusing scene accessibility guidance instead of adding duplicate draw interactions.
- [ ] Adapt catalogue/Home/detail/direct-link/temporary-results presentation; keep all actions working and localized, avoid dead controls from mockups. Overlay remains in-screen with exact existing motion and source target behavior.
- [ ] Self-review protected logic diff, readable contrast, caption wrapping, large-font/narrow bounds, full artwork, and no remote resources. Document system-font approximation explicitly.
- [ ] Run `npm test -- --runInBand`, `npm run test:domain`, `npm run typecheck`, `npm run lint`, `npm run validate:decks`, `git diff --check`; expect no failures. Export Android with `CI=1 npx expo export --platform android --output-dir /tmp/cards-stitch-restyle-export`.
- [ ] Write report with changes, behavior preserved, actual validation and physical visual limits; commit scoped source/docs only. Independent review checks plan compliance and protected animation diff; fix blocking findings with focused regressions if applicable.
- [ ] Phone acceptance remains pending: compare forest/ivory styling to Stitch, readable cs/en, small/large fonts, Stop/Confirm access, continuous shuffle and catalogue overlay with no blinking/cropping.
