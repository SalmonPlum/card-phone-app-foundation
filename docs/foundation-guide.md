# Build a custom card app from this foundation

This is the starting point for developers and AI agents creating a separately
branded app. The foundation is an Expo/React Native TypeScript app with one bundled
deck, English/Czech content, secure draws without replacement, Catalogue, optional
History and one optional Markdown information page. App authors customize source
resources; users do not edit branding or import decks through Settings.

All paths below are relative to this Git repository (`development/` in the parent
workspace). Run application commands from `mobile/`. Read repository `AGENTS.md`
instructions, when supplied, and [current status](current-status.md) before work.
This guide describes supported contracts; current-status records implementation
history and unfinished device checks. Newer explicit user decisions take precedence
when those notes conflict.

## First handoff: collect the app brief

Before replacing sample resources, obtain:

- App display name, slug, URL scheme, Android package and iOS bundle identifier.
- Deck ID/version, ordered card IDs, card names and every detail section in both
  English and Czech. Agree the section headings/order once for the deck.
- Faces/back, any localized or theme-colored variants, app icon/splash requirements,
  and source/license/attribution information for supplied assets and fonts.
- Theme palette/typography choices and which bundled theme should be the default.
- Menu/action wording, preferred bundled menu icons and Info page text/links in
  both languages, or an explicit choice to omit the page.

Record these decisions in a short app-specific brief before editing. Missing
content should be marked as pending, not silently invented for publication.
A separate final app should use its own repository/remote and app identifiers;
confirm its destination with the owner before changing remotes or publishing.

## Resource map

| What to customize | Entry point | Contract/details |
| --- | --- | --- |
| Application identity | `mobile/app.config.ts` | Display name, slug, scheme, version, Android package, iOS bundle ID; native rebuild |
| Package metadata | `mobile/package.json` | Change app package name/version if appropriate; preserve dependency pins/scripts |
| Selected deck | `mobile/src/config/appConfig.ts` | `deckId` must be a registered `bundledDecks` key |
| Deck content and sections | `mobile/src/decks/<name>.ts`, `src/decks/index.ts` | [Deck authoring](../mobile/docs/deck-authoring.md); schema 2, 1–100 cards, numeric stable IDs |
| Card images and masks | `mobile/assets/decks/`, `src/decks/assetCatalog.ts`, `src/decks/assets.ts` | [Artwork](../mobile/docs/card-artwork.md); static asset registrations, original proportions |
| Interface wording/menu icons | `mobile/resources/app/presentation.json` | [Presentation reference](../mobile/docs/app-presentation.md); optional complete en/cs overrides |
| Info tab label and body | `mobile/resources/info/` | [Markdown authoring](../mobile/docs/info-page.md); generate bundled output |
| Themes and default theme | `mobile/src/themes/resource.json` | [Theme authoring](../mobile/docs/theme-authoring.md); colors, typography, shuffle surface |
| Bundled fonts/textures | `mobile/src/themes/fontCatalog.json`, `fontAssets.ts`, `shuffleTextureCatalog.ts`, `shuffleTextureAssets.ts` | Use registered assets and retain their licenses; see theme guide |
| App icon/splash assets | `mobile/app.config.ts` and author-supplied assets | Configure explicitly; card artwork is not an app icon automatically |

The resource entry points are intentionally separate. Renaming a tab does not
rename a route; replacing a deck does not require editing session or motion code.
Theme/card names and card text are content, not interface translation overrides.

## Implementation sequence

1. **Establish the checkout.** Inspect `git status`, identify existing user changes,
   and read the brief/current status. Use a separate final-app checkout when
   appropriate; avoid overwriting the working foundation. Install the locked
   dependencies with `npm ci` when setting up a fresh checkout. See the Node engine
   range and scripts in `mobile/package.json`.
2. **Set identity.** Replace the temporary identity in `app.config.ts`. Make package,
   scheme and bundle IDs specific to the final app. Configure supplied launcher/
   splash assets if required. Do not rename Router files merely to change labels.
   Apply the native regeneration procedure below after identity or native
   configuration changes, then rebuild/install.
3. **Add the deck.** Follow the deck/artwork guides, register the manifest and
   literal local asset requires, then select it through `appConfig.deckId`. Keep
   card IDs stable and bump the deck version for published content updates. Check
   both languages, all declared sections, all assets and aspect ratios.
4. **Apply presentation.** Edit `resources/app/presentation.json` for menu names,
   action labels (including Stop), accessibility text and named bundled menu icons.
   Omitted overrides retain foundation defaults. Do not edit the shared en/cs
   dictionaries for ordinary branding.
5. **Apply themes.** Edit the theme resource and choose its default. Follow font,
   texture and contrast rules. Fixed card images retain their colors; only declared
   masks use theme colors. Existing saved theme/language choices may override a
   new install default when reviewing an already installed app.
6. **Write or omit Info.** Edit both Markdown files and run `npm run generate:info`.
   `page.json: null` omits the one page. Markdown `menuLabel` is the default;
   explicit `infoMenuLabel` in presentation overrides only the tab label.
7. **Validate affected resources/integrations.** Use the matrix below. Review the
   diff and document exact commands/results, outstanding content and phone checks.
   Keep generic test fixtures independent of final-app wording; add a dedicated
   configured-app smoke check when its branding is important.
8. **Review on the phone.** Regenerate/build if native identity/modules/config changed;
   otherwise reload Metro. Check the checklist below, then present the final diff
   and requested commit/release artifact. Commit/push/publish only within the
   owner's authorized scope. No store or signing setup is supplied by resource edits.

## Verification by changed area

Use targeted checks during development. Do not run every suite after each resource
edit; broaden for a concrete integration risk, a failure or an explicit release
verification request. Run commands below from `mobile/`.

| Changed area | Checks |
| --- | --- |
| Presentation resource | `npm run validate:app`, `npm run test:app` |
| Translation/menu integration | `npm test -- --runInBand src/config/__tests__/presentation.test.ts src/navigation/__tests__/infoNavigation.test.tsx src/navigation/__tests__/BottomDock.test.tsx` |
| Info Markdown | `npm run generate:info`, `npm run validate:info`, `npm run test:info`; affected Info component/navigation tests if behavior changes |
| Deck/assets | `npm run validate:decks`; affected deck/domain tests; Catalogue/draw checks when registration/content structure changes |
| Themes/fonts | `npm run validate:themes`; affected theme/typography/artwork tests and visual/contrast review |
| TypeScript changes | `npm run typecheck`, then scoped `npx eslint <changed files>` |
| Any proposed commit | `git diff --check` (and `git diff --cached --check` if staged) |
| Native identity/config/modules | Follow native regeneration below, then `npm run android`; use `npm run android:release` for the release variant when requested |

`npm start`, `npm run android` and `npm run android:release` validate presentation
and generate Info through their npm pre-hooks. Direct `npx expo` commands bypass
those npm hooks; run validation/generation yourself first. Presentation JSON is
also validated when loaded. Keep generated `src/info/generated.json` in sync and
include it with Markdown changes. No new runtime network service is required.

Generic Jest tests mock the editable presentation/Info resources to fixed fixtures.
The pure presentation validator and `validate:app` check the actual author contract;
passing a baseline UI test alone does not validate final-app copy or its appearance.
Automated animation tests and Metro exports do not establish phone performance.

## Native regeneration after identity/config changes

`npm run android` builds an existing `android/` project; it does not automatically
reapply `app.config.ts` when that directory already exists. Those ignored native
folders may still contain the foundation's package, scheme and launcher name.

On an existing final-app checkout, inspect/preserve native customizations first,
including ignored `android/local.properties` SDK paths and any local Gradle/JDK
settings. Run `npm run validate:app` and `npm run generate:info`, then
`npx expo prebuild --platform android --no-install` to apply native configuration.
Inspect the resulting package/application ID, scheme, app label and generated
assets, restore required local SDK/JDK configuration, then run `npm run android`.
For iOS work, use the corresponding `--platform ios` prebuild on the intended host
before building that target; this guide does not establish iOS acceptance.

Do not use `prebuild --clean` as a routine step: it deletes/recreates native folders
and can discard untracked manual changes. If a clean regeneration is needed, first
back up/review those files with the owner. Neither ignored native files nor local
SDK/JDK paths belong in the branding commit. A fresh checkout without native folders
will generate them as part of the native run command; still inspect the final
identity before distributing the app.

## Phone acceptance checklist

- Both languages: menu/action labels, accessibility labels, all card names/details,
  Info links and any renamed notification copy. No untranslated/placeholder content.
- Small viewport and large text: swipeable single-line menu, reachable selected tab,
  compact drawing actions, full readable detail text and scroll-end clearance.
- Draw/Stop/New session and complete deck exhaustion; switching tabs and returning
  must preserve the current session. Automatic/manual reveal and reduced motion.
- Card detail open/close via button/artwork, inline reading and Android Back.
- History on/off, next-session recording, long-press selection, final deselection
  cancellation, top floating toolbar, confirmed deletion and restored saved text.
- Theme/font changes, fixed versus theme-colored artwork, app restarts and offline
  use. Check contrast and screen-reader focus on the actual device.
- If reminders are included: permission denial/grant, chosen time, closed-app
  delivery, tap routing and cancellation. Do not treat mocked scheduling as delivery.

Preserve installed user data during review unless the owner authorizes clearing it.
A new native app identifier produces a separate install/data sandbox; changing IDs
in source does not migrate existing settings/history automatically.

## Foundation contracts agents must preserve

- One selected bundled deck; complete English/Czech content; numeric card IDs are
  identities, never array indices. Current supported size is 1–100 cards.
- OS-backed Expo Crypto randomness, uniform draws without replacement and guarded
  retry. No timestamp seeds, `Math.random()` fallback or presentation-dependent logic.
- Approved shuffle/reveal timing, persistent native artwork surfaces, original
  artwork proportions and session identity across tabs/background transitions.
- Stable routes: `index`, `catalogue`, `history`, `info`, `settings`; menu branding
  changes only visible/spoken presentation. History/Info availability keeps its
  existing rules. Stable storage and notification identities require explicit
  migration work before changing them in an already released app.
- Offline bundled assets with static requires. No credentials/signing files in Git;
  keep local SDK/JDK/generated Expo files and raw audit exports separate from feature
  commits. Review existing [security follow-up](../mobile/docs/security/follow-up.md)
  before dependency work; avoid blanket upgrades or `npm audit fix --force`.

## Copyable AI-agent brief

Fill in the bracketed fields and hand this to the implementing agent:

```text
Create a final custom app from this foundation in [destination checkout].
Read the repository instructions, docs/foundation-guide.md and docs/current-status.md.
Use this app brief: [path to approved identity, bilingual content and asset brief].

Implement identity in mobile/app.config.ts, the selected registered deck through
src/config/appConfig.ts, interface wording/menu icons through
resources/app/presentation.json, themes through src/themes/resource.json, and the
single Info page through resources/info/. Follow each linked authoring contract.

Preserve secure randomness, stable card/route IDs, approved motion, artwork
proportions and session persistence. Do not edit shared screen/session logic for
branding that resources already support. Do not invent missing publication content.
Report any required capability that the foundation does not yet expose.

Keep user changes intact. Run targeted resource checks and affected integrations;
do not run every suite after small edits. Report commands, results, changed files,
license/attribution notes and pending phone checks. Keep audio, larger-deck support
and other deferred work out of scope unless this brief explicitly requests them.
[Commit/push/release authorization and boundaries.]
```

## Available versus deferred

Implemented: deck/artwork/theme resources, presentation text/menu-icon overrides,
one Markdown page, bilingual UI, haptics, local daily reminders and optional History.
Android has been used for phone development; configured iOS support is not an iOS
acceptance claim. Native release/accessibility/performance checks still need their
own evidence.

Deferred: interaction sound effects and ambient royalty-free music with replaceable
resources (no audio configuration/player yet); larger decks above 100; the unresolved
text-size slider dragging issue. See current-status for decisions. Arbitrary menu
artwork, menu reordering/hiding, additional Info pages, custom action-button icon
resources and end-user branding editors are not part of the presentation contract.
