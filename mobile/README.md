# Temporary card foundation

Android-first Expo Router/TypeScript app in the first development phase. The app name and `com.example.temporarycards` application ID remain temporary. The configured bundled deck is `sample`.

The foundation includes complete Czech/English sample content, validated replaceable decks, secure-random primitives, and the packet-aware session engine. The home screen now opens a native overhand-shuffle preview with card reveal, confirmation, and temporary Stop results. Home also opens the card catalogue: responsive face tiles, full bilingual details, and Back to the same list. Shared card components are ready for the later results integration; final session navigation remains pending.

Dependencies are installed and the genuine npm lockfile is committed. Application/domain/motion tests, TypeScript, lint, deck validation, and an Android Metro bundle have passed. The user confirmed the baseline development app runs on a phone; the current shuffle movement has been visually accepted on the phone. The new catalogue/detail presentation still needs phone review. The separate security regression remains failing until the targeted CLI Zod refresh is installed.

See [phase-one status and phone launch instructions](docs/phase-one-status.md), [development setup](docs/development.md), [deck authoring](docs/deck-authoring.md), and the [security follow-up](docs/security/follow-up.md). The user requested the recorded audit findings be addressed next iteration.

For the native preview, start Metro with `npm start`, reload the existing development app, and tap **Vytahovat karty · Draw cards**. No new native modules were added. See [Android motion validation](docs/android-validation.md).

## Try the catalogue

Restart Metro with `npm start -- --clear`, reload the existing development app, and choose **Prohlížet karty / Browse cards** on Home. No native rebuild or dependency installation is required for this change. Tap a face to read its name, meaning, and full description; Back returns to the catalogue. Czech/English follows the device/app locale.

Check the two-column layout, large-text one-column fallback, full artwork without cropping, and opening a card after scrolling then returning with Back. Detail entry adds a 260ms forward movement; Android native fade/Back duration is platform-controlled. Reduced motion disables movement. Physical visual and scroll-position acceptance remain pending.
