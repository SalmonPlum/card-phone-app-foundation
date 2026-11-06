# Settings and explicit app language

Status: implemented in the working tree on 2026-10-28; targeted checks passed, phone review pending. Primary scope is in-app language choice; automatic reveal and color palette are placeholders for later.

## Confirmed behavior

- Add an accessible Settings destination with working English / Čeština choices.
- English is the default on a fresh install, regardless of OS/device locale. An explicit saved app choice takes precedence on later launches.
- Switching language updates interface labels and all localized deck/card content across Draw, Catalogue, results and direct details immediately. It must not reset a draw session, reorder cards or recreate tabs.
- Automatic reveal and Color palette appear as clearly noninteractive “Coming later” rows, not active switches. The reveal-mode roadmap and future deck-detail templates remain separate future requirements.

## Implementation choices

- Use a third bottom-navigation destination, Settings / Nastavení. The existing measured dock and modal lock include it; native layout still reserves its actual safe-area/font-scaled height. System Back from Settings follows the navigator's existing return-to-Draw behavior.
- A root language provider owns the app choice independently of in-memory draw/session state. Existing useLocale consumers read it instead of OS locales.
- Store only the locale code in app-private storage using the already bundled Expo FileSystem 58.0.11 module. The initial AsyncStorage approach was replaced after registry failure and discovery of the existing cached/native FileSystem dependency. Do not persist sessions/history. No backend, account or network content.
- English is available immediately; load a saved supported choice asynchronously. An explicit selection wins over a late startup read. Serialize writes so rapid choices persist the most recent selection; stale success/failure cannot replace current save status.
- If persistence fails, keep the user's chosen language working for this session and show a localized retryable saving error in Settings. Invalid saved values fall back to English. Prefer lazy loading the native storage adapter so older dev clients can still run the screen and report a saving failure until rebuilt.
- Declare the existing FileSystem package directly using its exact cached official registry tarball/version; this hoists the same version/integrity already nested under Expo, without adding a new native version. Record lockfile changes and native rebuild instructions; do not silently remediate unrelated dependency findings.

## Validation

Target provider behavior (English default even on Czech OS, restored choice, read/selection race, ordered writes, save error/retry), real-router Settings changes across tabs/details/results with unchanged session, localized placeholders, Back/modal lock, narrow/large-text dock and existing details/scroll lifecycle. Run affected tests, locale/deck dictionary validation, TypeScript/scoped lint and Android bundling; native preference persistence and visual acceptance require phone verification. The existing Android module list already contains this same FileSystem module/version, so a Metro restart/reload is expected to suffice; an older/different client without it would need a rebuild. Record actual checks in Markdown.

See [the verification report](../../2026-10-28-settings-language-validation.md) for actual checks, dependency resolution and the reviewed native-write correction.


Follow-up 2026-10-28: the reveal placeholder has now been replaced with implemented Automatic / Tap to flip choices. Palette remains a placeholder. Reveal preferences use their own private file, leaving language storage unchanged. See [reveal-mode design](2026-10-28-reveal-mode-design.md). Earlier placeholder requirements above describe this document’s original language-only scope.
