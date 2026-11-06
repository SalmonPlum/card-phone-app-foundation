# Calmer enlargement and background emphasis

Later update: the user approved the solid cover and selected a smoother confirmation exit. The [exit plan](2026-10-28-reveal-confirmation-exit.md) supersedes this document's original 259ms resume-cover fade; the initial implementation/evidence below is historical.

Status: implemented in the working tree. After confirming the calmer reveal is OK, the user requested a solid cover matching the top/bottom ivory canvas. This supersedes the initial 22% dark dim. The 900ms enlargement remains unchanged.

## Scope

- Lengthen only lift/enlargement from 640ms to 900ms as an initial phone-tuning choice. Preserve the existing path/easing and 620ms flip, 1.25× shuffle, lower/resume timing, full-card geometry and session semantics. Reduced motion retains its existing 400ms stepped boundaries.
- Add one persistent, noninteractive dim layer above the mat/footer and below the selected card/caption. Fade to 100% canvas opacity (`colors.canvas`, currently `#fbf9f3`) using the lift's UI progress; hold through flip/reveal; fade out during the first 35% of resume (259ms). Read the coherent UI frame and progress so background/paused/stale RN updates cannot dim or clear the wrong phase.
- Keep automatic flipping in this iteration. Record [the future reveal-mode setting](2026-10-28-reveal-mode-setting.md) separately.

## Targeted steps

- [x] Update duration regression and observe RED: the old clock entered flip before 899ms. Add a backdrop lifecycle/pause regression; the old implementation has no dim layer.
- [x] Implement the 900ms lift and the frame-driven backdrop without extra timers, image remounts or dependencies. Update existing affected clock expectations, including navigation flip timing.
- [x] Run draw/navigation timing tests and motion Node tests, TypeScript, scoped lint and diff review. Reuse unrelated passing checks rather than rerunning every suite.
- [x] Record verification and current priorities in Markdown. The user accepted the slower pace; the revised solid ivory cover remains subject to phone review.

## Verification results

- `npm test -- --runInBand src/features/draw/__tests__ src/navigation/__tests__/tabs.test.tsx`: 6 suites / 51 tests passed. This includes the new backdrop lifecycle/pause regression, 899ms no-early-flip boundary, persistent image/geometry checks, reduced motion and affected tab timing.
- `node --test --experimental-test-isolation=none src/features/draw/__tests__/motion.node.test.ts`: 3 tests passed; only lift timing changed to 900ms.
- `npm run typecheck`: passed. Scoped ESLint on the changed draw/motion/native-clock/navigation test files: passed.
- Android Metro export to `/tmp/cards-reveal-calm-export`: passed. No APK/device-performance claim.
- Diff, Markdown links and whitespace checks passed. No dependency/security/deck/content suites were rerun for this presentation-only refinement.

Phone checks for the revised cover: complete hiding of the underlying shuffle, matching ivory color, no blink at extraction/flip/confirmation, readable name, background/tab pause/resume and reduced motion. The user's working initial enlargement remains accepted; these new visual adjustments await feedback. No commits or dependency changes.

## Solid cover refinement

The user requested complete coverage of the drawing sequence, using the same near-white ivory as the top/bottom app canvas. The persistent backdrop now reaches opacity 1, using `colors.canvas` (`#fbf9f3`), while the selected card/caption remain above it. Fade-in still follows the 900ms enlargement; coverage is fully opaque through flip/hold and fades out over the existing resume boundary. No timing, geometry, input or session changes.

The updated native-clock regression first failed at midpoint (0.11 instead of 0.5), confirming the old partial dim. Verification: 18 native-clock tests passed, scoped ESLint passed, and diff/whitespace checks passed. No whole-app suite or export was repeated for this opacity/color-only adjustment.

The user additionally confirmed that the cover must not start opaque: it must build continuously with enlargement. Implemented via the same eased UI progress: opacity 0 at lift start, 0.5 at 450ms, and 1 at 900ms. The existing regression checks these boundaries, pause continuity, hold and resume fade. This clarification required no further code change.
