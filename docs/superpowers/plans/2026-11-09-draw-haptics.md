# Drawing Haptics Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, task by task. Steps use checkbox syntax.

**Goal:** One gentle reveal pulse with an independently persisted Settings switch.

**Architecture:** A HapticsProvider follows existing serialized preference storage. A guarded native adapter is called only at accepted controller transitions from flip to reveal; the pure reducer and animation are unchanged.

**Tech Stack:** Existing Expo/TypeScript/React Native, expo-haptics compatible with installed Expo, Jest/RNTL.

**Spec:** [Approved design](../specs/2026-11-09-draw-haptics-design.md). User approved implementation; proceed inline in the current feature checkout, preserving local Expo/audit edits. No new commit/push requested.

## Global Constraints

- Default on; independent local preference, bilingual Settings switch and recoverable save errors.
- Exactly one gentle pulse after flip in automatic/manual modes. No shuffle/wait/confirm/navigation pulses.
- Suppress feedback while settings load or app is inactive; never replay on hydration/resume.
- Native failures cannot interrupt drawing; retain session identity, imagery and animation timing.
- Notifications/history and deferred slider repair are outside this implementation.

## Review Focus

- Delayed preference reads must not undo an explicit switch choice.
- Rapid writes must persist in selection order; stale failure must not replace current status.
- Duplicate/stale completion tokens and rerenders must not pulse twice.
- Disabled/loading/background reveals must not replay later.
- Missing native module and rejected feedback promises must remain harmless.

### Task 1: Persistent preference and native boundary

**Files:** create platform/hapticsStorage.ts, platform/drawHaptics.ts, settings/HapticsProvider.tsx and adjacent tests under mobile/src; update mobile/package.json/package-lock.json and jest.setup.ts.
**Interfaces:** HapticsStorage {read():Promise<string|null>,write(enabled:boolean):Promise<void>}; useHapticsSettings() exposes ready/enabled/setEnabled/saveError/retrySave; pulseDrawHaptic():void safely requests Light impact.

- [x] Add failing preference tests: default/invalid values, remount restore, late read, ordered writes/stale failures, retry.
- [x] Add failing native-boundary tests: Light impact, synchronous missing-module failure, rejected promise; storage tests cover private boolean serialization and delayed write failure.
- [x] Install Expo-compatible pinned haptics; implement using existing preference/storage patterns; confirm affected tests green.

### Task 2: Settings and accepted reveal integration

**Files:** modify app/_layout.tsx, session/useSessionController.ts, features/settings/SettingsScreen.tsx, i18n/en.ts/cs.ts; create session/useDrawHaptics.ts and session/__tests__/DrawHaptics.test.tsx; extend SettingsScreen tests.
**Interfaces:** useDrawHaptics() returns (previous:SessionState,next:SessionState)=>void; controller invokes once after accepting a state transition. Provider wraps SessionProvider and Settings routes.

- [x] Add failing real-controller tests: automatic/manual reveal pulse, no waiting/confirm/shuffle pulse, stale/duplicate completion/reset, disabled/loading/background suppression without replay, changing preferences without session reset.
- [x] Add failing Settings switch test covering local choice, localized save failure and retry.
- [x] Implement accepted flip-to-reveal boundary with foreground/current preference guard, root provider, bilingual accessible themed switch. Confirm targeted tests green.
- [x] Run full Jest once after shared controller/root/dependency integration, domain tests, typecheck/lint, deck/theme validation and Android export. Reuse unchanged passes; rerun affected checks after fixes only.
- [x] Independent scoped final review; address material findings with regressions. Update status/design/validation; record required native rebuild and pending phone strength/timing acceptance.

## Execution ledger

- Design approved by user. Inline implementation authorized; current feature checkout preserves phone workflow and local user files. No automatic commit/push for this feature.

- Task 1 complete: default-on boolean preference, private file adapter, serialized
  writes/retry and best-effort Light impact. Preference/native/storage tests saw
  missing-feature RED then GREEN (14 initial tests). Package installation failed
  DNS in this environment; user installed the pinned Expo-compatible 58.0.7.
- Task 2 complete: bilingual accessible Settings switch, root provider and
  accepted controller flip-to-reveal callback; no domain/animation timing changes.
  Automatic/manual positive integration cases observed missing-pulse RED then GREEN.
- Independent scoped review found deferred background/tab completions could pulse
  on return. Two real-root regressions observed RED then GREEN; deferred completion
  now carries feedback=false through the existing controller acceptance boundary.
  Existing active/focus ref guards and session progression remain intact.
- Minor review observation about module-load failure coverage was addressed by an
  explicit older-client require-failure test. No unresolved material findings or
  deferred minors. Manual second-card fixture was corrected to explicitly flip;
  obsolete virtual mocks were removed after installation to avoid resolver clashes.
- Final verification: 48 Jest suites / 392 tests; 144 domain tests; TypeScript,
  full lint, deck/theme/font validation and final Android export all passed.
  Export: /tmp/cards-haptics-final-android-export. Full evidence and phone checklist:
  ../../2026-11-09-draw-haptics-validation.md.
- No new commit or push. Native rebuild and physical feedback acceptance pending.

## Strength and shuffle refinement — approved 2026-11-09

Scope: stronger Heavy impact at flip→reveal; existing Light impact at
strip→contact. Same switch, no timing/identity changes or native dependencies.
No continuous timers; accepted controller transitions remain the only trigger.

- [x] Write failing native-style and real-controller regressions for Light packet
  contact / Heavy automatic/manual reveal, duplicate tokens, successive packets,
  disabled/loading/background feedback and deferred background/tab contacts.
- [x] Extend pulseDrawHaptic(kind:'shuffle'|'reveal'):void and the transition
  guard; both branches share current preference/foreground checks. Run affected
  haptics/provider/Settings/controller/root suites, typecheck, scoped lint and
  Android export. Domain and unrelated checks remain valid and unchanged.
- [x] Review the focused change and update verification/status. Reload on the
  rebuilt client for physical strength/cadence review; no new native rebuild.

Refinement complete: stronger reveal/native-style and packet-landing regressions
observed RED then GREEN. Six affected suites / 53 tests passed, including real-root
deferred background/tab contacts. TypeScript, scoped lint and Android export
passed (/tmp/cards-haptics-strength-android-export). Focused diff review found no
material issues. No new native code, timing/identity changes, commit or push.
Reload the rebuilt app for physical feedback acceptance.

Phone acceptance: user said “yes thats good” after testing stronger reveal and
gentle packet-landing feedback. Feature complete; preserve accepted strength and
cadence. No commit/push requested. Daily reminder remains the next separate
feature, with history following separately.
