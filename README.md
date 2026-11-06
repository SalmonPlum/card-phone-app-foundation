# Modular card app development

Read [current status and next work](docs/current-status.md) first: the user approved current results on their phone; the initial enlargement works on their phone; the slower 900ms travel was accepted, and its new solid ivory cover is implemented and awaits feedback. The fixed-title/scroll-responsive card details are implemented. Settings now provides English-default English/Čeština selection, with a palette placeholder and implemented Automatic / Tap to flip preferences; phone persistence/layout review is pending. The drawn-card screen now also supports swipe-up reading with reversible artwork shrinking; phone review is pending. Manual-reveal settings are now implemented too; deck-defined detail sections are implemented across all readers; palette selection is the next saved feature after phone review. This order supersedes older next-work notes.

The React Native application lives in `mobile/`. This separate repository keeps application changes apart from the surrounding Obsidian workspace.

Approved design: `../docs/superpowers/specs/2026-10-26-card-app-design.md`.
Implementation plan: `../docs/superpowers/plans/2026-10-26-card-app-implementation.md`.
Approved motion reference: `../prototypes/overhand-shuffle.html`.

Initial scope: Android, Czech/English interface and deck content, secure draws without replacement, and a later shared iOS implementation.

The current native presentation follows the supplied [forest and ivory Stitch references](docs/design-references/stitch-forest/). See the [app README](mobile/README.md#forest-and-ivory-presentation) for font approximations and pending phone review.
