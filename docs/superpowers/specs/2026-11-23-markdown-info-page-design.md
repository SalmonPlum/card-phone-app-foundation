# Single Markdown information page

## Intent and scope

The app author can add one informational destination, such as About me, by
supplying bundled Markdown resources. The resources define both the menu label
and the page body. The user chose one page on 2026-11-23. There is no Settings
control, end-user editor, runtime import or remote content service.

## Approaches

The proposed resource format is Markdown with a small metadata header, as shown
in the conversation. Keeping the label in separate TypeScript/JSON would split
authorship across resources and would not meet the request that Markdown supply
both. A remote page would add connectivity and deployment requirements to this
offline app. Multiple destinations were considered; the user selected one.

## Proposed behavior

- Add a single optional Info route, with an information icon, immediately before
  Settings. Draw remains the initial destination. History stays independently
  controlled by its existing preference. With both enabled, the order is Draw,
  Catalogue, History, Info, Settings.
- The author includes or omits the page through bundled app resources; this
  inclusion is never a user preference. When omitted, hide the tab and handle
  direct navigation without displaying a broken destination.
- Supply English and Czech Markdown files for the same page. Each file starts
  with a `menuLabel` metadata field; the remaining Markdown is the page body.
  Use the app's selected locale for both. Require both translations when the
  resource is included; reject missing/empty labels or bodies during validation.
- Example English resource:

  ```markdown
  ---
  menuLabel: About me
  ---

  # About me

  Information about the author.
  ```

- Use a native scrollable reader styled with the selected theme, app text size
  and system font scaling. Provide bottom clearance for the floating dock.
  The Markdown heading supplies the visible page title; do not duplicate it.
- Initial Markdown support: headings, paragraphs, bold, italic, ordered and
  unordered lists, block quotes, horizontal rules and links. Images, embedded
  HTML, tables and executable content are outside this first version. Document
  the supported syntax and report unsupported author input during validation.
- Open HTTP/HTTPS and email links through the platform; unsupported destinations
  are not launched. Link failure must leave the page usable with localized feedback.
- Navigation and language/theme changes must preserve the active drawing session
  and existing lifecycle/interaction guards. Do not alter card surfaces or timing.

## Implementation choices left to the plan

The approved assistant proposals cover locale files, tab order,
initial Markdown subset, optional inclusion, and link behavior. Choose exact
resource paths, bundling/parser mechanics and renderer during planning, using the
existing Expo/React Native stack. Bundle source Markdown offline and expose one
author entry point rather than requiring route edits for each app. Provide neutral
bilingual sample content without inventing personal biography or contact details.

## Verification

Cover metadata/content parsing, locale selection, invalid author resources,
included/omitted navigation, History on/off, link behavior, theme/text-size use
and preservation of the current drawing session. Run affected tests, TypeScript,
lint, resource validation and an Android Metro export. Review four/five-tab layout,
long labels, long content, links and large text on a phone. Automated checks do
not establish physical layout or performance acceptance.

## Status

Single-page scope selected by the user. Approved on 2026-11-23: “pushed lets
continue. I like the design of about me page”. The user reported pushing the
existing implementation checkpoint before this work. Preserve local Expo/audit
files; no further commit or push requested.
