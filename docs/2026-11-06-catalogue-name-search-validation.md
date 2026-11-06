# Catalogue name search validation — 2026-11-06

Implemented after the user's approval of the selected-language search design.
Changes remain in the working tree; no commit or push requested.

## Behavior

- Live substring matching uses only localized card names. Case, composed or
  decomposed accents and surrounding/repeated whitespace are normalized.
  Punctuation stays literal; meanings/descriptions are excluded.
- Empty search returns the original manifest array; matches retain order, numeric
  IDs and object identity. The field and grid remain mounted during edits.
- Fixed themed/scaled input includes a clear button and localized no-match state.
  Edits reset scroll; query survives mounted tabs/details and theme/size changes.
  Language changes recompute matches. There is no persistent search history.
- Full-card detail ownership is separate from the visible subset. An open detail
  survives filtering; closing returns to the filtered list.
- Keyboard-visible selection waits for keyboard dismissal, two layout frames and
  fresh bounded tile measurement. A 1500ms missing-event fallback prevents an
  indefinite wait. Content/focus/background/unmount changes cancel pending opens;
  layout changes invalidate measurements. Leaving Catalogue dismisses the keyboard.
- A filter-generation token captured at touch-down rejects delayed native tile
  measurements after edits, including a query round trip. Existing default tile
  payloads and results behavior are preserved.

## Evidence

Pure matching, keyboard lifecycle and integration regressions observed RED then
GREEN. One independent scoped review found the retained-tile stale measurement
race; two additional failing regressions reproduced it before the token guard.
That finding is resolved; no further material findings were reported.

The integrated run passed 39 Jest suites / 323 tests and 121 domain tests.
TypeScript, full ESLint, deck/theme/font validation and Android Metro export
passed. Resource validation covers 25 bundled deck PNGs, 56 translation keys and
11 font faces with the required 108 glyphs.

After the review fix, 5 affected suites / 59 tests passed (Catalogue, grid, tile
motion, results and tabs), including both new regressions. TypeScript, scoped
ESLint and a fresh Android export also passed. Combined verification covers
39 suites / 325 tests; the unchanged full-suite results were reused.

Local logs: `/tmp/cards-search-final-jest.log`,
`/tmp/cards-search-final-domain.log`, `/tmp/cards-search-stale-tile-red.log`,
`/tmp/cards-search-post-review-tests.log`,
`/tmp/cards-search-post-review-export.log`.
Final bundle: `/tmp/cards-search-final-android-export`.

## Remaining phone checks

- Type and drag-scroll with the keyboard visible; select a result on the first
  tap, then close details and verify filtered return and keyboard dismissal.
- Check English/Czech, accent-free queries, empty results and clear; switch tabs,
  language, theme and text size while retaining a query.
- Review placeholder/clear layout, contrast and wrapping across all themes,
  app text sizes and larger OS text; check screen-reader labels and focus.
- Check deep-scroll filtering, rapid edits/taps, rotation/background transitions
  and animation smoothness with the expanded 20-card deck.

Automated animation tests and Metro export do not establish native performance
or visual acceptance. Slider repair remains explicitly deferred.
