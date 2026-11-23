# Authoring the information page

The bottom menu can include one author-configured page, initially **About me** /
**O mně**. It is independent of History and has no control in Settings. Content
is bundled offline; visitors cannot edit it. The included prose is a neutral
sample: replace it with your own story before publishing a personalized app.

## Edit the content

Edit `resources/info/en.md` and `resources/info/cs.md`. Both are required when the
page is included. Each file starts with this small metadata header, followed by
a blank line and Markdown:

```markdown
---
menuLabel: About me
---

# About me

Your introduction, with **bold**, *italic* and a [website](https://example.com).

## Contact

[Email me](mailto:hello@example.com)
```

Use `menuLabel: O mně` and Czech text in `cs.md`. The selected app language
controls both the menu label and content. Keep labels short for the five-tab dock. The bottom menu scrolls horizontally and visual labels stay on one line.
A label wider than the viewport ends in an ellipsis; accessibility labels retain
the complete authored name.
The metadata supports exactly one plain, unquoted `menuLabel` line; it is not a
full YAML interpreter. Do not add YAML quotes or fields. The heading in the body
provides the page title; the screen does not add a duplicate title.

## Include or omit the page

`resources/info/page.json` is the only inclusion configuration:

```json
{"en":"en.md","cs":"cs.md"}
```

To omit the page, replace its entire contents with `null`. No route or Settings
change is needed. The tab disappears and direct `/info` navigation returns to
Draw. Resource filenames must be simple `.md` filenames within this directory,
with letters, digits, hyphens or underscores. There is only one page, not an
array of pages.

## Supported Markdown

- Headings using `#` through `######` and paragraphs separated by blank lines.
- `**bold**` / `__bold__` and `*italic*` / `_italic_`, including nested formatting.
- Flat unordered lists using `-`, `+` or `*`; ordered lists using `1.`, `2.`, etc.
  The first number sets the starting number. Keep each item on one line.
- Text block quotes starting with `>`, including consecutive quote lines. Quotes
  support inline formatting, not nested block structures.
- Horizontal rules of three or more `-`, `*` or `_` characters.
- Inline `[label](destination)` links with absolute `http://`, `https://` or
  `mailto:` destinations. Website credentials and whitespace are rejected.
- Backslash escapes for literal punctuation, such as `\*text\*`, `\[` or `\\`.
  Use a blank line between blocks; single paragraph line breaks become spaces.

This is a deliberately limited subset, not full CommonMark. Images, HTML,
tables, code, nested/indented lists, reference links and autolinks are unsupported.
Validation rejects these constructs rather than dropping content. Escape literal
markup punctuation when necessary; use ordinary prose instead of unsupported
structures. Native link opening is performed only after a tap; a failure shows
localized feedback and the link can be tapped again.

## Generate and validate

From `mobile/`:

```bash
npm run generate:info
npm run validate:info
```

Generation validates both source files and writes `src/info/generated.json`.
Commit that generated file with the Markdown sources when publishing changes.
The app imports this JSON and does not read source files from the device.
Validation also rejects stale generated output. Normal `npm start`, `npm run
android` and `npm run android:release` regenerate before launch. While Metro is
already running, rerun `npm run generate:info` after editing Markdown; hot reload
then picks up the generated JSON. Direct export/build tooling must generate first.

`npm run test:info` covers the parser and generation fixtures. The normal domain
test command also discovers parser tests. The resource validator gives filename
context for malformed author input. No new runtime dependency or native module
is needed; reload the existing client.

## Phone review

Check both languages, themes and text-size settings, long content and working
links. With History enabled the dock contains five destinations; swipe the menu to reach
them and verify labels,
last-paragraph scroll clearance and touch targets on a small phone with larger
system text. Returning from Info must retain the active drawing session and its
paused shuffle/reveal. Automated layout fixtures do not establish phone acceptance.
