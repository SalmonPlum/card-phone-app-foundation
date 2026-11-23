# Daily local drawing reminder

## Scope and intent

Second separate device-only foundation feature, after phone-accepted haptics.
One configurable daily reminder to draw cards, using the phone's scheduler.
No server, account, remote push, history integration or new drawing behavior.
Specific apps may extend notification copy and behavior later.

## Proposed behavior

- Add Daily reminder in Settings: off initially, saved enable switch and a native
  time picker. Proposed initial time is 09:00, editable before enabling.
- One notification daily at the chosen local hour/minute, including days on which
  cards were already drawn. Use wall-clock daily scheduling, not 24-hour intervals.
- Ask notification permission only on an explicit enable action, never startup.
  Permission denial leaves the reminder inactive, explains the reason in the
  selected language and offers the OS app-settings link when appropriate.
- Notification copy follows the selected app language: “Time to draw your cards” /
  “Čas vytáhnout si karty”; generic foundation wording, no deck-specific claims.
  Update the pending reminder when the app language changes.
- Tapping this app's reminder opens Draw after startup is ready. Preserve any
  existing session and animation safety; never automatically draw or reset cards.
  Ignore unrelated notifications and deduplicate a consumed notification response.
- Changing the time replaces this feature's pending reminder; switching off
  cancels it. Never cancel another feature's notifications. Persist preferences
  locally and reconcile owned schedules at startup/resume without duplicates.
- Schedule/save/cancel failures remain visible with localized retry. The UI must
  not claim a working reminder if permission or scheduling failed. An older dev
  client lacking the module stays usable with an actionable rebuild message.
- Use ordinary reminder delivery; do not request alarm-clock/exact-alarm access.
  Android can defer delivery for battery management; present timing as approximate.
- Retain current haptics, theme/font/settings/session behavior and local user files.

## Approaches

Device-only scheduling was selected by the user. OS-scheduled local notifications
fit this requirement because they can deliver while the app is closed. An in-app
JavaScript timer cannot provide that closed-app behavior. Remote push would add
an unnecessary service/account dependency to this explicitly device-only scope.
Use Expo Notifications compatible with installed Expo and a compatible native
community time picker. Exact package versions and internal storage/reconciliation
interfaces are implementation choices to verify before installation.

## Validation and delivery

Cover default-off/restore, explicit permission request/denial/revocation, owned
schedule replacement/cancellation, rapid changes and stale asynchronous outcomes,
failed writes and scheduling, bilingual copy, notification response deduplication,
cold/warm startup routing and preserved drawing sessions. Validate affected Settings,
root/navigation integration plus package/config/native export changes. Physical
permission prompts, closed-app delivery, time-zone/DST behavior, reboot delivery
and tapping notifications require phone verification.

A native rebuild is required for the new modules/config; preserve the saved local
SDK and Android Studio JDK settings. Keep this feature separate from history.
No commit/push requested. Approved by the user on 2026-11-09 (“Its oka”).

## Reference

Expo SDK 58 Notifications documentation:
https://docs.expo.dev/versions/v58.0.0/sdk/notifications/
