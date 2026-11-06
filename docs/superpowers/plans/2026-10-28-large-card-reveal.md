# Larger Drawn Card Reveal Implementation Plan

Initial implementation complete; user confirmed it works on the phone. Subsequent slower-travel/dim feedback is handled in [the refinement plan](2026-10-28-reveal-calm-tweaks.md), which supersedes this plan's 640ms/no-dim choices.

> **For agentic workers:** Use superpowers:executing-plans inline for this scoped feature. Steps use checkbox tracking. Follow the user's targeted-testing agreement; no per-task agent delegation or repeated whole-suite runs.

**Goal:** Enlarge the selected card into the usable foreground before flipping, holding face/name until confirmation.

**Architecture:** ShuffleScene owns the full measured safe-area drawing host and a scrollable mat/footer. Four existing stack surfaces remain in the scaled mat; one persistent selected surface stays outside the mat from initial mount. Convert its receiver pose into host coordinates and interpolate to a measured aspect-preserving destination, retaining the existing coherent UI frame/clock.

**Tech Stack:** Existing React Native, Expo Router, TypeScript, Reanimated/worklets. No dependencies.

**Spec:** `docs/superpowers/specs/2026-10-26-large-card-reveal-design.md`

## Global Constraints

- Preserve 1.25× shuffle speed, 640ms lift, 620ms flip, session transitions and explicit confirmation.
- Full enlargement precedes flip. Complete 2:3 artwork, approximately 90% usable host width limited by height and measured caption/hint space. No meanings/descriptions.
- Preserve persistent native images, bounded layers, reduced motion, pause/resume, stale callback guards and asset retry. No selected card reinserted on confirm.
- Keep user-owned gitignore/expo-env/audit changes, existing documentation changes and dependency versions.
- Work inline on existing `feat/android-foundation` checkout so the user's installed Metro workflow sees the feature; no worktree relocation or dependency reinstall. No commit/push requested; leave reviewable changes.

## Review Focus

1. Short/narrow screens and large Czech/English text: destination fits measured host and caption without cropping.
2. Scrolled mat: extraction matches receiver's actual painted top; source conversion does not jump.
3. RN/UI phase ordering: same selected/back/face hosts survive lift/flip/hold/confirmation; no old-clock frame.
4. Resize/background/tab switches: destination responds to layout and paused clock resumes once, without new card selection.
5. Input/reduced motion/error: no confirmation during growth/flip; reveal holds; retry remains reachable and old images do not blink on normal transitions.

## Task 1: Measured foreground and persistent selected surface

**Files:** Create `mobile/src/features/draw/foreground.ts` and `__tests__/foreground.node.test.ts`; modify `ShuffleScene.tsx`, `Stack.tsx`, `DrawPreview.tsx`, `__tests__/native-clock.test.tsx`, `__tests__/interaction.test.tsx`; update docs.

**Interfaces:** `fitDrawForeground(host:{width:number;height:number},captionHeight:number): Pose` returns host-space centre/scale for 238×357 card, with 16dp margins and 12dp caption gap. `toDrawHost(pose:Pose,scene:{x:number;y:number;scale:number},scrollY:number):Pose` converts scene-space pose to scroll-adjusted host position. Stack accepts optional selected-only viewport `{scene,target,scrollOffset}`; legacy default preserves reference-coordinate unit tests. ShuffleScene accepts optional `footer: ReactNode` for existing remaining/Stop controls.

- [x] Write geometry tests for 280×300, 320×480 and 430×800 hosts, wrapped captions, uniform ratio, finite fallback geometry, and scene conversion with scroll. Write native-boundary tests for extraction/growth endpoint/flip hold/host resize and selected native image identity.
- [x] Observe behavioral RED. Existing draw tests establish baseline without a full app run.
- [x] Implement pure geometry, full measured host with scrollable mat/footer, persistent selected Stack host and selected-only coordinate interpolation. Reserve measured caption space. Keep mat decoration clipped inside its own background. Hide underlying controls from interaction/accessibility during foreground; allow confirm only at reveal. Retain retry.
- [x] Run focused draw Jest tests and foreground/motion Node tests. Add navigation layout/session/results integration checks because Draw's layout boundary changes. Run typecheck and lint once after integration, then diff check. Broaden only for concrete failures or new risk; no dependency/security/deck suite for unchanged code.
- [x] Review the final diff and record exact results and choices in Markdown. Phone-check growth/flip/full artwork/long names/Back/tab/background/reduced motion/no blink; leave native visual/performance acceptance explicitly pending.

## Decisions and progress

- 2026-10-28: user says current results look good and authorizes continuing. Phone-review condition is satisfied. Existing confirmed design carries forward; no new approval round is needed for its implementation.
- Implementation choice: full-host persistent selected surface instead of scaling inside the mat, which cannot meet the saved no-clipping/full-screen intent. No extra dim effect or exit animation; confirmation removes the selected surface at the coherent resume boundary, preserving existing semantics.
- Verification uses targeted regressions and affected integrations, per user preference. Final device sizing remains subject to phone review, not claimed from Jest.

- Review correction: an oversized caption could collapse the artwork to 1dp on a short host. Observed RED with a 700dp caption in a 280×300 host, then added a caption ScrollView bounded to 40% of host height. Natural content height is measured separately, so full name/hint/retry remain reachable and the artwork keeps its own space. The boundary regression uses the native content-size event after this correction.
- Ruling: the 40% caption cap is an implementation choice for constrained screens, not a user-specified value. Normal captions retain natural height; oversized text scrolls. Phone review may adjust that proportion.
- Ruling: no new dimming or exit transition was added; the accepted coherent resume boundary removes the selected card without reinsertion.

- Task 1: code complete, phone acceptance pending. Final affected checks: 10 Jest suites / 77 tests; 11 foreground/motion Node tests; typecheck; lint (scoped rerun after the final correction); diff check; Android Metro export. See [verification report](../../2026-10-28-large-card-reveal-validation.md). Final independent review's caption finding was fixed with observed RED→GREEN coverage. No commits or device acceptance claimed.
