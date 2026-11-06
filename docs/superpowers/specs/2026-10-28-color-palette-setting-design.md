# Color palette setting and card artwork

Status: resource foundation, theme selection/UI colors, offline typography and shuffle fabric are implemented in the working tree. The user confirmed functional theme switching on the phone; new fonts/metrics need their own phone review. See [typography validation](../../2026-11-04-theme-typography-validation.md).

The user requested multiple separate steps. Follow [the staged plan](../plans/2026-11-04-theme-resources.md): stop after stage 4 for phone fabric review. Optional theme-aware backs remain a later stage. Fixed artwork is unchanged. Settings visual polish is explicitly saved future work; working theme controls/new fonts do not satisfy that request.

The user wants to change the app's color palette from Settings. Language selection is already implemented separately. Forest/ivory is the existing baseline.

Later planning should establish the actual palette choices, accessible contrast, saved preference behavior and consistent application across Draw, covers, dock, Catalogue, results, details and Settings. Preserve card artwork colors/proportions, persistent image surfaces and animation/session behavior. Do not infer dark mode, system theme following or a custom color editor from this request.

## Agreed phased artwork scope (2026-11-04)

First phase: support fixed card faces with optionally theme-aware backs. A deck using fixed face/back resources must retain its original artwork when the UI palette changes. Theme-aware backs opt in explicitly: only designated regions follow theme colors; fixed illustration colors remain intact. Existing decks must continue to work without converting their artwork.

Later phase: add theme-aware faces as well. The user specifically noted that the current cards would benefit from this; this is an explicit follow-up, not a rejected option. Plan the initial artwork contract so back-only support can be extended to faces without forcing fixed-artwork decks to opt in.

## Approaches discussed

- Fixed artwork with UI-only themes: simplest and preserves authored colors; agreed as a supported deck mode, but insufficient alone for the requested theme-aware backs.
- Authored layers or SVG shapes with named theme color roles and fixed-color artwork: supports selective recoloring. First-phase product scope is agreed; exact rendering/asset implementation is still open.
- Generate complete PNG variants for predefined palettes from those authored sources: recommended implementation candidate for preserving the current complete-image animation surfaces; trades asset count for simpler runtime rendering. This recommendation is not yet a selected implementation decision. Runtime layers/SVG remain an alternative requiring device verification.

Do not recolor flattened multicolor PNGs indiscriminately. Theme-aware artwork needs intentionally separated regions, default colors and offline assets. Preserve native proportions, Czech/English variants and persistent image/session behavior across every surface. UI/font resource loading, fallback and theme-change behavior are implemented; theme-aware artwork authoring/rendering remains a later design step.

## Selected Stitch palettes and fetched references (2026-11-04)

The user selected **Celestial Midnight** and **Solstice Ochre** from the supplied Stitch project `11243207567328593716`. Both design systems and available example HTML screens were fetched through the Stitch connector. Full source tokens, typography and guidelines are saved in [design-systems.json](../../design-references/stitch-themes/design-systems.json). These files are read-only reference snapshots, not runtime dependencies.

| Reference | Celestial Midnight | Solstice Ochre |
| --- | --- | --- |
| Design-system asset | `assets/4ec8122474c1442d86bd7052848b694c` | `assets/b9301badd22844e9bac3b84372e5f105` |
| Canvas token | `#0d1322` | `#fff8f0` |
| Primary token | `#ffc174` | `#7f3015` |
| Primary container | `#f59e0b` | `#9e472a` |
| Secondary token | `#d0bcff` | `#904d00` |
| Text on canvas | `#dde2f8` | `#1e1b14` |
| Heading font | Noto Serif | Literata |
| Body font | Manrope | Plus Jakarta Sans |
| Label font | Space Grotesk | Plus Jakarta Sans |
| Mobile main heading reference | 26px / 34px line height | 28px / 36px line height |
| Large body reference | 18px / 28px line height | 18px / 28px line height |

Local screens: [Midnight Draw](../../design-references/stitch-themes/celestial-draw.html), [Midnight Details](../../design-references/stitch-themes/celestial-details.html), [Midnight Catalogue](../../design-references/stitch-themes/celestial-catalogue.html), [Ochre Draw](../../design-references/stitch-themes/solstice-draw.html), and [Settings](../../design-references/stitch-themes/settings.html). Original forest/ivory is named **Mystic Arbor** in Stitch; its design system is also saved in the JSON snapshot.

Source guidelines contain illustrative brand colors that sometimes differ from the named UI tokens; the table above records actual named tokens, confirmed in the downloaded Draw HTML. Final app role mapping and contrast must be reviewed rather than mixing those sources arbitrarily. Web pixel sizes are reference values, not approved native sizes. The user confirmed that selecting a theme must also switch its fonts so each theme has its own character. Keeping Mystic Arbor as the default alongside the two selected palettes is a proposal, not a newly confirmed choice.

## Theme resources and final apps (2026-11-04)

User requirement: themes include their own fonts and should be resources analogous to card resources, rather than these specific themes being permanently fixed into the main app. Themes must be included and usable in the final built app.

Clarified user requirement: prepare a separate theme resource file describing the themes, authored independently for the app just as card resources are authored independently. The app reads the supplied resource and exposes its themes in Settings. Do not add a separate per-app configuration step to pick which themes to include; the earlier proposal of such a selection step was a misunderstanding and is superseded.

Proposed resource contents for design: stable theme identity/version, localized display name, semantic UI and card color roles, typography roles and local font references, plus optional surface/texture references. The shared app consumes this contract rather than naming particular palettes in screen components. Deck artwork remains a separate resource with explicit theme-aware regions, rather than depending on a particular theme ID. The foundation uses a JSON resource with `defaultThemeId`, initially Mystic Arbor. The app validates it, applies its colors and resolves its typography against the separate local font catalog/registry. Font sources, weights, licenses and checksums are documented in theme authoring.

Celestial Midnight and Solstice Ochre are initial theme definitions in the supplied resource. The resource and its referenced fonts/assets are bundled for offline use, like card resources. Runtime import/download is out of scope. Font sizes, line heights and weights belong to theme typography roles, while shared layouts must accommodate the resource's themes and system text scaling. Creating or changing themes should be resource authoring work rather than editing application screens or a hardcoded theme list.
