# Catalogue card expansion overlay

Status: approved by the user on 2026-10-27. Replace the page-first catalogue interaction with the in-screen card expansion overlay.

## Intent

The tapped card itself moves closer from its actual catalogue tile, then reveals details. Closing returns the card to that tile. The catalogue remains mounted and visible behind it, at the same scroll position. The previous page-first animation misunderstood this intent.

## Approaches

- Recommended: a full-screen overlay within the catalogue screen. One coordinate space, no native route/window transition during catalogue opening/closing, direct control of both directions.
- Alternative: transparent native modal. Can retain the catalogue behind it, but adds native window/safe-area coordination and potential surface handoff flashes.
- Existing separate detail route: keep only for direct links; it cannot provide the requested effect through a page fade and subsequent content scale.

The user approved the modal-style in-screen overlay design and its implementation recommendation.

## Visible behavior

1. Tap a face: measure its current full window rectangle and convert into the overlay coordinate space. Lock catalogue scrolling and duplicate taps.
2. Present the same face in a persistent overlay surface at that exact rectangle. Hide the originating face only once its overlay is ready; preserve its space and caption. Keep the catalogue visible with a gradually dimming backdrop.
3. Over approximately 420 ms, move and enlarge the face smoothly to a safe-area-bounded foreground position. Preserve native aspect ratio and show complete artwork. No flip, route change, or separate post-navigation zoom.
4. After enlargement finishes, gently introduce the localized name, meaning, description and Close control. Provide scrollable content; long text remains fully accessible. The image stays the same continuous surface as details appear. Card sizing reserves access to the Close control; complete text may extend below the initial viewport.
5. Close control and Android Back first hide details and return their scroll to the initial position behind the visible surface, then reverse the same face to its original tile. Fade the backdrop away and restore the tile only at the handoff. Restore catalogue interaction after completion.

## Engineering and fallback constraints

- Reuse existing Reanimated UI-thread animation and local artwork; no new shared-element dependency or native window needed.
- No router push/pop in this catalogue interaction. Keep a theme-colored opaque screen base; do not expose a black/empty intermediate page. The reported blink needs phone verification after removing the route handoff; its exact native cause has not been measured.
- Catalogue and card identity stay stable; do not remount the grid, consume a card, reset a session, or change the accepted shuffle or deferred draw reveal.
- Freshly measure the source before opening and closing. After layout/font changes or if the original tile is no longer measurable, use a gentle fade fallback rather than jump to a stale rectangle.
- One persistent overlay image through expansion, details and return; avoid native image remount/fade flashes. Keep full-artwork sizing correction.
- Close during opening reverses from the current pose. Ignore duplicate opens/closes. Backgrounding or stale callbacks cannot reopen or navigate another card.
- Modal accessibility: focus on details after entry, hide catalogue from accessibility while open, restore focus to the source tile when closed. Reduced motion uses immediate/fade presentation and dismissal.
- Czech and English labels/content. No gestures/settings/search/filter additions. The same reusable overlay can later serve results; results integration is outside this change.

## Acceptance

Phone review must show continuous tile-to-foreground motion and reverse return, no duplicate face or black blink, preserved scroll position, complete artwork, long localized text, and responsive Close/Android Back. Automated checks cover interpolation endpoints, coordinate conversion, rapid taps/close during opening, missing-source fallback, reduced motion, scroll restoration and stale completion guards. Tests do not establish physical animation quality.
