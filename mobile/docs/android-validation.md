# Android motion validation (pending)

Current status clarification (2026-10-28): the app README records user acceptance of the baseline shuffle movement and flicker correction. The regression instructions below are historical; they do not mean that baseline approval is missing. Subsequent navigation/layout integration checks and release/device performance evidence remain pending. The user has now approved current results, and the larger drawn-card reveal is implemented in the working tree. The user confirmed it works; its subsequent 900ms growth and dim backdrop need phone feedback; see the app README and current verification report. See [current status](../../docs/current-status.md).

The temporary home action opens the draw preview in the existing development client. After the phase-clock fix, stop any old Metro process and restart from `mobile` with `npm start -- --clear`, connect the already-built client, and fully reload the JavaScript bundle. No new native dependencies were added.

Compare the native motion against `prototypes/overhand-shuffle.html` at 1.25×: observe multiple complete passes, tap at regrip, ready, strip, contact and return, then confirm that the moving packet lands before a card lifts and flips. Check that the card name stays visible until confirmation, the source parks and rejoins, and Stop opens committed results. Repeat with a narrow display, increased font size, reduced motion and background/foreground during a flip. Check the 100-card fixture through the controller tests; physical 100-card rendering still needs a device fixture. Capture device identity and a recording if available. Native appearance, fluidity, performance and approval are not established by Metro export or mocked tests.

## Phase-clock regression to retest

The first phone run exposed rapid, nearly invisible packet transfers and late taps being ignored without an error screen. The old clock reset a shared value on JavaScript and immediately read the previous phase's completed progress, producing zero-duration later phases. Commit `a25014e` moves reset and timing setup into one UI-thread operation. A deferred-write integration test reproduced the original failure and now checks multiple timed transfers, a full return, and a second-pass tap through one held reveal. This is automated evidence; the corrected build still needs phone confirmation. Let one full pass finish before tapping, then repeat a late draw and confirmation.

## Flicker regression to retest

The phone confirmed timing/drawing work, but decks flashed ahead during packets and returns. The renderer previously mixed React phase/count changes with a separately advancing UI clock, and recreated native back-image hosts at phase boundaries. Commit `243c6d1` publishes a bounded coherent UI render frame with the clock, keeps five keyed card-surface hosts mounted, and explicitly disables native image fading. Original source failed both mapper-order and native-image identity regressions; the correction passes them while retaining the same paths and timings. `7934553` also preserves reduced-motion packet deadlines when a draw queues.

Restart Metro with `npm start -- --clear`, fully reload the existing app, and check packet transfers and a whole return for premature-position flashes or blinking. Then draw and confirm to check the resume. This requires no native dependency rebuild. The code is independently reviewed; phone no-blink acceptance remains pending until the user confirms. Application checks now pass 35 Jest and 71 Node tests, typecheck, lint, deck validation and Android bundling. The separate tooling-security regression remains pending and is not included in this pass statement.


## Theme typography (2026-11-04)

Theme switching was confirmed working on the phone. Stage-3 bundled fonts and
resource typography are now implemented and need their own phone review. Follow
[the font validation checklist](../../docs/2026-11-04-theme-typography-validation.md),
including large Czech/English text, startup/restore, active-session theme changes
and physical animation quality. All 11 TTFs appear in the Android Metro export.
If the installed dev client lacks ExpoFontLoader, rebuild with `npm run android`;
startup fallback keeps the app accessible but does not establish font acceptance.
Settings visual polish is explicitly still required.


## Shuffle fabric (2026-11-04)

The frame now uses an offline woven tile, with native density selection and
resource-controlled opacity. Hint placement and motion are unchanged. Follow
[stage-4 verification/device checks](../../docs/2026-11-04-shuffle-fabric-validation.md)
for native repeat appearance/seams, text contrast and animation performance.
