# Theme text sizing and card-title clipping

## Diagnosis

The user accepted Settings polish for now, then reported detail names clipped
slightly at the bottom in some themes. They also requested the same visible type
size across themes while retaining different fonts.

The resource previously used 32/32/38dp card titles and 38/40/46dp line heights
for EB Garamond/Noto Serif/Literata. Reading the actual offline TTFs and the
installed React Native Android `CustomLineHeightSpan.kt` identified a concrete
failure mechanism: explicit line height smaller than ascent plus descent creates
negative leading and reduces the paragraph's first/last-line bounds.

Offline FreeType/Pillow measurements at a common 1000px font size, scaled back to
the old resource sizes, illustrate this for `gjpqy`:

| Font | Natural line height | Available descent after leading | Glyph descent |
| --- | ---: | ---: | ---: |
| EB Garamond | 41.76dp | 7.66dp | 9.28dp |
| Noto Serif | 43.58dp | 7.58dp | 7.68dp |
| Literata | 56.43dp | 6.49dp | 8.74dp |

This supports the clipping mechanism; the exact native phone pixels still need
confirmation. Growing the outer header alone would not repair the text's own
line box.

## Correction

Keep the accepted Mystic Arbor visible-size hierarchy. For headings, match
cap-height; for body, label and caption, match x-height using OS/2 font metrics
and units-per-em. Different font sizes are necessary to produce equal letter
heights in different typefaces. All resource data remains independently authored;
the renderer/provider APIs and registered fonts are unchanged.

Common role line heights are title 40dp, card title 48dp, section heading 34dp,
body 26dp, label 22dp and caption 24dp. Each exceeds the conservative shipped-font
ascent/descent bound, including Win ascent/descent. Fractional nominal sizes are
rounded to 0.01dp. The cap-height/x-height spread for each role is below 0.02dp.

The line-height fix applies through the existing typography role to Catalogue,
results, direct links, inline drawn-card reading and standalone detail text.
Their header measurement remains authoritative, with no fixed clipping height,
number-of-lines limit, image remount or animation-timing change.

## Verification

- Font-inspection regression observed RED for missing metric data, then GREEN.
- Shipped-resource sizing regression observed RED for unsafe old line bounds,
  then GREEN after resource adjustment; checks cover every theme/text role.
- 116 domain tests passed, including the new metrics and consistency checks.
- TypeScript, full lint and offline font/theme validation passed.
- Initial full Jest run: 32 suites passed; three assertions in two suites
  referenced the intentionally replaced sizes. After updating only those
  expected values, the two affected suites passed all 26 tests. Together these
  runs cover all 34 suites / 271 tests against the unchanged implementation.
- A side-by-side preview of the actual bundled fonts was rendered and inspected
  locally at `/tmp/cards-font-size-preview.png`. It is a font sample, not a
  screenshot of the native application.
- Independent scoped review approved the fix and independently ran the two font
  Node suites. It found one stale unsafe line-height example in the authoring
  document; that example now matches the corrected 20.4dp / 34dp Literata role.
  No runtime blockers remain in the review. The new inspector's OS/2 v2+ sizing
  metadata requirement for additional font assets is documented.

## Remaining phone review

Check descenders (`g`, `j`, `p`, `q`, `y`) and Czech accents, one-line and wrapped
names, all three themes and larger system text in Catalogue/results/direct
details and drawn-card reading. Confirm scroll/header clearance and that font
switching retains session/image identity. Different glyph shapes/widths remain;
cap-height/x-height matching does not establish pixel-identical perception.

The user's independent font-size preference is saved for the next iteration;
it is not implemented here. System-font recovery still uses platform fonts
with their own metrics rather than the bundled-font optical calibration.
