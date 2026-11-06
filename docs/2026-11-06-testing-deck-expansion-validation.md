# Quiet Garden testing deck: 20 cards

Expanded the configured `sample` deck from eight to **20** cards, version 1.1.0,
as authorized by the user. The existing alternate three-card package is unchanged.
The expansion prepares a more useful dataset for later theme-aware artwork and
Catalogue name-search work; it does not implement those features.

## Added content

| ID | English | Czech |
| --- | --- | --- |
| 104 | Moon | Měsíc |
| 118 | Sun | Slunce |
| 127 | Mountain | Hora |
| 139 | River | Řeka |
| 152 | Flower | Květina |
| 166 | Feather | Pírko |
| 173 | Key | Klíč |
| 185 | Open Gate | Otevřená brána |
| 198 | Garden Bench | Zahradní lavička |
| 207 | Still Pond | Tichý rybník |
| 219 | Roots | Kořeny |
| 234 | Morning Dew | Ranní rosa |

Every new card has its own localized meaning and two-paragraph description, using
the existing shared deck template. Multiword names and Czech diacritics provide
useful search/layout cases. IDs remain numeric and nonconsecutive, with original
IDs 0/7/12/23/35/48/64/99 and their order preserved.

Twelve original 600×900 PNGs extend the existing garden illustration generator,
using the same framing/palette and language-neutral symbols. Their combined size
is 83,366 bytes. All assets are offline, in the pure catalog and Metro's literal
registry. There are 25 PNGs across the two decks. No dependency or app behavior
changes were required.

## Preservation and artwork QA

- Compared the original eight card objects with a pre-change snapshot: identical
  content, IDs, order and asset references.
- All 13 pre-existing PNG SHA-256 hashes remain unchanged; only new PNGs were
  generated during this task.
- All 12 new faces have distinct hashes and regenerate to identical pixel buffers.
- Inspected a contact sheet at `/tmp/cards-expanded-deck-preview.png`: symbols
  are distinct, readable and consistent with the garden style. This is asset QA,
  not native device acceptance.

## Automated verification

- Package regression observed RED at 8 cards versus the required 20, then GREEN.
- Domain: **118 tests passed**.
- Initial full Jest run: 34 suites passed; four tests in three suites retained
  assumptions about an eight-card deck. Updated only fixture counts, the number
  of single-card shuffle packets and exhausted-session setup.
- Corrected navigation/results/native-clock suites passed **66 tests**. A later
  correction made the queued-exhaustion test actually exhaust all 20 cards and
  explicitly assert empty remaining IDs; the results suite passed all 16 tests.
  Combined unchanged/corrected results cover **37 suites /306 tests**.
- TypeScript and full lint passed; post-fixture-update typecheck/scoped lint passed.
- Deck validation passed: sample20, alternate3,25 local PNGs, complete bilingual
  sections, matching ratios, static registry and53 interface translation keys.
- Theme/font validation passed:11 offline faces cover108 required characters,
  including the newly authored content.
- Android Metro export passed to `/tmp/cards-expanded-deck-android-export`.
- Diff/document checks passed. Independent focused review approved with no findings.

Controlled entropy in results tests still puts Circle/Seed/Spring first, leaving
appended cards in place. Tests continue to assert order, all-card exhaustion,
stale completion rejection and session identity; no production randomness or
animation code was changed.

## Remaining phone checks

Reload the app to use the expanded deck in a fresh session. Inspect added cards
in both locales, the lower Catalogue rows, wrapped names, direct details, drawing
and completed results. Device artwork/readability/performance still require phone
evidence. Existing accepted rounded corners apply via the shared card renderer.
Slider repair remains explicitly deferred by the user. Work is left uncommitted.
