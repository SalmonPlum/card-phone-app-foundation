# Automatic or tap-to-flip reveal

Authorized by the user's “Ok lets continue” after the saved next-step description. Implement inline in the existing workspace, preserving earlier work. Automatic remains the compatibility default (implementation choice). Save the preference in its own app-private file, keeping locale storage unchanged. No dependencies, saved sessions or history.

Use the existing Settings radio-choice style with Automatic / Tap to flip choices and localized save-error/retry. A root preference provider loads once, serializes writes and prevents late reads from overwriting user choices. While initial preference loading is pending, pause drawing; loading failure falls back to Automatic. A selection applies immediately and persists; saving failure leaves it active for this run.

Snapshot the current mode when DRAW is accepted, including queued draws. An explicit untimed awaitingReveal domain phase follows enlargement in manual mode. Only a session/epoch-guarded REVEAL event starts the flip. Names, face and details remain inaccessible and invisible until reveal; the face is visually shown only in the existing second half of flip. Tap the enlarged back to flip, then a fresh tap after flip confirms. No timer completes the waiting phase; duplicate/premature/stale actions and Stop cannot bypass it. Current automatic behavior and 900ms/620ms/900ms timing remain unchanged. Reduced-motion stepped timings remain unchanged.

Keep the same native artwork parent, full enlargement target and solid ivory background through waiting. After flipping, retain swipe-up reading and collapsed confirmation exit. Setting changes affect later draws, including when returning to a waiting card. Pause/background/tab transitions preserve waiting and suppress input. New session invalidates old callbacks. Only palette remains a placeholder.

Approach: explicit domain waiting phase plus separate preference provider, following the existing language provider's storage conventions. A UI-only wait would leave domain phase/completion inconsistent; replacing locale storage with combined preferences would add an unnecessary migration. These are implementation decisions within the authorized behavior.

Use targeted domain/controller/preferences/settings/native-clock tests, types/lint/deck validation and one final Android bundle export. One scoped final reviewer; device touch/a11y/visual acceptance remains pending.
