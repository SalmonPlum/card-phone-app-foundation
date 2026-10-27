# Bottom navigation — deferred follow-up

Status: requested by the user on 2026-10-27 for the next iteration. Record only; do not implement during the draw-proportion correction.

## Confirmed request

Remove the separate Home/main landing page and use a persistent bottom menu in the visual style of the selected forest-green/warm-ivory Stitch design. Keep the prepared shuffle/reveal and catalogue card expansion animations.

## Initial implementation direction

Enter the app directly into drawing, with Draw and Catalogue as the current core destinations in the bottom dock. Use localized labels, a visible selected state and safe-area spacing. This starting destination and exact tab set are implementation proposals to settle when scheduled; the confirmed user request is removal of the landing page and adoption of the Stitch-style bottom menu.

The mockup's history/journal/settings/profile/audio icons do not by themselves add those features to version one. Do not display nonfunctional tabs.

The animation mat, Stop/Confirm controls, catalogue grid and detail overlay need enough space above the dock. Keep a live draw session through tab switches without reshuffling/resetting or creating multiple draw screens. Existing preview local state/reset-on-mount is insufficient for this; integrate the planned in-memory session owner before replacing navigation.

Pause animation when drawing is not visible, preserve committed cards and tokens, and resume the same state on return. Keep the catalogue's live scroll position. Define Android Back precedence for open details, results and the root destinations when implementing. Process termination still starts a fresh session; no saved history.

## Future acceptance

No Home landing screen; real bottom tabs follow Stitch styling and current app scope. Switching tabs preserves the same draw session and prepared animation, catalogue returns retain scroll, detail closing remains continuous, and controls/artwork do not sit underneath the dock. Check Czech/English, narrow screens, large text, safe areas and Android Back on the phone.
