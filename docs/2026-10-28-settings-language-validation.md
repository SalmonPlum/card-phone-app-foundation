# Settings and manual language: implementation and checks

Implemented 2026-10-28 in the existing working tree, uncommitted. The primary feature is language selection; reveal mode and color palettes remain future work.

## User-visible behavior

Settings / Nastavení is the third bottom-tab destination. English / Čeština radio choices update the interface and all deck/card text immediately across Draw, Catalogue, results and direct details. A fresh install defaults to English regardless of the phone's language. A supported saved choice is restored on later app starts. There is no automatic device-language mode in Settings.

Changing language preserves the current session identity, card order, drawn results and paused animation progress. Settings uses the measured dock/safe-area layout, remains available independently of entropy initialization, and follows existing Back-to-Draw navigation. All three dock destinations are locked/hidden from accessibility while a collection detail modal is active.

Automatic card reveal and Color palette are plain informational rows marked Coming later, not switches or working controls. Current automatic flip and forest/ivory colors are unchanged. See [future reveal mode](superpowers/plans/2026-10-28-reveal-mode-setting.md) and [future palettes](superpowers/specs/2026-10-28-color-palette-setting-design.md).

## Locale ownership and storage

LanguageProvider sits above the existing SessionProvider without remounting/keying it by locale. Existing useLocale consumers now read this app choice. English is available initially; an asynchronous saved read can restore cs/en only if no explicit selection has superseded it. Writes are serialized and stale success/failure cannot replace the latest save status. Read failure or unsupported saved data falls back to English. Write failure keeps the chosen language active and exposes a localized saving error and Retry in Settings.

Only the locale code is stored in `Paths.document/app-language.txt`; no session, card history or deck order is persisted. Native storage is required lazily, so an incompatible older dev client reports a recoverable save failure rather than preventing language selection for the current run. The actual File.write promise is awaited before confirming a save or starting the next write.

## Dependency and native evidence

Initial AsyncStorage installation failed with registry `EAI_AGAIN` in the sandbox and after the approved host retry. A compatible Expo FileSystem 58.0.11 artifact was already cached and already present in the baseline lock under Expo. A normal cached metadata install lacked required cached responses; a genuine offline npm install of the official registry tarball succeeded after writable-cache approval.

The final manifest and npm-generated lock declare the exact official URL `https://registry.npmjs.org/expo-file-system/-/expo-file-system-58.0.11.tgz`. Normalizing the root spec to a semver pin with offline npm required unavailable Zod metadata; the matching exact tarball spec was retained instead. No fabricated lock data, peer bypass, override removal or forced upgrade was used.

A comparison against the task's saved baseline lock shows only three changed entries: the root direct dependency and FileSystem's move from `node_modules/expo/node_modules/expo-file-system` to `node_modules/expo-file-system`. Version, registry URL and integrity are identical. No other package version/resolution or existing security override changed. Installed Expo declares `expo-file-system ~58.0.10`; 58.0.11 is in that compatible patch range.

The existing generated Android ExpoModulesPackageList already includes `expo.modules.filesystem.FileSystemModule`. This reuses the same native module/version rather than introducing a new native implementation. Restart Metro with a clear cache after the package hoist, then reload the existing development client. Phone persistence still needs verification; an older/different client missing this module would need rebuilding. No APK/device build was run here.

The offline installer's summary is not a fresh advisory audit. Existing security findings/follow-up remain unchanged and no new audit report or security-remediation claim is made. Background API references: [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/) and [Expo storage guidance](https://docs.expo.dev/develop/user-interface/store-data/); the installed SDK package/types were checked for exact API behavior.

## Evidence and verification

- English-default RED: the old hook returned cs on a mocked Czech phone. GREEN returns en until an app preference selects otherwise.
- Settings-entry RED: no Settings tab existed. GREEN opens the real screen through the router.
- Provider tests cover supported/invalid stored values, provider remount restoration, late startup read after explicit selection (including selecting English), ordered rapid writes, ignored stale failures, read fallback and save retry.
- Native-storage boundary checks cover app-private locale-only persistence, errors, delayed completion and delayed rejection.
- Independent scoped review found one P1 issue: the adapter initially discarded the asynchronous native File.write promise. A realistic delayed-write regression observed premature success (RED). Awaiting File.write fixes completion ordering and asynchronous error propagation (GREEN). No other code blockers were reported.
- Real-router checks cover English default on a Czech phone, manual Czech throughout tabs/cards/results/direct details, unchanged session, Settings Back, modal locking, and the same paused draw progress after changing language.
- Settings checks cover checked radio state, English/Czech UI updates, genuinely inactive future rows and localized save error/retry.

Final checks after the review fix:

- Affected Jest: **9 suites / 68 tests passed**.
- Locale Node tests: **9 passed**.
- TypeScript and scoped ESLint: passed.
- Deck/translation validation: both decks, 13 PNG assets and **35 interface translations per locale** passed.
- Final Android Metro export: passed at `/tmp/cards-settings-final-export` (Hermes bundle, not APK/device evidence).
- Diff, updated Markdown links and whitespace checks: passed.

Unchanged draw/domain/randomness and tooling-security suites were not repeated. User-owned gitignore/expo-env/audit files and earlier card/detail/animation work were preserved. No commit, push or publication.

## Phone review

Restart Metro using `npm start -- --clear`, reload, and open Settings. Check English initially, switch to Čeština and back, inspect card names/meaning/description and results, and confirm tab changes do not reset drawing. Choose a language, fully close/relaunch the app and verify it restores while the draw session itself starts fresh. Check Settings/Back, three-tab dock readability and touches at narrow widths/large text, TalkBack radio labels/checked state, and future rows staying noninteractive. Native persistence and physical visual/accessibility acceptance remain pending until that phone check.
