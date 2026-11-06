# Stitch forest-green visual adaptation

## Follow-up requested 2026-11-04

The user requests stronger use of this Stitch project for fonts, typography hierarchy and overall visual styling. Typography is the highest visual priority, especially the distinction between card title, section headings and body text. Revisit the initial system-font compromise below when planning this follow-up; EB Garamond and DM Sans are reference candidates, not yet selected implementation dependencies. Fonts must work offline and support Czech/English and system text scaling.

Updated by the later user instruction on 2026-11-04: remove the visible Draw a card instruction and redundant Catalogue/Settings/results page titles, rather than moving the draw instruction above the mat. That removal is implemented; keep its localized accessible draw action. The fabric-like shuffle surface remains pending. Preserve usable animation bounds, accepted movement/timing and persistent artwork surfaces. These are saved requirements awaiting design/implementation and phone review. See [current priorities](../../current-status.md#visual-refinement-priority); historical scope restrictions and deferred-feature notes below describe the original styling pass.

## Authorized reference and scope

The user requests the same application and prepared animations with visual styling closer to their own Stitch screens, and explicitly selected **Forest green and warm ivory**. This is a direct visual adaptation of those supplied designs, not a new product concept or flow. No new screen features are inferred from the mockups.

Stitch project `11243207567328593716`, reference screens:
- Draw: `24a12c0c23704581974cd21b9628d470`.
- Catalogue: `4c7f4cdb6bb44caeace29c6dd85209e3`.
- Details: `823e55c7f556436badf82fd7427b1260`.

Read-only HTML snapshots live in `docs/design-references/stitch-forest/`. They are reference material, never app runtime code. Their remote scripts/fonts are not dependencies of this offline native app.

## Appearance

Warm ivory canvas `#fbf9f3`, forest mat `#1a382b`/`#163024`, deep evergreen headings `#032217`, muted brass `#c5a059` (dark gold text `#775a19`), sage `#d8e2dc`, quiet pale panels `#f0eee8`, body ink `#1b1c19` and secondary ink `#424844`. Use parchment text on dark surfaces with readable contrast, not faint decorative text for required actions.

Use literary serif headings/card names with readable sans-serif body/buttons, restrained gold rules/star accents, rounded card surfaces, generous spacing, green pill primary controls and quiet secondary pills. Group name/meaning/description into softly separated reading panels. Keep the existing original garden face/back artwork: it already has forest/brass frames and botanical medallions. Never crop artwork or change its native aspect ratio.

The Stitch reference uses EB Garamond and DM Sans from Google Fonts. For this first styling pass, use native serif/sans system families with Czech support. Exact bundled fonts can be added separately; do not depend on remote fonts, reach into nested Expo packages or alter the dependency/security baseline for cosmetic parity.

## Application mapping

Restyle Home, draw shell/status/actions, shared tile captions and surfaces, catalogue header, in-screen detail overlay/control/text panels, standalone direct-link details, and temporary results consistently. Use existing controls/navigation only. Do not copy placeholder profile, audio, discovery counts, search, category filters, settings/theme picker, journal/history, affirmations/reflections, flip/share/copy controls or additional content fields from Stitch.

Preserve current screen flow and draw/reveal/confirm rules. Existing Home/Back/Browse/Draw links may receive the pill/dock visual treatment without changing their route semantics. Keep the animation scene's usable bounds large enough; do not reproduce Stitch's fixed 520px mat height, overflowing title layout, or tiny low-contrast text literally on small phones.

## Protected behavior

The overhand path, phase timings, fixed1.25 speed, packet randomness, current-packet draw rule, lift/flip/reveal geometry, coherent frame/atomic clock, persistent image hosts, background rules, source/receiving separation and tap guards must remain unchanged. Catalogue overlay travel, timing, target fit, source handoff, image identity, scrolling, accessibility/focus, Back and lifecycle fixes remain unchanged. The deferred larger draw reveal stays deferred.

Change only presentation styles/layout around these engines. No package/lock changes, new runtime network requests, native modules or native build configuration. Keep cs/en and large-font/narrow-layout behavior. No native phone acceptance is implied by tests or Metro export.

## Approaches

Chosen scope: adapt the existing React Native components to the user-provided forest reference through shared visual tokens and light presentation components, preserving behavior. Replacing the app with Stitch HTML/WebView or recreating static mockup cards/shuffle would lose the prepared native movement and offline foundation. Copying the mockup feature set would expand the user's requested scope.
