# Bottom navigation — deferred follow-up

Status: scheduled by the user’s “lets continue” after the completed draw-proportion correction. Implement the recorded navigation change while preserving the prepared animations.

## Confirmed request

Remove the separate Home/main landing page and use a persistent bottom menu in the visual style of the selected forest-green/warm-ivory Stitch design. Keep the prepared shuffle/reveal and catalogue card expansion animations.

## Initial implementation direction

Enter the app directly into drawing, with Draw and Catalogue as the current core destinations in the bottom dock. Use localized labels, a visible selected state and safe-area spacing. This starting destination and exact tab set are implementation proposals to settle when scheduled; the confirmed user request is removal of the landing page and adoption of the Stitch-style bottom menu.

The mockup's history/journal/settings/profile/audio icons do not by themselves add those features to version one. Do not display nonfunctional tabs.

The animation mat, Stop/Confirm controls, catalogue grid and detail overlay need enough space above the dock. Keep a live draw session through tab switches without reshuffling/resetting or creating multiple draw screens. Existing preview local state/reset-on-mount is insufficient for this; integrate the planned in-memory session owner before replacing navigation.

Pause animation when drawing is not visible, preserve committed cards and tokens, and resume the same state on return. Keep the catalogue's live scroll position. Define Android Back precedence for open details, results and the root destinations when implementing. Process termination still starts a fresh session; no saved history.

## Future acceptance

No Home landing screen; real bottom tabs follow Stitch styling and current app scope. Switching tabs preserves the same draw session and prepared animation, catalogue returns retain scroll, detail closing remains continuous, and controls/artwork do not sit underneath the dock. Check Czech/English, narrow screens, large text, safe areas and Android Back on the phone.

## Scheduled implementation decisions

Use the already installed Expo Router JavaScript tabs with a custom native dock styled from Stitch. A root in-memory session provider owns the same secure controller above tab screens. Replacing this with hand-toggled screen visibility would duplicate focus/Back/link handling; native tabs or a new navigation dependency are unnecessary.

The app starts on Draw at `/`; Catalogue stays `/catalogue`. These two tabs are the existing supported destinations. The former `/draw-preview` URL redirects to Draw for compatibility. The Home landing page is removed. Standalone `/card/[id]` links remain valid, but catalogue selection keeps the in-screen overlay.

Tabs remain mounted and do not freeze their React focus/lifecycle processing. Switching away pauses the existing UI-thread clock; returning resumes its same progress and session. Do not reset on Draw screen mounting, focus or tab presses. Starting a new session remains explicit; current temporary results stay in the Draw tab until that action. Closing/reopening the process still creates a fresh session.

The dock participates in layout instead of covering it. Reserve its actual safe-area/font-scaled height; Draw and Catalogue use the remaining content area with the bottom safe inset accounted once. The catalogue overlay therefore measures its actual dock-excluded host. While the overlay is active, keep dock space stable, disable its touches and hide its items from accessibility; no tab change may interrupt the modal handoff.

Android Back first closes catalogue details, then returns Catalogue to Draw. On the root Draw tab (including its current temporary results state), allow normal system Back/exit without mutating the session. Standalone details return through history or to Catalogue if entered directly. Repeated tab presses must neither add routes nor create sessions. No saved history or new result-screen work is included.

Style the dock with warm ivory, green inactive items, brass selected icon/label/pip, rounded outline and modest native shadow. Use only Draw/Catalogue icons and localized short labels. No false settings/history/profile/audio buttons. Large text may wrap; all targets remain at least48dp.

Validation must include switching during transfer/flip/reveal, retained drawn IDs and fresh-process state, stale callbacks after explicit reset, deep-link recovery, results retention, backgrounding while away, Android Back/modal accessibility precedence, grid scroll preservation, small/large-text dock bounds and unchanged 2:3 card proportions.
