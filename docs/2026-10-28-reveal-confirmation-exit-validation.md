# Gentle confirmation exit: implementation and checks

## Latest pace refinement after phone feedback

The user liked the transition but found the face fade almost like a blink and requested the same pace as enlargement. The original face fade was only 370ms. Current code fades the face and caption, with 16dp drift, over the full **900ms**, matching the enlargement duration and easing. For non-exhausted sessions the ivory cover clears with exactly the same reverse eased progress, rather than clearing on a separate shorter window. Exhausted exit keeps the cover opaque until results at 900ms. Reduced motion retains the existing 400ms stepped boundary.

Observed RED: the timing regression reported resume 740ms versus lift 900ms. GREEN: opacity 0.5 / 8dp drift at 450ms, face still visible at 675ms, completion at 900ms, matching card/caption/cover progress and pause continuity. Final-card results remain absent through 899ms and mount at 900ms; stale reset completion remains rejected.

Latest verification: **4 affected Jest suites / 50 tests**, **4 motion Node tests**, TypeScript and scoped ESLint passed. Diff and updated Markdown checks passed. No unrelated suites, additional independent review or Android bundle repeated for this timing/easing-only adjustment. Phone review of this slower fade remains pending.

The initial implementation and its original verification are preserved below as historical evidence.

Implemented 2026-10-28 after the user selected fade with a small upward drift. Code is uncommitted in the existing feature checkout. The next separate feature remains the saved fixed-title/scroll-responsive detail design; automatic/manual flip preference remains future work.

## Result

On confirmation, the same face and name stay visible, fade over 370ms and drift upward 16dp. The ivory cover holds for 111ms, then gently reveals the remaining stacks by the end of the existing 740ms resume interval. The 900ms enlargement, 620ms flip and 1.25× shuffle are unchanged, as is the remaining-stack recombination path. No new timers, route animations, image-parent changes, dependencies or reinsertion of the drawn card.

The domain clears selectedId at confirmation as before; the visual frame retains the most recently committed face during resume. Its front stays visible until faded, avoiding a flash of the back. Caption motion/opacity and cover read the same UI frame/progress. Underlying controls/scroll and repeat confirmation stay locked until handoff; tab/background pause and stale session/epoch completion guards continue to apply.

Final-card confirmation now enters resume and reaches results only when its completion token is accepted. The cover remains ivory for this exhausted exit, avoiding an empty green mat before results. Reduced motion uses the existing 400ms stepped phase, without continuous drift/fade.

## Observed regressions and verification

- Native-boundary RED: the old implementation changed selected opacity from 1 to 0 immediately on resume. GREEN verifies unchanged face/position/front at the boundary, same native face instance, intermediate 0.5 opacity/8dp rise at 185ms, matched caption, slow cover, pause continuity and final disappearance.
- Domain RED: final-card confirmation entered results immediately. GREEN verifies resume first, null logical selection, ignored duplicate confirmation/stale completion and results only after guarded completion. Session invariants remain conserved across sparse IDs, 1/2/8/100 cards and exhaustion.
- Final-cover RED: the initial normal-resume fade exposed nearly all of the empty mat at 739ms. GREEN keeps opacity 1 until exhausted results mounts.
- Affected integration helpers now complete resume before Stop/results, replacing expectations of instant handoff. New real-router regressions verify the 739/740ms exhausted boundary, no early results mount, ignored repeat confirmation, locked underlying Stop, stale exhausted completion after reset, and tab-switch pause/resume during exit.
- Reduced-motion regression verifies one 400ms stepped exhausted exit, no intermediate animation progress, then results with exactly the committed card.

Checks run:

- Affected draw/navigation/results/session Jest: **10 suites / 85 tests passed**.
- Session/motion Node tests: **24 passed**.
- TypeScript and scoped ESLint: passed.
- Android Metro export: passed at `/tmp/cards-confirmation-exit-export`.
- Independent scoped review: no code blockers found; reviewed the implementation and focused regressions without separately rerunning tests.
- Diff and updated Markdown link/whitespace checks: passed.

No unchanged deck/content/randomness/security suite was rerun. Earlier reports remain historical evidence for other features. This work does not remediate the documented tooling-security failure.

## Choices and remaining phone checks

The exact 370ms/16dp fade and 111–740ms cover timing are implementation choices within the approved gentle exit concept. Exhausted exit retains the cover until results instead of uncovering an empty mat. The visuals reuse the existing resume clock and phase, with one additional guarded domain boundary for exhausted confirmation.

Reload the Metro development app; no native module rebuild is required. Check the calm departure of face/name, no blink/back flash, readable instruction before tapping, gradual return to drawing, repeat-tap lock, subsequent draw, pause/tab/background during exit, reduced motion and last-card handoff to results. Final visual/accessibility/performance acceptance requires phone evidence; mocked clocks/layout fixtures and Metro exports do not establish it. No APK build, commit, merge or push was performed.

Latest user feedback: the 900ms confirmation exit is good for now. Accepted as the working baseline, with further animation polish explicitly pending; not final visual sign-off. No further code change requested.
