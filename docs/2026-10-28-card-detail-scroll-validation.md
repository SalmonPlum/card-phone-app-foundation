# Card details: fixed title and scroll-responsive artwork

Implemented 2026-10-28 in the existing feature checkout, uncommitted. This fulfills the user's saved detail request for Catalogue, drawn results and direct card links. The drawing/reveal/confirmation animation was not changed; its further polish remains pending.

## Behavior

The localized card name and Close/Back control stay at the top, outside the scrolling text. The full face begins large; scrolling down shrinks it from the same native scroll offset until a thumbnail of approximately 112dp height (or half the initial height on constrained hosts). Returning to the top restores the large face. Meaning and description remain complete, with system font scaling and Czech/English content.

A fixed scroll viewport contains an expanded-artwork spacer followed by the text sections. A pinned opaque artwork band shrinks at the same rate that the text rises, exposing more text without resizing the native scroll viewport or feeding geometry changes back into its offset. Once the thumbnail minimum is reached, text continues scrolling below it. Full artwork proportions and a single face instance are preserved.

The overlay measures the wrapping title/action header before starting entry. The same image remains mounted during preparation, expansion, reading and return. Close samples the current collapsed UI rectangle atomically, freezes scroll-driven geometry, and returns that surface directly to the measured tile. Late scroll delivery after the freeze cannot move the closing face. Existing missing-target fade, modal dock locking, grid state/focus restoration, Android Back and generation/lifecycle guards remain in use.

Direct links reuse the same reading layout and fixed Back/name header. Reduced motion uses a compact image from entry, with no scroll-linked resizing. Unresolved native reduced-motion preferences are treated as compact, so reduced-motion users do not first see an expanded image jump smaller.

## Evidence and checks

- Observed RED for the original layout: the card-name header was inside `RCTScrollView`. GREEN checks fixed header ownership, face shrinking, a shrinking artwork band that reclaims visible text area, stable viewport bounds, return to expanded geometry and native image identity.
- Geometry checks cover measured 136dp wrapped headers in a 280×480 host, full aspect ratio, pinned top/centre, negative overscroll, minimum size and restored y0 geometry.
- Native-boundary checks cover header readiness, collapsed close, the final scroll frame between RN close commit and UI sampling, late scroll after freeze, existing interrupted opening/fallback return, reduced-motion compact scrolling and localized Close.
- Direct-detail checks cover fixed name/Back, scroll collapse/restore, image identity, locale-specific artwork/error content and the installed iOS/Android native Image sizing boundary.
- Existing Catalogue/results/router/layout/session-consumer checks cover the shared screen path, safe dock space, detail Close/Back, list retention, configured alternate deck and no session mutation.

Before the final review correction:

- `npm test -- --runInBand src/features/cards/__tests__ src/navigation/__tests__ src/features/results/__tests__ src/session/__tests__/DrawPreviewSession.test.tsx`: **14 suites / 128 tests passed**.
- TypeScript and scoped ESLint passed; Android Metro export passed.

Scoped independent review found one P2 issue: direct details treated unresolved reduced-motion preference as full motion. A deferred-native-preference regression reproduced an approximately 292dp initial face instead of compact artwork. The correction treats unknown as compact; the same pose/image survives preference resolution to true. No other substantive blockers were reported.

After that correction:

- Focused CardDetails / native image sizing / card navigation: **3 suites / 30 tests passed**, including the new deferred-preference regression.
- `npm run typecheck`: passed.
- Scoped ESLint on the final changed direct-detail code/test: passed; the wider changed-card/fixture lint run had already passed.
- Final Android Metro export: passed at `/tmp/cards-detail-scroll-final-export`. This is a Hermes bundle, not an APK/device run.
- Diff and updated Markdown link/whitespace review: passed.

Unchanged drawing/domain/randomness/security/deck suites were not rerun. Existing security follow-up remains open. Native preference and scroll adapters in tests model the scheduler boundary; they do not prove physical font layout, scroll performance or visual acceptance.

## Choices and phone review

The ~112dp thumbnail, 1:1 scroll collapse and compact reduced-motion layout are implementation choices to tune on the phone. Initial artwork now reserves space below the measured header and for text. On very short screens with substantially wrapped headers, fitted artwork/reading space takes precedence over guaranteed enlargement relative to the source tile; the existing collection width cap uses the default header reserve. Review that constrained presentation physically before calling its visual quality accepted.

Reload the Metro development app; no native dependencies changed. Check Catalogue and drawn results, fixed name/Close while scrolling, full artwork, the space gained for reading, restoration at the top, closing from partial/full collapse without blink/jump, retained source grid/offset, Android Back, direct links/Back, Czech/English long content, narrow/short screens, large text, reduced motion and TalkBack focus/reading. Background and layout changes must retain safe cleanup/fallback behavior.

Phone visual/accessibility/performance acceptance remains pending. No commits, merge, push, native rebuild or device acceptance is claimed. User-owned gitignore/expo-env/audit files and earlier feature work were preserved.
