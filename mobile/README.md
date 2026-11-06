# Temporary card foundation

Android-first Expo Router/TypeScript app in the first development phase. The app name and `com.example.temporarycards` application ID remain temporary. The configured bundled deck is `sample`.

The foundation includes complete Czech/English sample content, validated replaceable decks, secure-random primitives, and the packet-aware session engine. The app opens directly on Draw, with a native overhand-shuffle preview, card reveal, confirmation, and drawn-card results after Stop or final-card confirmation. The persistent Draw/Catalogue/Settings bottom dock also opens the card catalogue: responsive face tiles, full bilingual details, and Close/Android Back to the same list. One root in-memory session survives tab switches; only **New session** explicitly starts over. Restarting the process starts a fresh session, with no saved history.

Dependencies are installed and the genuine npm lockfile is committed. Application/domain/motion tests, TypeScript, lint, deck validation, and an Android Metro bundle have passed. The user confirmed the baseline development app runs on a phone; the current shuffle movement has been visually accepted on the phone. The user reviewed the current results and said they look good on 2026-10-28. The new larger drawing reveal needs phone review; exhaustive layout/accessibility checks remain separate. The separate security regression remains failing until the targeted CLI Zod refresh is installed.

See [phase-one status and phone launch instructions](docs/phase-one-status.md), [development setup](docs/development.md), [deck authoring](docs/deck-authoring.md), and the [security follow-up](docs/security/follow-up.md). The user requested the recorded audit findings be addressed next iteration.

For the native preview, start Metro with `npm start` and reload the existing development app. Draw opens immediately; the short tab labels are **Tahání / Draw** and **Katalog / Catalogue**. No new native modules were added. See [Android motion validation](docs/android-validation.md).

## Try the catalogue

Restart Metro with `npm start -- --clear`, reload the existing development app, and choose the **Katalog / Catalogue** tab. No native rebuild or dependency installation is required for this change. Tap a face: that face grows from its measured tile over about 420ms while the catalogue stays behind it. Its name, meaning, full description, and localized Close control appear afterward. The name and Close control stay fixed at the top. The full face shrinks smoothly toward a thumbnail as you scroll down, making more text visible, and grows back when you return to the top. Close/Back returns the same image directly from its current size to the source tile. Close or Android Back returns it to its tile and restores the same catalogue. Language follows the explicit Settings choice; English is the fresh-install default regardless of device locale.

On a phone, check opening after scrolling, continuous expansion/return without a duplicate face or black blink, the two-column layout and large-text one-column fallback, complete artwork, long text in both locales, and repeated Close/Android Back. Try Back during expansion, background/resume, and orientation/font changes. Reduced motion presents and dismisses immediately; missing or changed return geometry fades safely. Catalogue selection does not change routes; direct card links still open standalone details. Automated timing, lifecycle, navigation, and native-image sizing checks pass; physical animation quality, accessibility focus, and retained native scroll position still need phone acceptance.

## Try drawn results

Draw and confirm one or more cards, then choose **Ukončit / Stop**. Confirmation of the final card also opens results in the same Draw tab. Results use the same face/name tiles and continuous detail overlay as Catalogue, in the exact committed draw order. Meanings and complete descriptions appear after opening a tile. Close or Android Back returns to its source tile; switching to Catalogue and back preserves the result session, order and list.

The localized count and **Nové vykládání / New session** action remain available outside details. Empty results offer **Vytahovat karty / Draw cards**. These explicit actions request a fresh identity and full shuffled deck. Exhaustion and tab changes retain the old results. If secure randomness is unavailable during reset, the old results stay available with the localized error and Retry action; a successful retry starts the fresh session once.

On a phone, check empty, one, odd and exhausted results, exact draw order, complete artwork, normal tile width, scroll retention through tabs/details, expansion and return without a blink, dock locking and Android Back. Check Czech/English descriptions and controls at narrow widths and large system text, plus background/resume, layout changes and New session. Automated router/provider, native callback/clock, image and measured-layout boundary checks do not establish physical scroll retention, animation performance or visual/accessibility acceptance. A hundred-card fixture verifies virtualization; phone acceptance remains pending.

## Forest and ivory presentation

The native screens now adapt the supplied [Stitch forest references](../docs/design-references/stitch-forest/) with a warm ivory canvas, forest shuffle mat, restrained brass accents, green pill actions, serif card names, and pale reading panels. The shared tokens live in `src/ui/theme.ts`. The bottom dock, catalogue, overlay/direct card details, draw controls and drawn results use the same palette. Existing local garden artwork, card fitting, shuffle paths, timing, image hosts, input guards and overlay travel are preserved. The reference HTML is design documentation only; the app loads no remote fonts or scripts and adds no mockup features.

This pass approximates Stitch's EB Garamond and DM Sans with native fonts: Georgia on iOS, Android's `serif`, and platform sans for body text and actions. Exact bundled fonts are a separate follow-up; Czech/English text and system font scaling remain enabled.

Reload the current development app from Metro; no native rebuild is required. Phone acceptance of this restyle remains pending. Compare it with all three references in Czech and English, at narrow screen widths and normal/large system text. Check readable mat guidance and remaining count, reachable Stop/Confirm, wrapping titles/buttons/captions, full artwork, drawn results, direct links, uninterrupted shuffling, and catalogue expansion/return without blinking or cropping. Automated tests and Android Metro export do not replace that physical visual review.

## Navigation and session lifetime

Draw is `/` and Catalogue is `/catalogue`, implemented by the existing Expo Router JavaScript tabs. The old `/draw-preview` link redirects to Draw; `/card/[id]` remains a standalone detail link with Back/history or Catalogue recovery. There is no Home destination. Repeated tab presses do not add routes or restart drawing.

Tabs remain mounted after first use. Leaving Draw pauses the existing UI clock; returning resumes the same packet/flip progress and drawn cards. Backgrounding while away does not complete another phase. Catalogue and completed results keep their live list instances and scroll state. It reads the same configured deck independently of the session, so it remains available if secure entropy initialization fails on Draw.

Android Back closes an open collection overlay first, then returns Catalogue to Draw. At root Draw, including results with details closed, normal system Back/exit applies. While details are opening, open or closing, the dock keeps its measured height but disables interaction and hides its items from accessibility. The dock reserves safe-area/font-scaled space in native layout; the tab screens exclude the bottom safe inset and the overlay uses the remaining measured host. Short screens can scroll Draw's mat and controls above the dock.

Automated checks cover real-router tab/session retention, deferred native-clock focus/background races, modal/Back precedence, link recovery, localization, native image sizing and native layout-event boundaries. Layout-event fixtures do not measure physical font rendering. Phone acceptance remains pending for dock alignment at narrow widths/large text, native scroll retention, pause/resume during packets and flip/reveal, artwork proportions, touch/accessibility focus and Android Back. No native performance claim follows from Jest or Metro export.

## Larger drawing reveal

The selected card now leaves the lower stack and grows into the usable screen area above the bottom dock, outside the shuffle mat. Its full 2:3 artwork fits approximately 90% of the host width, limited by available height, the fixed wrapping title and measured hints. Hints reserve at most 25% of host height; long text shares the main reader scroll so full artwork remains uncropped. Enlargement now takes 900ms (increased from 640ms after phone feedback), before the unchanged 620ms flip. A solid ivory cover, matching the app canvas (`#fbf9f3`), fades over the underlying mat/controls during enlargement, fully hides them behind the card/name during flip/hold, then fades away as shuffling resumes. The face and localized name hold until the user taps the card to confirm. Plain text below it says **Pro potvrzení klepněte na kartu. / Tap the card to confirm.**, with no button-style caption; on confirmation, the face and text gently fade upward over the full 900ms return while the ivory cover reveals the remaining stacks with the same easing and duration as the enlargement. This replaces the initial 370ms fade after phone feedback that it was too fast. The drawn card does not return to the deck. Final-card confirmation completes the same exit before opening results, keeping ivory behind the departing card. Shuffle timing stays at 1.25×.

Reload the current Metro development app; no native dependency rebuild is required. Check the new size on your phone, smooth extraction/growth before flip, full artwork, no blink, confirmation, subsequent draws, tab/background pause and resume, reduced motion, Czech/English names and large text. See [current status](../docs/current-status.md) and [verification report](../docs/2026-10-28-large-card-reveal-validation.md). The user confirmed the initial enlargement works. The slower pace was accepted; the revised solid ivory cover now needs phone feedback.

The requested detail-screen update—name fixed at the top and artwork shrinking as text scrolls—is implemented in Catalogue, drawn results and direct links. See [its design note](../docs/superpowers/specs/2026-10-28-card-detail-scroll-design.md) and [verification report](../docs/2026-10-28-card-detail-scroll-validation.md). It does not change drawing/reveal behavior.

A future [reveal-mode setting](../docs/superpowers/plans/2026-10-28-reveal-mode-setting.md) is planned: automatic flipping or waiting for a touch on the enlarged card back. It is not implemented; automatic flipping remains the current behavior.

The user tested the latest 900ms confirmation exit and accepted it for now. Further animation polish remains pending; this is the working baseline rather than final visual sign-off. See [its verification report](../docs/2026-10-28-reveal-confirmation-exit-validation.md) for focused tests and remaining device checks.

## Reading card details

The fixed name and Close/Back remain visible while meaning and description scroll. Scroll down to shrink the face and gain reading space; return to the top to restore it. Reduced motion starts with compact artwork. Reload the existing development app and check the scroll feel, desired thumbnail size, wrapped names/large text and continuous return to the grid on a phone. No native rebuild is needed; physical visual/accessibility/performance acceptance remains pending.

## Settings and language

Open **Settings / Nastavení** in the bottom dock and choose **English** or **Čeština**. English is the default for a fresh install. Changes apply immediately to the interface and card text without resetting your current draw; the choice is saved locally across app restarts. Language and reveal mode are saved separately; draw sessions/history still start fresh after process termination. Color palette remains an informational **Coming later / Připravujeme** placeholder.

Restart Metro with `npm start -- --clear` after the storage package hoist, then reload the existing client. This reuses the same Expo FileSystem version already listed in the generated Android build. Test persistence by closing/relaunching the phone app. If native saving is unavailable, language still changes for the current run and Settings offers a localized error/Retry. See [the Settings verification report](../docs/2026-10-28-settings-language-validation.md) for dependency details and pending phone checks.


## Reading immediately after drawing

After the flip, the large face stays visible below its fixed localized name. **Swipe up for details / Přejeďte nahoru pro podrobnosti** leads into the same deck-defined sections used by card details (the bundled decks currently define Meaning/Description). Scrolling shrinks the existing face toward a thumbnail; returning to the top restores its full size. Tap the face or thumbnail to confirm. Swipes and text taps do not confirm. Confirmation keeps the current face size through the existing 900ms fade and upward drift. Reduced motion keeps the initial large face and switches directly to compact artwork on the first scroll.

Reload the development app from Metro; no native rebuild or new dependency is required for this feature. Check natural scrolling from the card itself, thumbnail tapping, full text, wrapping names, large fonts, background/tab and language round trips on a phone. Native touch arbitration, visual smoothness and screen-reader focus require that phone check. See [verification](../docs/2026-10-28-drawn-card-reading-validation.md).


## Automatic or tap-to-flip reveal

In **Settings → Card reveal / Nastavení → Odhalení karty**, choose **Automatic / Automaticky** (default) or **Tap to flip / Otočit klepnutím**. Manual mode fully enlarges the card back and waits for your touch. Its name and details stay hidden. Tap the back to flip, then read by swiping up or tap the face separately to confirm. Settings changes apply to later draws; an already queued or waiting card keeps its chosen mode.

The preference is saved in app-private `app-reveal-mode.txt`, leaving the language file unchanged. A failed load falls back to Automatic; a failed save keeps the choice active for this run and offers Retry. No new dependencies or native rebuild are required. Reload from Metro and check both modes, restart persistence, rapid taps, background/tab interruptions, large fonts and screen-reader actions on a phone. See [verification](../docs/2026-10-28-reveal-mode-validation.md). Deck-defined detail templates are now implemented across all readers; palette selection remains future work.


## Deck-defined reading sections

Schema-2 decks define ordered bilingual headings once in `detailTemplate.sections`;
each card supplies its section content by ID. Every detail reader and swipe-up
drawn-card reader renders the full template in order, with no fixed two-section
limit. All declared sections require nonblank Czech/English text. Bundled decks
retain their original Meaning/Description content; raw schema-1 decks are normalized
by validation. See [deck authoring](docs/deck-authoring.md) and [verification](../docs/2026-10-28-deck-detail-template-validation.md).
No dependencies or rebuild are required; reload the development app. Custom-section
layout, large text and accessibility still need phone acceptance.
