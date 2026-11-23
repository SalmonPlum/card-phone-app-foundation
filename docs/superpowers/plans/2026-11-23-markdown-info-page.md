# Markdown Info Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add one author-configured About me tab whose localized label and content come from bundled Markdown.

**Architecture:** Parse the supported Markdown subset at build time into a checked-in JSON resource. Render that structured resource with native React Native components and integrate its label/availability into the existing dock. One author configuration enables or omits the page without route edits; no network, WebView or additional runtime package is needed.

**Tech Stack:** Existing Expo Router, React Native, TypeScript, Node resource tooling, Jest and React Native Testing Library.

**Spec:** [Approved design](../specs/2026-11-23-markdown-info-page-design.md), approved 2026-11-23 after the user reported pushing the checkpoint.

## Global Constraints

- One optional Info route immediately before Settings; History remains independently controlled.
- Markdown supplies `menuLabel` and page body, with complete English/Czech resources.
- No Settings control, end-user editor, runtime import or remote content service.
- Use theme, app text size and system font scaling; clear the floating dock.
- Preserve drawing session identity, lifecycle guards, artwork surfaces and animation timing.
- Support headings, paragraphs, bold, italic, lists, block quotes, horizontal rules and links; reject unsupported images, HTML, tables and executable content at author validation.
- HTTP/HTTPS/email links only; localized failure feedback without breaking the page.
- Preserve local Expo/audit files and Android machine configuration. No new commit/push requested for this feature.

## Review Focus

- Omitted page reached by a direct link redirects to Draw without an empty tab.
- Long Czech labels/content and large system/app text retain usable navigation and scroll clearance.
- Malformed metadata, missing locale, unsupported syntax and stale generated resources fail author validation with file context.
- Unsupported link schemes never launch; rejected native link promises show localized recovery even after locale changes.
- Switching away mid-draw to Info and back preserves the session and paused animation progress; History still yields the correct four/five-tab order.

## File map and author workflow

- `mobile/resources/info/page.json`: one author entry point, either `null` (omit) or `{ "en": "en.md", "cs": "cs.md" }`. Paths resolve within the resource directory.
- `mobile/resources/info/en.md`, `cs.md`: neutral editable sample, with localized `menuLabel` front matter and an About me heading. No invented personal details.
- `mobile/src/info/markdown.ts`: framework-free metadata and supported-Markdown parser, serializable block/inline types, link destination checks.
- `mobile/scripts/generate-info.ts`: loads configuration and source files, validates both locales and writes or checks generated JSON.
- `mobile/src/info/generated.json`: compiled bilingual document or `null`, bundled by Metro.
- `mobile/src/info/index.ts`: typed resource accessor used by navigation and reader.
- `mobile/src/features/info/InfoScreen.tsx`: native themed reader and localized link failure UI.
- `mobile/src/app/(tabs)/info.tsx`: route re-export.
- Existing tab layout, dock, locale dictionaries and package scripts: integration only.
- `mobile/docs/info-page.md`: author instructions and exact supported syntax.
- Adjacent parser/reader tests plus navigation integration tests and generation checks.

Author edits Markdown, then runs `npm run generate:info`. Prestart and Android
launch hooks also regenerate, so the normal author launch flow sees new content.
`npm run validate:info` checks input validity and rejects stale generated JSON.
No filesystem reads occur in the app. The accepted scope is a documented Markdown
subset, not a general CommonMark renderer; do not silently drop unsupported input.

### Task 1: Validated bilingual Markdown resource

**Files:** resource/tooling/parser/accessor files above, `mobile/package.json`,
`mobile/src/info/__tests__/markdown.node.test.ts`, generator tests under `mobile/scripts/`.

**Interfaces:** `parseInfoMarkdown(source: string): InfoDocument`,
`isAllowedInfoLink(url: string): boolean`, `InfoDocument` containing `menuLabel`
and typed `blocks`; `configuredInfoPage: Record<'en' | 'cs', InfoDocument> | null`.
Block types cover heading level/text, paragraph inlines, quote blocks, ordered/
unordered lists and rule. Inline types cover text, emphasis, strong and link.

- [x] Write parser tests for CRLF/front matter, empty/duplicate/unknown metadata,
  every supported block/inline, multiline text, Czech diacritics, nested formatting,
  escaped punctuation and malformed/unsupported constructs. Assert unsupported
  links and images/HTML/tables/code are rejected with actionable errors.
- [x] Run `node --experimental-strip-types --test src/info/__tests__/markdown.node.test.ts`
  from `mobile/` and observe missing-parser failure.
- [x] Implement the typed parser for the documented subset. Preserve complete
  text, including literal punctuation; reject rather than truncate invalid input.
- [x] Add resource configuration, neutral localized examples, generator and
  generated JSON/accessor. Reject missing locales, invalid paths, malformed files
  and blank content. `null` generates an omitted-page resource.
- [x] Add generator tests using temporary fixture directories: valid bilingual
  compilation, null inclusion, missing Czech file, invalid paths and stale output.
  Run them and parser tests to PASS; add `generate:info` / `validate:info` commands
  and generation hooks without replacing existing scripts.

### Task 2: Native themed reader and safe links

**Files:** `InfoScreen.tsx`, `info.tsx`, `mobile/src/i18n/en.ts`, `cs.ts`,
`mobile/src/features/info/__tests__/InfoScreen.test.tsx`.

**Interfaces:** consumes `configuredInfoPage` and parser types from Task 1;
exports `InfoScreen(): React.JSX.Element`. Uses existing `useLocale`,
`useThemeStyles` and `useDockHeight`; platform opening uses React Native Linking.

- [x] Write failing reader tests for selected-locale text, native headings,
  formatting/lists/quotes/rules, link accessibility and dock clearance.
- [x] Add tests for omitted-page redirect, theme/app-size changes, allowed links,
  unsupported scheme suppression and failed native opening with Czech/English
  feedback. Include a late link failure after a locale change/unmount.
- [x] Run `npm test -- --runInBand src/features/info/__tests__/InfoScreen.test.tsx`
  and observe missing-screen failure.
- [x] Implement recursive native block/inline rendering with existing typography,
  readable heading hierarchy, list indentation and quote treatment. Do not add a
  second title outside Markdown. Show localized recoverable link error feedback;
  guard async outcomes after unmount. Keep content scrollable above dock padding.
- [x] Run reader tests to PASS and inspect the rendered structure for text loss.

### Task 3: Tab integration, author docs and final checks

**Files:** `mobile/src/app/(tabs)/_layout.tsx`,
`mobile/src/navigation/BottomDock.tsx`, navigation tests,
`mobile/docs/info-page.md`, `mobile/README.md`, status and validation documents.

**Interfaces:** route name `info`; localized label is
`configuredInfoPage[locale].menuLabel`. Consume resource presence in both route
registration and the dock filter. Draw remains initial route.

- [x] Write failing router tests with Info included/omitted, direct `/info`, both
  History states, localized labels and accessible selected state. Extend a
  real-root paused-draw regression to visit Info, change locale/theme/text size
  via Settings and return without new session identity or duplicate completion.
- [x] Run affected navigation tests to observe the missing-tab failures.
- [x] Register the optional route and add its information icon/label to the dock.
  Retain preventable tab events, interaction blocking and measured height.
  Adjust shared spacing only if five-item regressions demonstrate a need.
- [x] Run parser, generation, reader and affected navigation/history tests to PASS.
  Document author inclusion/removal, both locale files, metadata, supported syntax,
  links, generation and validation commands. Record pending phone checks.
- [x] Run full Jest once for integrated navigation coverage; run domain tests,
  TypeScript, full lint, `validate:info`, deck/theme validation, Android export to
  `/tmp/cards-info-final-android-export` and `git diff --check`. Do not repeat
  unchanged checks after documentation-only updates.
- [x] Review the final diff against the approved design, record results and update
  current status. Keep device acceptance pending for four/five tabs, long Czech
  labels, larger text, long content, links and actual drawing pause/resume.

## Plan review and execution

Self-review completed against the approved design: resource authorship, optional
inclusion, bilingual validation, Markdown subset, platform links, themed native
rendering, dock ordering and session preservation each have an owning task and
verification. Build-time compilation is the implementation choice to avoid Metro
text-loader configuration and new runtime dependencies. The user approved direct implementation on 2026-11-23. All three tasks are
implemented and verified; a fresh final reviewer identified four P2 findings,
reproduced and fixed before the passing final checks. Device acceptance remains
pending. See the linked validation report in current status.
