# Gentle confirmation exit implementation plan

> Execute inline with targeted behavioral regressions. The user selected option 1 from the saved exit design; no additional design approval is needed.

**Goal:** Let the face/name gently fade and drift upward before the drawing or exhausted results take over.

**Spec:** `../specs/2026-10-28-reveal-confirmation-exit-options.md` (option 1 approved).

**Architecture:** Retain the most recently committed selected image visually during a 900ms resume while logical selectedId remains null. Fade face/caption through the full interval and drift upward 16dp; clear the ivory cover using the same reverse easing over the same 900ms, matching enlargement. All opacity/pose updates read the same UI frame/progress. Final-card confirmation also enters resume and reaches results only on its guarded completion, keeping the ivory cover until results. This supersedes the initial 370ms fade / 740ms resume after phone feedback that the exit was still too fast.

## Constraints and interfaces

- Preserve the current 900ms growth, 620ms flip, 1.25× shuffle, full artwork, persistent native image hosts and existing remaining-stack recombination path. No reinsertion or new draw during exit.
- `confirmationExit(progress:number)` in `motion.ts` returns `{opacity:number;rise:number;coverOpacity:number}` as a worklet: fade uses `1-ease(progress)`; rise is `16*ease(progress)` dp; cover uses the same opacity as the card, reversing the enlargement cover easing. Existing ease clamps input.
- `renderFrame.selected` represents visual selected-surface availability, including resume with nonempty drawnIds; logical selectedId is unchanged. `stackCount` permits that visual surface during resume. The selected front/flip orientation stays face-up through exit.
- Draw's full-host foreground/input lock includes resume, so repeated confirm, Draw, Stop and underlying scroll cannot interrupt the handoff through the UI. Modal/tab/background pause and epoch guards remain in force.
- Session reducer CONFIRM always enters resume with selectedId null; resume completion enters results when exhausted, otherwise the existing return phase. No new domain phase/event or dependency.
- Reduced motion retains 400ms stepped boundaries: no continuous fade/drift. A stale completion after reset must never show old results.

## Task 1: Coherent exit and results handoff

- [x] Write/observe failing native-boundary regression: unchanged face/position/front at resume start despite RN/UI ordering; intermediate opacity/drift; caption matches; cover remains until overlap and clears slowly; no face remount; pause and reduced motion retain their clock semantics. Add final-card resume/results domain regression before changing reducer.
- [x] Implement the worklet envelope, visual selected retention/front orientation, matched caption exit, slower cover, and foreground lock. Change exhausted confirmation to wait for resume completion.
- [x] Update old assertions that expected instant disappearance/results. Feed real resume completion in results helpers and Stop-after-confirm router/layout tests. Add real-router final-card test that verifies no results before 900ms and no stale completion after reset.
- [x] Run affected draw/navigation/results/session tests and session/motion Node tests. Run TypeScript/scoped lint and an Android Metro export once after integration. Broaden only for failures or changed shared behavior.
- [x] Review the scoped diff; record exact checks and phone limitations in Markdown. No commit/push requested. Preserve user-owned files.

## Decisions

- Initial 370ms/16dp and 111–740ms cover fade were retuned after phone feedback. Current exit: 900ms for the complete card/caption/cover fade, retaining 16dp drift. The duration and easing match enlargement as explicitly requested.
- One resume interval handles final-card exit rather than a separate timer or route animation, avoiding duplicate completion sources and image unmount before the exit.

- Final-card presentation refinement: the cover stays fully ivory throughout exhausted resume and hands over to the ivory results screen at completion, rather than revealing an empty green mat. A real-router regression first observed near-zero opacity at 739ms, then passed with retained opacity 1. Normal non-exhausted cover fade now spans the full 900ms, matching the later requested pace.

Task 1: code complete. Final results: 10 affected Jest suites / 85 tests, 24 session/motion Node tests, TypeScript, scoped lint, Android Metro export and diff/Markdown checks passed. Independent scoped review found no blockers. Phone acceptance of the new exit is pending. See [verification report](../../2026-10-28-reveal-confirmation-exit-validation.md).

Latest timing-only refinement: 4 affected Jest suites / 50 tests and 4 motion Node tests passed. TypeScript, scoped lint and diff/Markdown checks passed. New midpoint regression verifies opacity 0.5 at 450ms, continued face visibility at 675ms and completion at 900ms. Final-card tests now guard the 899/900ms boundary. No whole-suite, independent review or Android export repeated for this scalar/easing retune; the earlier 85-test/export/review results above belong to the initial implementation. Phone review of the slower fade remains pending.

Latest user feedback: the 900ms confirmation exit is good for now. Accepted as the working baseline, with further animation polish explicitly pending; not final visual sign-off. No further code change requested.
