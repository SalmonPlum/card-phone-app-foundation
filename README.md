# Card app foundation

Start with the [foundation implementation guide](docs/foundation-guide.md) to build
an app with your own identity, deck, artwork, themes, interface wording and Markdown
information page. It includes a resource map, an AI-agent brief and targeted checks.

The Expo/React Native TypeScript application lives in `mobile/`. Run Git commands
from this repository and app commands from `mobile/`. See the [app README](mobile/README.md)
for features and [current status](docs/current-status.md) for accepted work, open
phone checks and backlog. Current explicit user decisions supersede older plans.

The foundation uses one offline bundled deck, English/Czech content, secure draws
without replacement and a session that survives tab changes. Android is the
current phone-tested development target; iOS acceptance remains separate.

Authoring references: [deck](mobile/docs/deck-authoring.md),
[artwork](mobile/docs/card-artwork.md), [themes](mobile/docs/theme-authoring.md),
[presentation](mobile/docs/app-presentation.md), [Info](mobile/docs/info-page.md).

Development references: [setup](mobile/docs/development.md),
[Android checks](mobile/docs/android-validation.md),
[security follow-up](mobile/docs/security/follow-up.md).

The accepted motion reference is `../prototypes/overhand-shuffle.html`; visual
references are in [design-references](docs/design-references/). Preserve approved
motion, persistent artwork and session behavior when branding a final app.
