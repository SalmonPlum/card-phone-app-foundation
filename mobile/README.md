# Temporary card foundation

Android-first Expo Router/TypeScript app in the first development phase. The app name and `com.example.temporarycards` application ID remain temporary. The configured bundled deck is `sample`.

The foundation includes complete Czech/English sample content, validated replaceable decks, secure-random primitives, and the packet-aware session engine. The home screen now opens a native overhand-shuffle preview with card reveal, confirmation, and temporary Stop results. The shared catalogue/results grid and final navigation remain later milestones.

Dependencies are installed and the genuine npm lockfile is committed. Application/domain/motion tests, TypeScript, lint, deck validation, and an Android Metro bundle have passed. The user confirmed the baseline development app runs on a phone; the new native animation still needs physical visual acceptance. The separate security regression remains failing until the targeted CLI Zod refresh is installed.

See [phase-one status and phone launch instructions](docs/phase-one-status.md), [development setup](docs/development.md), [deck authoring](docs/deck-authoring.md), and the [security follow-up](docs/security/follow-up.md). The user requested the recorded audit findings be addressed next iteration.

For the native preview, start Metro with `npm start`, reload the existing development app, and tap **Vytahovat karty · Draw cards**. No new native modules were added. See [Android motion validation](docs/android-validation.md).
