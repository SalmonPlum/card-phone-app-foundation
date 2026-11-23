# Daily local reminder — validation 2026-11-09

Implemented the [approved design](superpowers/specs/2026-11-09-daily-reminder-design.md)
using the [implementation plan](superpowers/plans/2026-11-09-daily-reminder.md).
This is device-only foundation support, separate from accepted haptics and future
history. No commit or push requested.

## Resulting behavior

Settings has a default-off Daily reminder switch and native time picker with
09:00 initially. Enabled reminders repeat at the selected local hour/minute,
including days already drawn. Native daily triggers are used, not app timers or
24-hour intervals. Delivery is ordinary best-effort; no exact-alarm permission,
remote push token, account, server, Firebase configuration or APNs entitlement is
requested. Notification copy/channel labels come from the bilingual app strings.
Changing time/language replaces this feature's schedule; disabling cancels only
owned requests. Foreground handling displays the reminder; OS settings govern
notification sound/visibility independently from the drawing-haptics preference.

A serialized controller owns preference hydration, permissions, cancellation,
scheduling and saving. Late/stale operations cannot publish over newer intent.
Permission is requested only by explicit enable, including when that intent is
coalesced with a time/language change. Startup/resume never prompts. Denied or
revoked permission cancels the owned reminder and persists off; Android channel
blocking is also detected. Save/cancel/schedule errors are localized and retryable;
the UI shows attention-needed status instead of claiming a working update.
A failed startup read preserves unknown native schedules until a successful retry.

The root bridge processes only default taps on this feature's notifications after
navigation is ready and the app is active. Listener/cold-response duplication is
suppressed; delivery keys include date as repeating requests reuse an ID. A newer
live response wins over a late cold-response lookup. Consumed matching native
responses are cleared without clearing a newer/unrelated response. Taps navigate
to Draw without drawing or resetting the shared session. Leaving Settings discards
its picker/draft while preserving preferences and the rest of Settings state.

## Dependencies and native configuration

Exact Expo-map-compatible pins: expo-notifications 58.1.6 and native community
DateTimePicker 9.2.1. Registry DNS failed even after an allowed-network retry;
the user installed both. Package/lock changes and installed versions were verified;
existing overrides and prior dependencies are retained. No forced audit repair.
Native module imports are guarded so an older client remains usable with an
explicit rebuild message.

The notifications config plugin declares the dedicated default channel and
remote notifications disabled. `expo prebuild --platform android --no-install`
regenerated the native Android folder despite no explicit clean flag. Restored
and verified both local build fixes afterward: ignored local.properties points
at /home/salmon/Android/Sdk, and ignored gradle.properties uses Android Studio's
complete JDK at /usr/local/android-studio/jbr. No user shell configuration changed.
Local Expo files/raw audit report remain outside feature scope.

Autolinking resolves Expo Notifications and its native permission/scheduler/
emitter/channel modules, plus RNDateTimePickerPackage. Notification library
manifest declares POST_NOTIFICATIONS and RECEIVE_BOOT_COMPLETED; generated
application/library manifests declare no exact-alarm permissions. The dedicated
channel metadata is present. This is source/config verification, not a successful
native compilation or installation. The prior environment Gradle wildcard-IP
limitation remains; native build and physical delivery need host/phone evidence.

## Review and regression evidence

Independent scoped review found one important race: coalescing an enable with a
time/language edit could discard its permission prompt. Both reproductions saw
RED, then GREEN after carrying explicit permission authorization until consumed
or disabled. Added blocked-channel, missing native-import and pending-write race
coverage. A follow-up to the review's picker-focus observation reproduced a
mounted Settings picker left behind after a reminder tap. The root regression
saw RED, then GREEN after resetting only reminder-dialog state on Settings blur.

One minor UX note remains: the permission-denial explanation clears on a later
reconciliation while the reminder stays off (for example on resume or time edit).
The switch remains off; explicitly enabling again restores current permission
feedback. This does not schedule notifications or prompt without consent, but
retaining guidance longer is a possible later refinement.

## Verification

- Full integrated Jest: 53 suites / 445 tests passed before the picker-focus fix.
- After that focused fix, nine affected root/navigation/Settings/controller/native/
  storage suites passed 95 tests, including the new picker regression. Combined
  unchanged/full plus affected coverage is 53 suites / 446 tests, with no unresolved
  failures. No redundant full rerun after the scoped fix.
- All 144 domain tests passed. No drawing/domain behavior was changed.
- TypeScript and full ESLint passed initially and after the final fix, no warnings.
- Deck validation: both packs, 50 PNGs and 77 interface strings per locale passed.
- Theme/font validation: 3 themes, 11 faces and 108 required glyphs passed.
- Android Metro export passed after the final fix:
  /tmp/cards-reminder-post-review-android-export.
- Diff/whitespace and native configuration/autolinking review passed.

Logs: /tmp/cards-reminder-final-jest.log, /tmp/cards-reminder-final-domain.log,
/tmp/cards-reminder-review-red.log, /tmp/cards-reminder-review-green.log,
/tmp/cards-reminder-picker-red.log, /tmp/cards-reminder-final-affected.log,
/tmp/cards-reminder-post-picker-lint.log, /tmp/cards-reminder-post-review-export.log,
/tmp/cards-reminder-autolinking.json and /tmp/cards-reminder-rn-autolinking.json.

Test-fixture corrections: bilingual strings were initially inserted at the first
brace in cs.ts (an import); moved them to the actual dictionary. Android Switch
accessibility was made explicit and tested through checked state. Root fixture's
mockRestore on an already-mocked AppState listener erased the preset implementation;
restore that implementation before each case. No production subscription cleanup
was weakened to accommodate mocks. Native import-failure isolation now resets the
module cache before replacing the native module factory.

## Phone checklist / next step

Rebuild/install once from mobile with `npm run android`; a Metro reload cannot
add the notification and time-picker native modules. Local SDK/JDK fixes are
already restored. If the native folder is regenerated again, retain those local
settings or use the explicit host environment command in mobile/docs/development.md.

- Confirm fresh reminder is off and startup never asks permission.
- Choose a time a few minutes ahead, enable, allow notifications, background/close
  the app and verify a single reminder. System battery controls can defer it.
- Tap it from background and cold start; verify Draw opens with the same session,
  card order and state. Try from Settings with the picker open.
- Change time and language; verify updated copy/time and absence of old duplicates.
  Turn off and verify no later reminder. Restart and verify saved preference/time.
- Deny/revoke app permission and disable the reminder channel; inspect inactive
  status and settings recovery without automatic permission prompts.
- Inspect Czech/English, larger app/system text, screen-reader navigation, native
  picker dismissal/draft cancellation, and iOS native behavior where available.
- Check reboot and timezone/daylight-saving behavior on devices. Native scheduling
  can persist/recur independently of JS; mocked/export checks do not establish
  device delivery, OS suspension/reboot behavior or physical accessibility.

Haptics remain at the accepted Heavy reveal / Light packet strengths. History,
slider repair and unrelated security/release checks remain separate.

## Android default-sound warning correction

The phone reported: Custom sound 'default' not found in native app. Installed
Expo Notifications 58.1.6 channel manager calls customSoundExists for every
explicit channel sound string, including 'default'; omitted sound selects
Settings.System.DEFAULT_NOTIFICATION_URI. The app incorrectly supplied the
notification-content sound convention to the channel options too.

Removed the channel sound field only. Keep content.sound='default', the stable
channel ID and existing user channel preferences. Existing channel creation
already fell back to the default URI, so no destructive channel recreation or
custom sound asset is necessary. No new config/native rebuild required.

A boundary regression verified that both permission and scheduling channel
creation omit a custom filename, while notification content retains its default
sound. Observed RED then GREEN; four affected suites / 47 tests, TypeScript,
scoped lint, diff check and Android export passed. Logs:
/tmp/cards-reminder-channel-sound-red.log, /tmp/cards-reminder-channel-sound-green.log,
/tmp/cards-reminder-channel-sound-lint.log, /tmp/cards-reminder-channel-sound-export.log.
Export: /tmp/cards-reminder-sound-fix-android-export. Reload and review on the phone;
physical notification delivery/sound acceptance remains pending.
