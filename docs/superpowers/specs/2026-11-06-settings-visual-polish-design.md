# Settings visual polish

## Intent and scope

Improve the Settings layout the user previously rejected, drawing on the saved
[Stitch Settings reference](../../design-references/stitch-themes/settings.html).
The user chose compact grouped language/reveal controls and larger theme cards
with palette previews on 2026-11-06. This is a small presentation change to the
existing Expo/React Native Settings screen, with no new settings or dependencies.

## Approaches

- **Chosen:** compact grouped controls for language and card reveal; larger theme
  cards make each available palette visible before selecting it. This follows
  the reference's hierarchy while keeping frequently used controls short.
- **Alternative:** one compact list for all settings. Simpler and denser, but
  does less to distinguish themes or communicate their appearance.

## Proposed layout

Retain the three section headings, ordered Language, Card reveal, Theme, without
a repeated page title. Use consistent screen gutters, clear section spacing and
the active theme's existing typography. Language and reveal each use a shared
rounded surface containing two adjacent choices, with a clear selected fill and
text contrast. Use flexible labels and minimum 48dp touch targets. Allow choices
to wrap into full-width rows at narrow widths or large system text sizes; do not
truncate or cap font scaling.

Theme options form a vertical stack of rounded cards. Each card contains the
localized theme name, a visible selection indicator, and a decorative strip of
four swatches derived from that option's canvas, primary, accent and mat colors.
Use the active theme's fonts and colors for card labels and selected states; the
preview strip alone uses the candidate palette. Selection must be identifiable
without relying only on color. Names wrap, and cards grow with their contents.
Keep previews lightweight native Views, with no images, extra font loading or
theme-ID-specific branches. Render all themes from the supplied resource,
including custom resources; no hardcoded palette names or invented descriptions.

Keep each preference's localized save error and retry next to its own control
group. Preserve radio-group/radio semantics, checked states and existing labels;
hide decorative swatches and selection artwork from accessibility focus.
Preserve full-height scrolling and measured dock-height end padding so the final
theme and any retry remain reachable above the floating menu.

## Constraints and builder decisions

Preserve preference persistence, immediate theme/language changes, provider and
session identity, all card artwork, and animation behavior. Existing bilingual
content stays complete. No hero title, extra navigation, decorative reference
settings, automatic dark-mode behavior or new preference is included.

Exact spacing, corner radii and responsive breakpoint are implementation choices
to fit the existing tokens and screen. Prefer a small local presentation helper
over introducing a shared design-system abstraction for this single screen.

## Verification and acceptance

Reuse behavioral Settings tests for selection, independent retries, localized
labels, custom resource themes and theme changes without remounting. Add focused
coverage for resource-derived previews and responsive control layout where
layout logic is introduced. Run affected Settings/navigation suites, TypeScript,
scoped lint, deck/translation validation if strings change, and diff checks.
No full-suite rerun is required for a Settings-only presentation change unless
integration failures or expanded scope justify it.

Inspect a representative visual preview where available. Final visual acceptance
requires phone review in all three themes, English/Czech, larger system text,
scrolling past the floating dock and visible save errors. Mocked tests do not
establish native appearance or touch/scroll acceptance.

Status: approved by the user's “Go implementing” on 2026-11-06 and implemented
in the working tree. Targeted checks passed; phone visual/accessibility
acceptance remains pending. See [execution and verification](../plans/2026-11-06-settings-visual-polish.md).
