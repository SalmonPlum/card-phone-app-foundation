# Drawn results — shared card collection

Status: scheduled by the user’s “continue in plan”. Implements the already approved results requirements from the original card-app design, adapted to the completed bottom navigation and continuous catalogue overlay.

## Behavior

After Stop, or confirmation of the final card, show Drawn cards within the Draw tab. Derive the list from the root session’s committed drawn IDs, preserving their exact order. No third tab or history is added. Catalogue continues to show the whole configured deck in manifest order.

Use the exact same card-face grid, wrapped localized captions, responsive one/two-column rules, native artwork fitting and tile-to-foreground detail overlay as Catalogue. Tiles show face and name only; tapping reveals complete name, meaning and description after enlargement. Closing or Android Back returns to the same result tile and scroll position. Lock dock/header/grid interactions and accessibility behind the open overlay, without resizing its host.

Keep an explicit New session action visible outside details, plus the localized drawn count. Empty results show the existing empty message and an explicit Draw cards action. Both actions create a fresh session only when pressed; returning from Catalogue must retain the completed results. Exhaustion never silently starts a new session. If a fresh-session entropy request fails, preserve the current results and offer the existing localized Retry UI; successful retry starts once without recommitting a card.

## Implementation boundaries

Extract the existing catalogue collection hosting/measurement/overlay wiring into one reusable component. Catalogue becomes a thin configured-deck wrapper; results supply `cardsForIds(configuredDeck, drawnIds)` and a session-specific scroll key. Do not duplicate or rewrite the animation/controller code.

Render results outside the Draw screen’s padded drawing SafeAreaView so grid width and host measurement use the same full content width as Catalogue. Both remain inside dock-reserved tab content, with bottom inset consumed once. Reuse forest/ivory theme and existing cs/en strings.

Only the currently focused collection may publish dock blocking: a newly mounted inactive results collection must not clear an active catalogue modal’s lock. Reset/unmount releases only the departing focused overlay and rejects stale native callbacks. Session identity/reset/secure RNG and all prepared shuffle/reveal/overlay timings, geometry and image ownership stay intact.

No larger draw reveal, dependency/security changes, new card fields, search, filters, journal/history, extra navigation or native configuration. Tests establish logic/native boundaries, not physical visual quality. Phone acceptance covers ordered tiles, one/odd/100 cards, complete details and return, scroll, dock/Back, languages, large text and explicit reset.
