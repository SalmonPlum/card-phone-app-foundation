# Read card information immediately after drawing

Status: implemented in the working tree on 2026-10-28, before the automatic/manual reveal setting. Phone acceptance pending.

## User intent

After a card is drawn and flipped, keep it large and let the user swipe up to read its information immediately. Use the same reading behavior as card details: scrolling down shrinks the face and gives text more room; returning to the top restores it. Include a localized “Swipe up for details” prompt.

This explicitly changes the earlier face/name-only drawing restriction: meaning and description are now available during the held reveal, without Stop or a separate route. Reuse the shared detail-content renderer so future deck-defined sections can also appear here when implemented.

## Agreed behavior and implementation choices

- Preserve the foreground sizing policy (approximately 90% usable width, bounded by height, full 2:3 artwork). Fit a fixed name above it and plain swipe/confirmation hints below; the large face remains the initial presentation, rather than starting as a thumbnail.
- Use an inline scroll view on Draw, with the first information section below the initial viewport. The full card remains until an intentional confirmation. Reading never commits another draw or opens results by itself.
- Keep the same native selected image through extraction, enlargement, flip, reading and the existing 900ms confirmation exit. Scroll collapse uses the accepted detail minimum of ~112dp or half the expanded height. The title stays fixed above the reading viewport.
- Tap the card to confirm, including when it is a pinned thumbnail. Text/hint taps do not confirm. Native scroll gestures from the card belong to the scroll view; guard against drag-end confirmation. Explicit accessibility activation confirms independently of touch-drag history.
- The artwork hit target remains a child of the scroll view, visually pinned using UI-thread translation, so swiping on the face scrolls naturally. Its static expanded spacer and shrinking opaque band keep text movement/layout stable. Disable clipped-subview removal for this single-card content so the transformed header/hit target stays mounted.
- Readable content uses the shared CardDetailsText renderer (deck-defined sections; bundled decks currently define Meaning/Description). Deck-defined templates are now implemented, and this reveal reader receives its actual deck template.
- Do not reset reading position across tab/background pauses and language changes for the same selected card. New selected card/session resets its view without moving/remounting the selected image. Ignore stale native scroll/press callbacks.
- Freeze the current collapsed pose at confirmation and apply the accepted 900ms fade/rise from that pose; do not jump large before departing. Final-card results handoff stays guarded by the same exit.
- Reduced motion keeps the initial drawn face large and changes directly to compact when scrolling, restoring large at y0 without continuous size animation. Existing stepped animation timing is unchanged.
- This is inline content, with no new modal/route or Back-navigation policy. Settings placeholders and automatic flipping are unchanged. No dependencies or native rebuild.

Phone review remains required for scroll feel, gesture cancellation, text/thumbnail placement, safe-area/large-font layout, accessibility and the confirmation fade.

Pause alignment policy: the reader remains mounted and disables user scrolling while paused. Delivered native offsets (including any late momentum events) still update the face and translated hit target together, reflecting actual content movement. Freezing only the face would create misalignment. Native momentum and interruption feel remain phone checks.
