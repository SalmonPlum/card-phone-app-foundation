# App customization and foundation guide validation — 2026-11-23

## Implemented

- Strict bundled presentation JSON: optional complete en/cs interface text overrides,
  named bundled icons per stable menu route, explicit bilingual Info-label override.
- Existing translation, interpolation, menu routing/visibility, tint and motion paths
  retained; author overrides do not change actions, IDs or Info title/body.
- `validate:app` / `test:app`; npm launch and Android build pre-hooks validate before
  existing Info generation. Runtime import also validates the JSON.
- Foundation workflow/agent brief and presentation schema/key reference, linked from
  READMEs and deck/Info guides. Audio remains backlog only.

## Automated evidence

- RED: resource test could not import the missing feature; integration tests then
  failed for the missing translated overrides/menu label (three failures; absent
  Info safety test already passed).
- GREEN: 30 targeted Node tests (21 validator cases plus nine locale cases).
  Command: `node --experimental-strip-types --test --experimental-test-isolation=none
  src/config/__tests__/presentationResource.node.test.ts src/i18n/__tests__/locale.node.test.ts`.
- GREEN: 21 Jest cases across `src/config/__tests__/presentation.test.ts`,
  `src/navigation/__tests__/infoNavigation.test.tsx` and
  `src/navigation/__tests__/BottomDock.test.tsx` using `npm test -- --runInBand`.
  Includes bilingual interpolation/default fallback, renamed Stop preserving session
  identity, configured icons with stable routing, Info label precedence/body and
  omitted-page safety, plus existing dock scroll/interaction tests.
- `npm run validate:app`: real bundled author JSON passes.
- `npm run prestart`: presentation validation and existing Info generation chain
  passed. Presentation JSON examples in the author guide validate; guide/README
  relative links resolve. `git diff --check` passed.
- `npm run typecheck` and scoped ESLint on changed config/i18n/navigation/test/script
  files and Jest setup passed without warnings.
- No full application/domain suite, Metro export, native build or unrelated
  security/deck/theme validation was run. Documentation changes need review only.

## Pending phone checks

Author default JSON intentionally keeps the UI unchanged. Before shipping a custom
app, inspect its actual overrides/icons in both languages, themes and large text;
confirm long-label scrolling, renamed Stop/New session, accessibility and Info
labels/content. Tests use fixed author-independent fixtures and do not establish
final-app visual acceptance or notification delivery. Presentation needs a Metro
reload, not a native rebuild; app identity/native configuration changes do.

Work remains uncommitted. Local Expo-generated files and raw audit export are not
part of this feature.

## Focused review

Independent static review found no implementation blocker. Corrected one documentation
issue: rebuilding an existing native project does not reapply app.config identity.
The foundation guide now explains prebuild/regeneration, inspection of generated
identity and preservation of ignored native customizations/local SDK/JDK settings.
Verified against the installed Expo CLI ensureNativeProject implementation. No
application changes or additional test run were needed for this documentation fix.
