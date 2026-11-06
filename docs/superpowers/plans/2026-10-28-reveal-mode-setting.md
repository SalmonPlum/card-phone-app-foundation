# Future setting: automatic or tap-to-flip reveal

Status: implemented in the working tree on 2026-10-28. This document records the original roadmap; resolved implementation choices and actual checks are in [the design](../specs/2026-10-28-reveal-mode-design.md), [execution plan](2026-10-28-reveal-mode-implementation.md) and [verification report](../../2026-10-28-reveal-mode-validation.md). Phone acceptance remains pending.

## User intent

Let the user choose whether a drawn card flips automatically or waits for their touch, putting the moment of revelation in their hands. Both modes first extract and fully enlarge the selected card. The settings choice controls flipping, not drawing randomness or confirmation.

## Original proposed behavior (historical)

- **Automatic**: retain current behavior—enlarge, flip, hold the face/name until confirmation.
- **Tap to flip**: enlarge completely and hold the card back indefinitely. An explicit touch on the enlarged card starts its flip. After the flip completes, a separate confirmation continues drawing. The flip touch must never also confirm.
- Default to Automatic for existing installations as a compatibility choice. This default is proposed, not separately chosen by the user.
- Use a localized, accessible action such as **Otočit kartu / Flip card** while waiting. Do not expose the card's name, face, meaning or description before the requested reveal.
- Duplicate taps, held gestures, premature taps during enlargement/flip and delayed callbacks must not skip phases, draw another card or bypass confirmation.

## Original implementation outline (historical)

1. **Settings and preferences**: add an accessible Czech/English reveal-mode control, using the implemented Settings tab, where Automatic card reveal currently appears as a Coming later placeholder. Persist only this non-sensitive preference locally if settings persistence is approved; sessions/draw history still must not persist. Inspect existing storage before selecting a package; no dependency is added now. Fixed 1.25× shuffle speed remains unchanged.
2. **Session phase boundary**: add an explicit waiting-for-flip state/event instead of treating this wait as the already-flipped reveal. In manual mode, lift completion enters that wait with the same committed selected ID. A validated reveal event starts flip exactly once. Snapshot the mode for each selected card so a setting change cannot unexpectedly flip an already-waiting card. Final phase/event names are to be defined against the existing domain contracts during implementation planning.
3. **Animation and input**: keep the same persistent selected surface, full enlarged destination, dim backdrop and bounded caption. During manual waiting, preserve the card back and do not run a completion timer. Flip and confirmation must use distinct guarded actions and accessible labels. Preserve pause/resume, tab retention, reduced motion, error/retry and stale session/epoch protection. New session cancels the old wait.
4. **Targeted verification and docs**: test both modes, indefinite wait, separate reveal/confirm taps, rapid repeats, final card, reset/stale callbacks, background/tab round trips, reduced motion and localized accessibility. Test preference loading/failure separately from session initialization. Verify on a phone that the reveal feels under user control and does not blink or accidentally confirm. Record actual results in Markdown.

## Original scope and open choices (resolved by linked design)

Settings placement is now established (third bottom tab); language preference persistence uses app-private Expo FileSystem storage. Reveal-mode preference schema/control and migration still require a scoped implementation plan; do not overwrite the locale-only file with unrelated preference data. Automatic as the default and snapshotting mode per selected card are implementation proposals for predictable transitions. Do not implement shuffle speed settings, saved sessions, card history, new gestures or sound/haptics under this request.
