# Temporary card foundation

Android-first Expo Router/TypeScript app in the first development phase. The app name and `com.example.temporarycards` application ID remain temporary. The configured bundled deck is `sample`.

The foundation includes complete Czech/English sample content, validated replaceable decks, secure-random primitives, and the packet-aware session engine. The app opens directly on Draw, with a native overhand-shuffle preview, card reveal, confirmation, and temporary Stop results. The persistent Draw/Catalogue bottom dock also opens the card catalogue: responsive face tiles, full bilingual details, and Close/Android Back to the same list. One root in-memory session survives tab switches; only **New session** explicitly starts over. Restarting the process starts a fresh session, with no saved history.

Dependencies are installed and the genuine npm lockfile is committed. Application/domain/motion tests, TypeScript, lint, deck validation, and an Android Metro bundle have passed. The user confirmed the baseline development app runs on a phone; the current shuffle movement has been visually accepted on the phone. The new catalogue/detail presentation still needs phone review. The separate security regression remains failing until the targeted CLI Zod refresh is installed.

See [phase-one status and phone launch instructions](docs/phase-one-status.md), [development setup](docs/development.md), [deck authoring](docs/deck-authoring.md), and the [security follow-up](docs/security/follow-up.md). The user requested the recorded audit findings be addressed next iteration.

For the native preview, start Metro with `npm start` and reload the existing development app. Draw opens immediately; the short tab labels are **Tahání / Draw** and **Katalog / Catalogue**. No new native modules were added. See [Android motion validation](docs/android-validation.md).

## Try the catalogue

Restart Metro with `npm start -- --clear`, reload the existing development app, and choose the **Katalog / Catalogue** tab. No native rebuild or dependency installation is required for this change. Tap a face: that face grows from its measured tile over about 420ms while the catalogue stays behind it. Its name, meaning, full description, and localized Close control appear afterward. The enlarged face stays fixed above scrollable text. Close or Android Back returns it to its tile and restores the same catalogue. Czech/English follows the device/app locale.

On a phone, check opening after scrolling, continuous expansion/return without a duplicate face or black blink, the two-column layout and large-text one-column fallback, complete artwork, long text in both locales, and repeated Close/Android Back. Try Back during expansion, background/resume, and orientation/font changes. Reduced motion presents and dismisses immediately; missing or changed return geometry fades safely. Catalogue selection does not change routes; direct card links still open standalone details. Automated timing, lifecycle, navigation, and native-image sizing checks pass; physical animation quality, accessibility focus, and retained native scroll position still need phone acceptance.

## Forest and ivory presentation

The native screens now adapt the supplied [Stitch forest references](../docs/design-references/stitch-forest/) with a warm ivory canvas, forest shuffle mat, restrained brass accents, green pill actions, serif card names, and pale reading panels. The shared tokens live in `src/ui/theme.ts`. The bottom dock, catalogue, overlay/direct card details, draw controls and temporary results use the same palette. Existing local garden artwork, card fitting, shuffle paths, timing, image hosts, input guards and overlay travel are preserved. The reference HTML is design documentation only; the app loads no remote fonts or scripts and adds no mockup features.

This pass approximates Stitch's EB Garamond and DM Sans with native fonts: Georgia on iOS, Android's `serif`, and platform sans for body text and actions. Exact bundled fonts are a separate follow-up; Czech/English text and system font scaling remain enabled.

Reload the current development app from Metro; no native rebuild is required. Phone acceptance of this restyle remains pending. Compare it with all three references in Czech and English, at narrow screen widths and normal/large system text. Check readable mat guidance and remaining count, reachable Stop/Confirm, wrapping titles/buttons/captions, full artwork, temporary results, direct links, uninterrupted shuffling, and catalogue expansion/return without blinking or cropping. Automated tests and Android Metro export do not replace that physical visual review.

## Navigation and session lifetime

Draw is `/` and Catalogue is `/catalogue`, implemented by the existing Expo Router JavaScript tabs. The old `/draw-preview` link redirects to Draw; `/card/[id]` remains a standalone detail link with Back/history or Catalogue recovery. There is no Home destination. Repeated tab presses do not add routes or restart drawing.

Tabs remain mounted after first use. Leaving Draw pauses the existing UI clock; returning resumes the same packet/flip progress and drawn cards. Backgrounding while away does not complete another phase. Catalogue keeps its live list instance and scroll state. It reads the same configured deck independently of the session, so it remains available if secure entropy initialization fails on Draw.

Android Back closes an open catalogue overlay first, then returns Catalogue to Draw. At root Draw, including temporary results, normal system Back/exit applies. While details are opening, open or closing, the dock keeps its measured height but disables interaction and hides its items from accessibility. The dock reserves safe-area/font-scaled space in native layout; the tab screens exclude the bottom safe inset and the overlay uses the remaining measured host. Short screens can scroll Draw's mat and controls above the dock.

Automated checks cover real-router tab/session retention, deferred native-clock focus/background races, modal/Back precedence, link recovery, localization, native image sizing and native layout-event boundaries. Layout-event fixtures do not measure physical font rendering. Phone acceptance remains pending for dock alignment at narrow widths/large text, native scroll retention, pause/resume during packets and flip/reveal, artwork proportions, touch/accessibility focus and Android Back. No native performance claim follows from Jest or Metro export.
