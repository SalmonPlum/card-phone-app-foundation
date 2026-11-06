# Theme selection and UI colors: stage 2 validation

Implemented in the working tree on 2026-11-04 after the user authorized continuing
the staged plan. Stop here for phone review; fonts, shuffle presentation and
theme-aware backs remain separate stages.

## Behavior and scope

- Settings derives all available themes and their localized names from
  `mobile/src/themes/resource.json`; no app-side inclusion list or theme-ID branches.
- Selection applies semantic UI colors across Draw, its cover/readers, Catalogue,
  results, shared/direct details, dock and root navigation. Status-bar text follows
  the selected appearance. The app does not follow the device theme automatically.
- Only the selected ID is saved in the separate app-private `app-theme.txt` file.
  Existing language and reveal-mode files remain independent. Absent/unknown IDs
  and failed startup reads use the resource default, currently Mystic Arbor.
- Explicit selection wins over late reads. Native writes serialize; stale results
  do not replace the latest save state. Saving failure keeps the theme usable and
  exposes a localized retry.
- New `onSelected` and `shadow` roles prevent dark-theme selection text/shadows
  from borrowing unsuitable normal foreground colors. The supplied text color
  pairs pass automated 4.5:1 contrast checks; this is not full accessibility sign-off.
- Theme changes update style factories, without adding keys/remount gates to the
  session or image surfaces. Tests retain revealed session identity, catalogue
  image/grid instances and source assets, and paused shuffle/flip clock progress.
- Existing system fonts, font sizes, artwork faces/backs and physical card-edge
  colors remain unchanged. No dependencies or new runtime network calls.

## Verification

- Provider/storage tests: 12 passed, including ordered writes, late startup read,
  custom resource/default, remount persistence, native delayed completion/rejection,
  invalid IDs and retry. RED observed before the new modules existed.
- Settings and router integration: initially 21 passed. The changed placeholder
  tests failed before selection/UI integration. Fixed new test queries to include
  the intentionally inaccessible decorative cover and use the actual card ID 0.
  These were test setup corrections, not product behavior changes.
- Full Jest after integration: **30 suites / 243 tests passed**, no warnings/errors.
- Added two explicit paused strip/flip theme-change cases afterward; the affected
  router suite then passed **18 tests**. No production changes after the full run.
- Domain: **105 passed**, including resource validation and supplied contrast pairs.
- `npm run typecheck`, `npm run lint`, `npm run validate:decks` passed. Validation
  includes both decks, 13 PNGs and 44 translation keys per locale.
- `npx expo export --platform android --output-dir /tmp/cards-theme-stage2-export`
  passed. This establishes bundling, not a native release build or device quality.
- Independent scoped review found no blockers or substantive correctness issues.
- Post-test TypeScript/scoped lint and final whitespace/Markdown link checks passed.

## Pending phone review

1. Select each theme in Settings; inspect controls, dock, Draw, Catalogue, details,
   inline drawn-card reading, results and system-bar readability in both locales.
2. Restart after selecting a theme and verify restoration; check language and
   reveal mode retain their independent values.
3. Switch themes while a draw is paused in another tab, including mid-shuffle,
   flip, manual waiting and revealed reading; return and verify smooth continuation.
4. Check text/controls at larger system text settings, small screens and TalkBack;
   review selected-state visibility and focus indication against the dark palette.
5. Inspect persistent card surfaces, unchanged artwork and the 900ms confirmation
   exit on a phone. Automated animation tests do not establish frame performance.

Subsequent user feedback: theme switching works on the phone; the user authorized stage 3 and explicitly requested future Settings visual polish because the current menu looks unacceptable. This does not establish restart/accessibility/performance checks or Settings visual acceptance. Stage 3 font acquisition is currently blocked; see the staged plan.
