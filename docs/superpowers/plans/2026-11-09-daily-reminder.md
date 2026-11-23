# Daily Reminder Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, task by task.

**Goal:** An optional daily device-only drawing reminder with saved time and safe notification navigation.

**Architecture:** A serialized reminder controller owns desired settings, permissions, owned schedule reconciliation and save errors. A React provider subscribes and refreshes on resume; a native gateway owns Expo notification I/O. A root response bridge handles matching taps after navigation is mounted, preserving the root session.

**Tech Stack:** Existing Expo/TypeScript/React Native, compatible pinned Expo Notifications 58.1.6 and native DateTimePicker 9.2.1, Jest/RNTL.

**Spec:** [Approved design](../specs/2026-11-09-daily-reminder-design.md). User approved (“Its oka”); execute inline in the current checkout. No commit/push requested. Haptics are accepted and remain untouched.

## Global Constraints

- Device-only; off initially, 09:00 initial editable local time, one repeating daily reminder.
- Permission requests only on explicit enable; ordinary approximate delivery, no exact-alarm access/remote push.
- Complete cs/en copy; tap opens Draw without drawing/resetting the live session.
- Cancel/replace only owned reminder identifiers. Hydration, rapid changes, language and resume cannot create duplicates or stale status.
- Explain permission/schedule/save/cancel failures and allow retry/settings recovery; older native clients remain usable.
- Preserve local Expo files, audit report and local Android SDK/JDK fixes. Notifications/history implemented separately.

## Review Focus

- Disable or time changes during a permission prompt/schedule/write must converge to the latest intent.
- Denied/revoked permission leaves no active reminder and cannot prompt at startup/resume.
- Failed cancellation must not falsely claim all reminders were removed; failed saving remains visible.
- Notification response listener/cold-start duplication must navigate once; daily deliveries with the same schedule ID remain distinct.
- Native modules/config must actually be included by non-clean Android prebuild while preserving local build settings.

### Task 1: Preferences, controller and native scheduling

**Files:** create mobile/src/notifications/{reminderPreferences.ts,ReminderController.ts,ReminderProvider.tsx}; platform/{reminderStorage.ts,localNotifications.ts} and adjacent tests; package/lock, jest.setup.ts.
**Interfaces:** ReminderPreferences {schemaVersion:1,enabled:boolean,hour:number,minute:number}; ReminderStorage read():Promise<string|null>,write(preferences):Promise<void>; NotificationGateway permission/request/cancelOwned/schedule plus response methods; controller exposes immutable snapshot/subscription and async start/setEnabled/setTime/setLocale/refresh/retry.

- [x] Add failing controller tests for defaults/invalid persisted data, hydrate/choice races, explicit permission denial, revoke/resume, ordered/coalesced latest changes, save/schedule/cancel failures and locale replacement.
- [x] Add native-boundary tests for ordinary daily trigger, fixed owned ID/data/channel, unrelated-schedule preservation, iOS permission semantics and unavailable-module failure.
- [x] Implement and pass targeted tests. Install only map-compatible pinned packages; request host installation if environment DNS remains unavailable.

### Task 2: Settings and native integration

**Files:** new features/settings/{ReminderSettings.tsx,ReminderTimePicker.tsx}; modify SettingsScreen.tsx, i18n/en.ts/cs.ts, app/_layout.tsx, app.config.ts, README/development notes; adjacent tests.
**Interfaces:** Provider wraps routes inside LanguageProvider; useReminderSettings exposes preferences/ready/active/busy/error/permission and actions. Native picker writes valid hour/minute only, dismiss never commits.

- [x] Add failing Settings tests for switch/time, native-picker dismissal/selection, permissions/settings links and localized failure/retry.
- [x] Implement themed accessible controls using existing scale/dock patterns. Do not add app timers or remote credentials.
- [x] Apply notification plugin with remote disabled and dedicated default channel; run non-clean Android prebuild preserving local SDK/JDK configuration. Ensure notification permission/module registration and absence of exact-alarm declarations.

### Task 3: Tap routing and final verification

**Files:** new notifications/ReminderResponseBridge.tsx and tests; root layout integration; status/spec/plan/validation docs.
**Interfaces:** gateway maps only default-action responses for owned reminders to stable delivery keys containing request ID/date/action; bridge handles listener + cold response after root readiness and active app, navigates to / without reset and clears consumed matching responses.

- [x] Add failing cold/warm/dedup/unrelated-response tests and real-router session preservation regression.
- [x] Implement response cleanup/unmount guards, latest pending tap and native-unavailability isolation.
- [x] Run integrated Jest once after shared root/dependency integration, domain/typecheck/lint/deck/theme validation and Android export. Fix/retest affected areas only thereafter unless integration risk warrants more.
- [x] Independent scoped review; regressions for material findings. Record native-build/physical permission, closed-app/timezone/reboot/tap checks separately. No commit/push unless requested.

## Execution ledger

- Approved design and inline execution. Existing feature checkout retained for phone workflow; user-owned local files preserved.
- Package versions from installed Expo map: expo-notifications ~58.1.6, DateTimePicker 9.2.1; exact pins selected. Registry DNS failed even with allowed network; host installation requested asynchronously.

## Completion record

Controller/native/UI/response missing-feature tests saw RED then GREEN. Compatible
dependencies were installed by the user after DNS failure. Prebuild regenerated
Android; restored local SDK and JDK settings, and verified plugin/autolinking.
Independent review's permission-intent race saw RED→GREEN for time and language
coalescing. The picker-focus note was elevated to a functional notification
navigation issue after a real-root RED reproduction; blur now resets only dialog
state and the regression passes. Pending-write, unavailable-module and blocked
Android channel coverage also pass.

Final checks: full 53 suites/445 tests,144 domain,TypeScript/lint/deck/theme/fonts
and export passed. One later picker-focus regression/fix passed9 affected suites/
95 tests plus TypeScript/full lint/final export. Combined53 suites/446 tests.
Native build/install and phone delivery acceptance remain pending.

Final: minor (deferred): permission-denied explanation clears on later off
reconciliation; value stays off, and explicit re-enable restores guidance.
No material findings remain; no commit/push. See ../../2026-11-09-daily-reminder-validation.md.

Phone sound-warning fix: installed Android channel API interprets explicit
sound='default' as a custom filename. Omit channel sound to use system default;
retain valid notification content sound and existing channel identity/settings.
Regression RED→GREEN; four affected suites47 tests, TypeScript/scoped lint and
Android export passed. Reload only; native rebuild not required for this fix.
