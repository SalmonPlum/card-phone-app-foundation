# Reveal-mode setting — 2026-10-28

Implemented in the working tree; phone acceptance pending. User authorized continuation after the saved next-step description. No commit/push, dependency installation or native module change.

## Result and decisions

Settings has accessible, localized Automatic / Tap to flip radio choices. Automatic is the compatibility default. A separate root provider loads/saves only this preference to app-private `app-reveal-mode.txt`; language storage remains unchanged. Startup drawing waits for the initial read or explicit choice. Invalid/missing/failed reads fall back to Automatic. A late read cannot override a newer selection. Writes are serialized; a failed save leaves the choice active for this run and offers localized Retry. Process restart still creates a new draw session; no cards/history are saved.

DRAW snapshots the current preference when accepted, including a queued draw. In manual mode, the full 900ms enlargement enters untimed `awaitingReveal`; it holds the same native back over the solid ivory cover. Card identity, face and details are hidden from display/accessibility while waiting. The existing hidden title/hints retain natural measurement to preserve the enlargement target. A separate back-only press target sends `REVEAL` with session/epoch tokens. Duplicate, premature or stale actions cannot skip the flip or confirm. Settings changes affect later draws, leaving waiting/queued cards unchanged.

After the existing 620ms flip, the normal large face, fixed title and swipe-up reader become available. A separate face tap confirms. The current reading pose retains the existing 900ms fade/rise; final-card results remain guarded by that exit. Reduced-motion phases still use the existing 400ms stepped timing; waiting itself remains untimed. No artwork reparenting, shuffle speed/randomness, Back policy, palette or deck schema change.

## Verification

- RED domain evidence: manual lift incorrectly advanced to flip; 2 new behavioral tests failed before implementation, then passed.
- RED UI evidence: waiting lacked Flip card/prompt and Settings still had two placeholders; 3 affected assertions failed, then passed.
- Final affected Jest integration: **13 suites / 116 tests passed**, covering draw, Settings, preference provider/storage, session/controller/root navigation, dock and results. After adding reduced-motion waiting coverage, the **28-test native-clock suite passed**. No whole-app test rerun.
- Pure session/foreground/reading/motion checks: **36 Node tests passed**.
- TypeScript and scoped ESLint passed.
- Deck validation: 8 sample cards, 3 alternate cards, 13 local PNG assets and **42 interface translations per locale** passed.
- Android Metro export passed: `/tmp/cards-manual-reveal-export`. Bundling is not a physical performance test or release build.
- One independent scoped review found no substantive findings; reviewer additionally verified 4 focused suites / 24 tests. No review-driven production fixes required.
- Final Git whitespace/diff and current Markdown link checks passed.

Regressions cover supported/invalid/default/restored preferences, persistence/remount, delayed reads versus explicit choices, serialized writes/stale failures, delayed native write success/failure, save retry/localization, startup draw gating, queued-draw snapshots, indefinite waiting, guarded/duplicate/stale reveal, reset, final card, normal/reduced-motion waiting with no timer, opaque cover, same native image and target, hidden name/details, distinct flip/confirm targets, disabled paused input, tab/language round trips and next-draw settings changes. Existing affected automatic reveal/scroll/exit/navigation regressions remain passing.

## Phone handoff and next work

Reload the development app from Metro; no rebuild is needed for this feature. Choose Settings → Card reveal → Tap to flip. Draw a card, wait, tap its back to reveal, swipe up to read, then separately tap its face/thumbnail to confirm. Check rapid taps/held gestures do not also confirm; verify mode persists after app restart, Automatic still works, and changing Settings leaves a waiting card unchanged. Check TalkBack traversal, wrapping text, background/tab interruptions, reduced motion and continuity of enlargement → wait → flip → reading → exit.

Native touch arbitration, accessibility focus, timing feel, device performance and persistence require phone evidence. Previous language/detail/inline-reader checks remain pending where not reviewed. The next saved feature is deck-defined section templates; palette selection, animation polish, security follow-up and Android release validation remain outstanding.

## User feedback

On 2026-10-28 the user said “Looks good” and asked what comes next. Positive visual feedback is recorded; specific restart persistence, accessibility and lifecycle checks were not separately reported.
