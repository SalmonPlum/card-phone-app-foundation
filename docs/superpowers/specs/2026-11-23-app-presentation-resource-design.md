# Per-app text and menu icon configuration

## Intent

Each app built on this foundation can customize interface wording and menu icons
through an author-owned bundled resource without editing shared screen code or
adding end-user Settings. The user specifically requests menu names/icons and
labels such as Stop. They chose to retain the existing bundled icon set.

## Approaches

Recommended: one separate app presentation JSON resource, analogous to the existing
theme resources, with optional overrides and foundation defaults. Direct edits to
the base translation dictionaries and dock rendering are already possible but mix
app-specific branding into shared foundation code. Arbitrary custom icon artwork
was discussed; the user selected the existing bundled native icon drawings.

## Proposed resource and behavior

- Add `mobile/resources/app/presentation.json` as the single author entry point.
  Keep existing deck selection and theme/Markdown resources separate.
- Optional `texts` maps existing interface translation keys to complete `en`/`cs`
  overrides. Omitting a key retains its foundation translation. Example:

  ```json
  {
    "schemaVersion": 1,
    "texts": {
      "drawTab": {"en": "Reading", "cs": "Vykládání"},
      "stop": {"en": "Finish reading", "cs": "Dokončit vykládání"}
    },
    "menuIcons": {"index": "cards", "catalogue": "grid"}
  }
  ```

- Text overrides can target any existing interface translation key, not only
  today's examples. Use the current translation function so visible and spoken
  wording, including notification copy that already uses it, resolve consistently.
  Do not override deck/card content or theme names through this interface.
- Optional `menuIcons` maps stable route names (`index`, `catalogue`, `history`,
  `info`, `settings`) to names in the existing bundled set: `cards`, `grid`,
  `clock`, `info`, `settings`. Missing entries keep today's route-specific icon.
  Reuse current drawings/tints and dimensions; no external icons, downloads or
  custom images. Detail X/back/trash controls keep their existing semantics and
  are outside the menu icon mapping.
- Menu label overrides use existing `drawTab`, `catalogueTab`, `historyTab` and
  `settings` text keys. Info retains the Markdown `menuLabel` by default; add
  an optional bilingual `infoMenuLabel` field for an explicit per-app override.
  Do not change the Markdown page title/body when overriding its menu label.
- Blank/unknown keys, unsupported icons/schema versions, missing locale values
  and invalid placeholders fail author validation with useful field context.
  Overrides must retain exactly the base key's placeholder names. Default
  resources contain no overrides and preserve current app presentation.
- Localization, theme colors and font/accessibility scaling still apply. Keep
  stable route/action IDs: changing Stop's wording does not alter session.stop
  or its enabled states; renaming Draw does not change its URL/navigation.
- No menu reordering, destination hiding, feature switches, runtime editing or
  remote resource loading. Preserve artwork, active sessions and accepted dock
  scrolling. Configuration changes are source/build-time author changes.

## Verification and author workflow

Provide concise author instructions and supported text/icon names. Import the
bundled JSON through one validated resolver; no new dependency or generated icon
asset is needed. Validation should check the resource before author launch/build.
Test default fallback, English/Czech overrides, placeholder substitution and
rejection, invalid configuration, Info label precedence, named menu icons and a
renamed Stop invoking the same guarded action. Keep generic behavior fixtures
independent of the editable author resource, as with Info. Run only changed
configuration/translation/menu/action checks, types and scoped lint; no automatic
full-suite run or unrelated export/domain/security checks.

## Status

The user resumed and authorized customization implementation after pushing commit
754ec2e, and requested comprehensive foundation documentation for AI agents building
final apps. Implement the resource design above, plus a developer/agent onboarding
guide that links existing deck, artwork, theme and Markdown contracts. Audio stays
backlogged. Work in the existing checkout; preserve local Expo edits and raw audit
export. No commit or push requested for this next change.
