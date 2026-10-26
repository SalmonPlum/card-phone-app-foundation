# Larger foreground card reveal — deferred design

Status: planning only; requested by the user, not implemented. Exact animation sequencing and final size remain to be confirmed. The current native shuffle and flicker correction have been visually accepted on the user's phone.

## Confirmed intent

After a draw, the selected card should feel as though it comes closer to the viewer and becomes large enough to fill the majority of the screen. Enlarge the selected card only. Preserve the accepted overhand shuffle and the existing face/name-only inspection, explicit confirmation, unique draws, and Stop/results rules. Implement this later; no application code changes are authorized by this note.

## Approaches

1. **Grow during foreground travel, then flip — recommended proposal.** Extend the existing lift toward the viewer to a much larger responsive destination. Finish travelling/growing before the accepted flip begins. This builds on the current lift → flip → hold sequence.
2. **Grow while flipping — alternative.** Overlap enlargement and rotation, then settle at the same large inspection size. This combines the motions, but changes the currently accepted flip presentation more noticeably.

Neither sequencing choice is recorded as user-approved yet. The open decision is whether enlargement finishes before the flip or overlaps it.

## Proposed presentation

- The selected card leaves the lower stack and smoothly moves toward a centred foreground position, increasing in size as if approaching the viewer.
- Starting size target for later visual validation: fit the complete card inside approximately 90% of usable screen width and the available safe-area height after reserving room for its name and a small confirmation hint. Respect the artwork's aspect ratio and do not crop it. On narrow/short phones, whichever bound is reached first limits the size.
- Base the destination on the actual screen/safe-area dimensions, not the old fixed foreground multiplier inside the scaled shuffle canvas. The current rounded shuffle viewport must not clip the enlarged card.
- Keep the full face and readable localized name visible. Meanings and descriptions remain available after Stop, not during this reveal.
- Park the remaining stacks behind the foreground card. A subtle background dim is optional, not a decided requirement.
- Hold at the large size indefinitely. No automatic confirmation, speed setting, zoom slider, or new gesture is needed.
- On confirmation, remove/recede the selected card from the foreground and resume the existing shuffle with only the remaining cards. It must not look as though the drawn card is reinserted into the active deck. The precise exit transition is a later visual choice.

## Engineering constraints for the later implementation

- Keep the current shuffle pace fixed at 1.25×. Initially try fitting enlargement into the existing 640 ms lift and retaining the 620 ms flip; judge any necessary timing adjustment on the phone rather than silently changing it.
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

Before implementation: settle the sequencing choice, validate the proposed large-card destination visually, and add a scoped implementation task to the existing plan. This note is not an instruction to implement it now.
