# Theme fonts and typography: stage 3 validation

Implemented in the working tree on 2026-11-04 after functional phone confirmation
of stage 2. CLI network access was restored, resolving font-download failure.
Stop here for phone typography review. Settings visual polish remains separate.

## Result

Resource typography now supplies fonts, weights, sizes, line heights and tracking
through shared style factories. Titles, section headings and body use distinct
roles in all card readers. Screen titles, tiles, controls, hints, dock and Settings
also consume resource roles. Text scaling and complete Czech/English content remain.

| Theme | Card title | Section heading | Body |
| --- | --- | --- | --- |
| Mystic Arbor | EB Garamond 500, 32/38 | EB Garamond 500, 22/28 | DM Sans 400, 16/26 |
| Celestial Midnight | Noto Serif 400, 32/40 | Noto Serif 500, 22/30 | Manrope 400, 18/28 |
| Solstice Ochre | Literata 600, 38/46 | Literata 500, 20/28 | Plus Jakarta Sans 400, 18/28 |

Values are base size/line height; system scaling still applies. Midnight labels
use Space Grotesk 600. Eleven static faces total 2,501,800 bytes, with seven SIL
Open Font licenses. Catalog metadata records SHA-256 and source URLs pinned to
Expo Google Fonts commit `7d1c94f239a387cad7a8391c472741338331740f`.
Explicit per-face aliases avoid synthetic weights. No runtime font downloads.

All faces preload before the session tree mounts. One 15-second deadline covers
fonts and theme-preference restore. Failure offers localized Retry or Continue
with system fonts. Retry invalidates old reads; fallback uses the current theme
without saving and rejects late font/preference completions. Session/image hosts
stay mounted across subsequent theme changes. Artwork and shuffle styling remain
unchanged; Settings typography is updated but its layout is not redesigned.

`expo-font@58.0.10` was directly declared/hoisted from nested Expo. Its version,
resolved artifact and integrity are identical to the stage-2 baseline; other
locked packages/security overrides are unchanged. No security remediation.

## Verification

- Role resolution, missing registrations, startup loading/recovery and rendered
  reader hierarchy observed RED→GREEN. A new test's unsupported dynamic import
  was corrected to static imports before observing its intended style failure.
- Full initial Jest: **32 suites / 255 tests passed**.
- Initial lint identified an effect-based state reset; reset now occurs on retry.
  Review found a stalled-theme-read startup hang; two new regressions reproduced
  it, then passed with the shared deadline and read cancellation/retry fix.
- After that fix, **4 affected suites / 39 tests passed** (gate, provider, router,
  measured layouts). Unchanged suites retain valid full-run results.
- Final domain: **111 passed**. Final TypeScript/full lint passed.
- `validate:themes` passed: 3 themes, 11 static faces, checksums/licenses, literal
  registry and 107 Czech/English characters per face from the actual content.
- Deck validation passed: 2 decks, 13 PNGs, 47 interface keys per locale.
- Final Android Metro export passed to `/tmp/cards-theme-stage3-final-export`,
  including all 11 TTF assets. This is not a native release-build/device result.
- Independent review rechecked the startup fix and found no remaining blockers.
- Final whitespace and Markdown-link checks passed.

## Pending phone checks

1. Restart and inspect each theme's actual font character, title/section/body
   hierarchy and readability in both locales across all card readers and Settings.
2. Check narrow screens, large system text, long wrapping titles, full scrollable
   paragraphs, measured headers and complete artwork. Review TalkBack/reduced motion.
3. Switch themes during paused shuffle/flip/manual waiting/reading; inspect smooth
   continuation, unchanged artwork and the full 900ms confirmation exit.
4. Check cold start and saved-theme restoration. If the dev client lacks
   ExpoFontLoader, rebuild with `npm run android`; system fallback is recovery,
   not theme-font acceptance. Mocked clocks cannot establish native performance.

Subsequent title-removal request supersedes moving the draw heading: redundant page titles are now removed. Next separate stage: shuffle fabric presentation. Settings visual polish,
optional themed backs and later themed faces/search remain saved work.
