# Smoother exit after card confirmation: options

Status: option 1 approved by the user on 2026-10-28; implemented in the working tree; focused checks and scoped review passed, phone acceptance pending. The user finds confirmation-to-drawing too harsh and asks for ideas. The user confirmed that the gentle fade and upward drift matches what they had in mind. This is the current reveal follow-up; retain the saved detail-scroll and future reveal-mode plans.

## Current cause

At confirmation, the logical state enters resume, which immediately hides the selected surface and caption. The ivory cover then fades away in the first 35% of the 740ms resume (259ms). Consequently the face disappears instantly and the underlying drawing appears quickly. Remaining-stack recombination already has its own accepted path.

## Options to discuss

1. **Fade with a small upward drift (recommended).** Keep the same large face and name visible after the tap, then gently fade them while drifting upward roughly 12–20dp over about 300–400ms. Let the ivory cover clear more slowly, beginning after a short overlap and finishing around 650–740ms. This gives the card a calm departure and reveals the remaining stacks smoothly, without implying the drawn card returns to the deck.
2. **Crossfade without moving the card.** Fade the face/name out in place while slowly revealing the drawing underneath over about 600–740ms. This is the quietest and simplest presentation, with less sense of physical movement.
3. **Slide the card aside.** Move the large card sideways and fade it as the cover clears. This communicates putting the drawn card aside, but is a more noticeable movement and may feel more like dismissing a panel.

All durations/distances are proposals for phone tuning, not user-approved values. The recommendation uses the existing resume interval where possible, preserving the accepted shuffle speed/path rather than adding a long wait.

## Requirements for a later implementation plan

- Keep the existing native face image mounted and showing its front through the exit; no flash of the back or reparenting. Retain the name/instruction until their fade, rather than hiding them immediately on RN confirmation.
- Preserve logical draw identity, uniqueness, explicit confirmation and stale event guards. The exit is presentation, not reinsertion of the selected card or another draw.
- Guard repeated confirmation and keep underlying controls inaccessible until the handoff is ready.
- Drive card, caption and cover from a coherent UI-thread clock, with pause/resume, tab/background handling and reduced-motion behavior.
- Handle final-card confirmation to results coherently; do not lose the exit to an immediate collection-screen unmount. Confirm that behavior while planning against the current controller.
- Use focused exit-boundary/image-identity/input tests and phone review, not repeated unrelated full-suite runs.

Selected: option 1. Initial implementation used a 370ms fade inside a 740ms resume. After phone feedback that it still looked like a blink, the current version uses a full 900ms synchronized card/name/cover fade with 16dp upward drift, matching the enlargement duration/easing. These exact tuning values are implementation choices. See [the implementation plan](../plans/2026-10-28-reveal-confirmation-exit.md).

Latest user feedback: the 900ms confirmation exit is good for now. Accepted as the working baseline, with further animation polish explicitly pending; not final visual sign-off. No further code change requested.
