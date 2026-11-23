# Markdown information page — validation 2026-11-23

Implemented the [approved design](superpowers/specs/2026-11-23-markdown-info-page-design.md)
and [plan](superpowers/plans/2026-11-23-markdown-info-page.md). The user authorized
direct implementation after reporting the previous checkpoint pushed. No commit
or push requested for this feature; local Expo/audit files are preserved.

## Delivered

One optional About me / O mně destination immediately before Settings. The author
edits `mobile/resources/info/en.md` and `cs.md`; `menuLabel` metadata supplies the
dock label, and the body supplies the content. The sole inclusion configuration
is `page.json`, with two locale filenames or `null` to omit. Direct omitted-page
navigation redirects to Draw. No setting or user editor was added.

The framework-free parser compiles a documented Markdown subset into bundled JSON.
Generation hooks run before normal Metro/Android launches; `generate:info` updates
an already-running Metro instance and `validate:info` rejects stale output. Both
locales and valid filenames/content are required. No network content, new runtime
dependency, native module, filesystem device loading or new secure-random behavior.
See [author instructions](../mobile/docs/info-page.md).

The native reader supports themed/scaled headings, paragraphs, strong/emphasis,
flat lists, inline-text quotes, rules and platform HTTP/HTTPS/email links. Code,
images, HTML, tables and nested lists are unsupported and validated. Link feedback
is a visible status region outside the scroll content, above the measured dock;
request tokens and unmount guards reject stale outcomes. Full accessible tab names
remain available even when long visual labels end in an ellipsis after two lines.
Session/card surfaces and motion timing are unchanged.

## Tests and review

Parser, generation, reader and missing-tab tests observed RED before implementation,
then GREEN. Native router regression verifies four/five-tab order, omission/direct
redirect, language/theme/text-size propagation and return to the same paused draw
with exactly one phase completion. Narrow/large-text fixtures verify measured
clearance and the explicit two-line policy, not native font metrics.

The fresh final reviewer found four P2 issues, all addressed in one fix pass:

- Backslashes before ordinary letters were lost, underscores within italic text
  were misread, and quoted labels/blank content were accepted. Regressions observed
  RED then GREEN; nested link rejection is also covered.
- Link feedback below a long article was not reliably visible. A RED→GREEN
  outside-scroll assertion pins the visible status region and dock clearance.
- Unlimited tab labels could consume the screen. The two-line regression was
  verified RED against the old presentation then GREEN with complete accessible
  names preserved.
- Navigation fixtures depended on the editable authored sample. Behavioral tests
  now use fixed bilingual fixtures; inclusion/omission is explicitly exercised,
  while source/generation validation remains separate.

The initial integrated run caught five old shell/results tab-count assertions;
these now include Info and retain their original session/interaction checks.
No unresolved review findings remain.

## Final checks

- Full Jest: 59 suites / 486 tests passed.
- Domain tests: 174 passed, including 30 parser tests.
- `test:info`: 31 parser/generation tests passed (30 overlap domain coverage).
- Strict TypeScript and full lint passed without warnings.
- Info validation: both source resources match generated output.
- Deck validation: both packs, 50 PNG assets and 99 interface strings per locale.
- Theme/font validation: 3 themes, 11 faces and 110 required Czech/English glyphs.
- Android Metro export: `/tmp/cards-info-final-android-export` passed after review fixes.
- Diff/whitespace checks passed. No security remediation or release build claimed.

Logs: `/tmp/cards-info-final-jest.log`, `cards-info-final-domain.log`,
`cards-info-final-resource-tests.log`, `cards-info-final-types.log`,
`cards-info-final-lint.log`, `cards-info-final-validate.log`,
`cards-info-final-decks.log`, `cards-info-final-themes.log`,
`cards-info-final-export.log` (all in `/tmp/`).

## Phone acceptance still pending

Restart Metro with `npm start -- --clear`, then reload the existing client.
A native rebuild is unnecessary for this feature. Check:

- English/Czech labels and complete content, all themes, standard/large app size
  and larger system text; readable headings, emphasis and quote/list spacing.
- History off/on: four/five usable tab targets and long-label presentation on a
  small screen. Scroll the final paragraph clear of the floating menu.
- Real website/email links and visible failure guidance on a long article.
- Active shuffle/reveal → About me → Settings/theme/language/size → Draw: the
  same session and smooth resume, without image or animation resets.

Neutral sample content is intentionally editable; no personal biography was
invented. Full CommonMark, nested block structures and remote updates are outside
this version. Physical visuals, accessibility and performance need phone evidence.
