# Theme resource authoring

Themes are described separately from application screens in
`src/themes/resource.json`, like card resources. The app validates and loads this
resource and offers its themes in Settings. Selecting a theme updates interface
colors and saves only its ID in a separate app-private preference file.
Typography roles now control rendered fonts and metrics as well as colors. Font
files and licenses are bundled offline. The shuffle frame now has optional
resource-controlled fabric. Themed card backs and Settings layout polish remain
separate saved work.

## Resource structure

The resource declares `schemaVersion: 1`, `defaultThemeId` and a nonempty
`themes` array. Every theme in the supplied resource will be available to the app;
there is no second inclusion list to maintain in application configuration.
The resource and referenced assets will be bundled offline, rather than imported
or downloaded by users.

Each theme declares:

- `id`: a stable unique identifier matching `^[a-z][a-z0-9_-]*$`.
- `version`: a nonblank version string; update it when publishing changes.
- `name`: nonblank display names in both `cs` and `en`.
- `appearance`: `light` or `dark`, for native system-bar text presentation.
- `colors`: every semantic interface color listed below.
- `cardColors`: `background` and `accent` for future opt-in artwork.
- `typography`: every text role listed below.
- Optional `shuffleSurface`: a registered texture key and intensity, described below.

`defaultThemeId` must match a declared theme ID. The initial resource keeps
`mystic-arbor` as the default, preserving the current forest/ivory baseline.
Celestial Midnight and Solstice Ochre are additional definitions taken from the
provided Stitch design systems. The Czech theme labels are initial translations
and can be edited in this resource.

## Color roles

All colors use opaque six-digit `#RRGGBB` notation.

| Role | Intended use |
| --- | --- |
| `canvas` | Screen and reader background |
| `surface` | Reading panels and secondary surfaces |
| `text` | Primary text on canvas/surfaces |
| `mutedText` | Secondary text on canvas/surfaces |
| `primary` | Primary controls and emphasis |
| `onPrimary` | Text/icons on primary controls |
| `accent` | Accent text and details |
| `border` | Surface boundaries |
| `selectedSurface` | Selected-choice background |
| `onSelected` | Text and radio indicator on selected-choice backgrounds |
| `mat` | Shuffle-area background |
| `onMat` | Text/icons on the shuffle area |
| `shadow` | Shadow color, independent of foreground text/controls |

The supplied themes have automated contrast checks for body/secondary text,
accent/primary text, primary buttons, selected controls and mat instructions
(at least 4.5:1 for those text pairs). `onSelected` is especially important for
Celestial Midnight's pale selected background. New resources must review their
own foreground/background pairs; structural validation alone does not establish
visual accessibility. Physical-device appearance and focus/large-text behavior
still require review. Shared spacing/radii/shadow geometry remain in
`src/ui/theme.ts`; memoized style factories consume resource colors and resolved
typography together.

`cardColors` is independent of interface colors. These values will only affect
artwork that explicitly declares theme-aware regions. A fixed face/back must
retain all its authored colors. The first artwork stage will support optional
themed backs and fixed faces; theme-aware faces are a saved follow-up.

## Typography roles

The required roles are `title`, `cardTitle`, `sectionHeading`, `body`, `label`
and `caption`. Each contains:

```json
{
  "fontFamily": "Literata",
  "fontWeight": "500",
  "fontSize": 20,
  "lineHeight": 28,
  "letterSpacing": 0
}
```

Weights are strings from `"100"` through `"900"` in increments of 100.
Sizes must be finite and positive; line height must be finite and at least the
font size. Letter spacing is a finite number in layout units, not CSS `em`.
Values derived from Stitch's `em` tracking are converted to size × tracking.
System font scaling remains enabled when rendering.

Every referenced family/weight needs a registered static face. Declaring a family
name alone does not install it. The renderer uses a registered alias with normal
native weight because the requested weight is already encoded in the file.
No runtime Google Fonts requests occur. New fonts must support Czech and English.

The initial themes use these reference families:

| Theme | Titles/section headings | Body | Labels |
| --- | --- | --- | --- |
| Mystic Arbor | EB Garamond | DM Sans | DM Sans |
| Celestial Midnight | Noto Serif | Manrope | Space Grotesk |
| Solstice Ochre | Literata | Plus Jakarta Sans | Plus Jakarta Sans |

The initial resource maps large card names, smaller serif section headings and
body text into distinct roles. Sizes are implemented reference values awaiting
phone review, not final visual approval. Tile names and Settings section titles
use the section-heading role; controls/dock use labels.

## Shuffle surface resources

An optional surface entry adds fabric while preserving the theme's `colors.mat`:

```json
"shuffleSurface": { "texture": "checked-cloth", "opacity": 0.26 }
```

Omit it or use opacity 0 for a plain mat. The validator requires a registered
texture key and finite intensity between 0 and 1. Current intensities are 0.26
(Mystic Arbor), 0.22 (Midnight) and 0.24 (Ochre). They are implementation choices
awaiting phone appearance review. The neutral translucent tile adds highlights/
shadows; it does not recolor card artwork or handle input. The supplied themes
use `checked-cloth` for 80dp gingham checks; `woven-linen` remains available for
a subtler weave. Both are original procedural assets from the same generator.

The pure `shuffleTextureCatalog.ts` describes local assets, and
`shuffleTextureAssets.ts` maps keys to literal native image requires. Require
the base filename (for example `checked-cloth.png`) without a density suffix: Metro chooses its 128px base or 256px
@2x variant for the same logical tile (320dp checked cloth, 128dp woven linen). Regenerate with
`python3 scripts/generate-shuffle-fabric.py` (stdlib only). See
`assets/textures/README.md` for the original asset's provenance.

Domain checks verify PNG size/alpha and conservative on-mat hint contrast over
the actual relief RGBA samples of the selected texture. A native repeat Image is mounted behind the cards,
clipped by the existing frame, with no layout or per-frame JavaScript changes.
Phone checks still need to inspect repeat seams, moiré, hint readability and frame
performance. New texture keys require asset registration, as with deck artwork;
no theme-specific screen branches or inclusion list are needed.

## Adding font assets

1. Add licensed static upright TTFs under `assets/fonts/<family>/`, retaining
   their SIL Open Font license in that directory's `OFL.txt`.
2. Add metadata in `src/themes/fontCatalog.json`: `family`, string `weight`, unique
   `alias`, local `path`, `licensePath`, `sha256` and pinned `sourceUrl`. The catalog
   records the official Expo Google Fonts source commit for the initial files.
3. Add alias → literal `require('../../assets/fonts/...ttf')` entries in
   `src/themes/fontAssets.ts`. Metro requires explicit paths, as for card artwork.
4. Reference the family/weight in resource text roles. Metrics for registered
   faces require resource edits only; new faces also need asset registration,
   without editing application screens or maintaining a theme-inclusion list.
5. Run `npm run validate:themes`, typecheck and affected rendering tests.

The validator checks matching static registration, SHA-256, weight, license and
real Unicode character maps. Initial faces cover the complete Czech alphabet and
characters in shipped content. Keep source attribution/licenses with replacements.

Fonts preload before the session tree mounts. One 15-second startup deadline
covers fonts and saved-theme restoration. Failure offers Retry or Continue with
system fonts. Continuing uses system families for that app run and rejects late
font/preference completions without changing the saved choice. Restart to retry
custom fonts after continuing. Themes switch between already-loaded faces without
resetting sessions or artwork surfaces.

## Validation

`validateThemeResource(input: unknown)` in `src/themes/validateThemeResource.ts`
checks the resource without React Native or side effects. It returns the original
valid resource without mutation, or throws an error containing a field path.
Theme IDs and font families are not hardcoded in the validator. Extra metadata
is currently left untouched; only declared contract fields have defined meaning.

From `mobile/`:

```sh
node --experimental-strip-types --test --experimental-test-isolation=none src/themes/__tests__/themeResource.node.test.ts
npm run test:domain
npm run validate:themes
npm run typecheck
```

Tests validate the shipped JSON as well as independently authored fixtures and
malformed input. Provider, storage, Settings and router tests also cover saved
selection, stale/unknown IDs, delayed reads/writes, localized save retry and
retaining card/session/animation identity when changing themes. Unknown or absent
saved IDs and failed reads use the resource default. A failed write keeps the
chosen colors active and offers retry; language and reveal-mode preferences are
independent. No automatic device-theme following or runtime theme imports occur.

The fixed card faces, backs and physical stack edges retain their original colors;
only surrounding UI and the error placeholder follow the selected theme.
