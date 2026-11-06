# Settings language implementation plan

> Execute inline from the user's explicit request. Use targeted regressions, preserve existing work and user-owned files, and leave a reviewable working tree without committing/pushing.

**Goal:** Provide English-default, persisted in-app language selection with Settings placeholders for later reveal/palette controls.

**Spec:** `../specs/2026-10-28-settings-language-design.md`.

## Task 1: Locale ownership and persistence

- [x] Observe RED for the current OS-derived default: Czech device locale must still yield English without an app choice.
- [x] Resolve a compatible native persistence package. AsyncStorage installation was blocked by registry DNS; reuse the existing cached Expo FileSystem 58.0.11 package instead. Save baseline manifest/lockfile and review the actual resolution diff, preserving unrelated pins/findings.
- [x] Add a platform locale-storage adapter and LanguageProvider with English default, supported-value load, explicit-choice guard, serialized writes, localized save error/retry state and no session coupling. Switch useLocale to this context; mount provider above the existing SessionProvider without keying/remounting session by locale.
- [x] Add provider regressions for persistence across remount, invalid/error fallback, stale startup read, rapid choices and retry after save failure.

## Task 2: Settings UI and integration

- [x] Add bilingual Settings strings and a scrollable safe-area Settings screen with accessible selected English/Čeština controls. Place inactive Automatic reveal / Color palette rows marked Coming later.
- [x] Add Settings as the third bottom-tab destination and include it in modal input/accessibility locking, measured dock layout and Back behavior. Use existing palette/tokens.
- [x] Update old OS-following tests to explicit Settings selection; add real-router tests for live interface/deck translation, results/direct details, unchanged session/phase/cards, repeated current-tab presses, Back and no fake placeholder controls. Preserve relevant old coverage.
- [x] Run provider/settings/navigation/card/results/session-consumer checks, locale/deck validation, TypeScript/scoped lint and Android export. Review final diff once; record dependency/native-build and physical limitations honestly in Markdown. Broaden only for actual failures/changed shared behavior.

## Dependency notes and completion

Reused Expo FileSystem 58.0.11 already nested under Expo and already listed in the generated Android native module registry. Genuine offline npm installation hoisted the identical artifact and made it a direct dependency. Package/lock use the exact official registry tarball URL; offline normalization to semver required unavailable Zod metadata. No other dependency versions, integrity values, overrides or security findings changed. See [verification report](../../2026-10-28-settings-language-validation.md).

Final code checks: 9 affected Jest suites / 68 tests, 9 locale Node tests, TypeScript, scoped lint, deck validation (35 translations/locale), Android export and diff/Markdown checks passed. Independent review's async-write finding was fixed with observed RED→GREEN delayed completion/rejection coverage. No unrelated full suite or second review run. Phone preference persistence, three-tab layout and accessibility acceptance remain pending; no native rebuild performed.


Follow-up 2026-10-28: the reveal placeholder has now been replaced with implemented Automatic / Tap to flip choices. Palette remains a placeholder. Reveal preferences use their own private file, leaving language storage unchanged. See [reveal-mode design](../specs/2026-10-28-reveal-mode-design.md). Earlier placeholder requirements above describe this document’s original language-only scope.
