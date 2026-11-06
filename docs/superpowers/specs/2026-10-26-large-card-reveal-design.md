# Larger foreground card reveal — next feature after phone review

Status (2026-10-28): the user checked the current results, said they look good, and authorized continuing. Larger reveal code is implemented; final verification/review is recorded in [the implementation report](../../2026-10-28-large-card-reveal-validation.md). The user confirmed the initial enlargement works on their phone, then requested slower enlargement and dimming; the refined version still needs phone feedback. Full enlargement before flipping is confirmed. The earlier native shuffle and flicker correction were visually accepted on the user's phone. See [current priorities and verification agreement](../../current-status.md).

## Confirmed intent

After a draw, the selected card should feel as though it comes closer to the viewer and becomes large enough to fill the majority of the screen. Enlarge the selected card only. Preserve the accepted overhand shuffle and the initial large-face inspection, explicit confirmation, unique draws, and Stop/results rules. The user completed the prerequisite current-results phone review and authorized implementation on 2026-10-28.

## Confirmed sequencing

Move the drawn card toward the viewer and grow it to its full display size first. Only after that movement finishes, flip it to reveal the face. Hold the large face and name until explicit confirmation. The user confirmed this sequence; the implementation now preserves the existing lift/flip phases with a measured larger destination.

## Proposed presentation

- The selected card leaves the lower stack and smoothly moves toward a centred foreground position, increasing in size as if approaching the viewer.
- Starting size target for later visual validation: fit the complete card inside approximately 90% of usable screen width and the available safe-area height after reserving room for its name and a small confirmation hint. Respect the artwork's aspect ratio and do not crop it. On narrow/short phones, whichever bound is reached first limits the size.
- Base the destination on the actual screen/safe-area dimensions, not the old fixed foreground multiplier inside the scaled shuffle canvas. The current rounded shuffle viewport must not clip the enlarged card.
- Keep the full face and readable localized name visible initially. Updated by the user on 2026-10-28: allow swipe-up reading after the flip, shrinking the same face under the fixed name; restore the large face at the top. See [the inline-reading design](2026-10-28-drawn-card-reading-design.md). This supersedes the earlier face/name-only restriction.
- Park the remaining stacks behind the foreground card. Phone feedback on 2026-10-28 confirms a subtle background dim: fade in a fully opaque ivory canvas cover (`colors.canvas`, currently `#fbf9f3`) during lift, superseding the initial 22% dark dim after further user feedback, hold through flip/reveal, then fade out over the full 900ms resume, using the same eased progress in reverse as the 900ms fade-in. For an exhausted deck, retain the ivory cover until results takes over so no empty mat flashes. Keep the selected card and caption above this cover.
- Hold at the large size indefinitely. Confirmation uses a card tap, with a plain localized instruction below the name (“Pro potvrzení klepněte na kartu.” / “Tap the card to confirm.”), not a button-like caption. Keep the card confirmation action accessible. No automatic confirmation, speed setting, zoom slider, or new gesture is needed.
- On confirmation, remove/recede the selected card from the foreground and resume the existing shuffle with only the remaining cards. It must not look as though the drawn card is reinserted into the active deck. The user selected a gentle fade/upward drift on 2026-10-28: preserve the face and name while fading and rising 16dp across the full 900ms resume, matching enlargement speed after further phone feedback that the original 370ms fade was too fast. Final-card confirmation reaches results only after the guarded 900ms exit completes. See [the exit plan](../plans/2026-10-28-reveal-confirmation-exit.md).

## Engineering constraints for the later implementation

- Keep the current shuffle pace fixed at 1.25×. The initial enlargement used a 640 ms lift. After the user tested it and requested calmer travel on 2026-10-28, the lift was lengthened to 900 ms. Retain the 620 ms flip; the user accepted the slower pace; the revised solid canvas cover remains subject to phone feedback.
- Preserve the coherent UI render frame, atomic clock setup, persistent image surfaces, and top-card geometry that eliminated blinking. Do not switch the selected native image between parents or recreate it midway through enlargement.
- If a full-safe-area overlay is needed, keep that surface persistent from extraction onward and convert the source pose into its coordinate space. Source and destination surfaces must join without a jump.
- Keep all travel/scale progress on the UI thread and maintain the current session/epoch guards, pause/resume, reduced-motion behavior, artwork fallback, and tap lock until the reveal finishes.
- Do not increase decoded artwork resolution or predecode the entire deck unnecessarily. Size the selected image for the larger view without creating a 100-card memory spike.

## Later acceptance checks

- Full artwork fits the enlarged destination on small and tall phones, with Czech/English names, safe areas, and larger text settings.
- The card visibly approaches rather than suddenly changing size; it neither flashes nor clips at extraction, enlargement, flip, hold, or confirmation.
- The accepted shuffle path and pace are unchanged. A later draw still finishes only its current packet before revealing one card.
- The large face/name hold remains under user control, and confirmation does not return that card to the remaining deck.
- Pause, reduced motion, stale callbacks, image failure/retry, and a 100-card session preserve correctness and bounded memory.

Implementation follows [the scoped plan](../plans/2026-10-28-large-card-reveal.md) and the targeted verification agreement linked above. Final destination size, no-blink continuity and readability require phone review of the new feature.

## Future reveal preference

The user requested a future Settings choice between automatic flip and waiting for a touch after enlargement. Automatic and Tap to flip are now implemented in Settings; Automatic remains the default, while manual mode holds the enlarged back for an explicit reveal tap before the normal flip and separate confirmation. See [the future plan](../plans/2026-10-28-reveal-mode-setting.md); manual reveal must remain distinct from confirmation and must not expose the name/face early.
