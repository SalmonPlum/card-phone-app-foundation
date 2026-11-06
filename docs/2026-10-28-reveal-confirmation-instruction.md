# Plain instruction for reveal confirmation

Implemented 2026-10-28 after phone feedback. The user accepted the reveal/cover presentation but reported that the text under the card looked like a button and did not respond. They then explicitly chose a plain instruction with confirmation by touching the card.

## Final behavior

The localized name stays below the enlarged card. Beneath it, ordinary text reads **Pro potvrzení klepněte na kartu.** / **Tap the card to confirm.** The caption has no colored rounded panel, pill, border or button action. Its text uses the normal ivory-canvas ink colors. The caption can still scroll on constrained screens, and artwork retry remains an independent action.

The card confirmation surface retains its existing accessible button action, localized Confirm card label, reveal-only availability and pause lock. Touching the instruction does not confirm; touching the card does. No session, reveal timing, geometry, backdrop or asset-lifecycle logic changed. The future automatic/manual flip setting remains a separate unimplemented feature.

## Cause and verification

The old confirmation wording was passive Text inside the caption ScrollView. The actionable full-stage Pressable was a sibling behind that caption, so caption touches did not reach it. The final solution follows the user's chosen interaction: clarify the instruction and remove button-like styling rather than add a second confirmation button.

Observed RED in both languages: the new plain instruction was absent. GREEN checks verify both translations, passive instruction text, one accessible card action, card-touch confirmation and paused lock.

- Targeted interaction/native-clock/tab tests: 3 suites / 35 tests passed.
- Locale Node tests: 9 tests passed, including matching complete Czech/English dictionaries.
- TypeScript and scoped ESLint: passed.
- Diff/whitespace review: passed. No unrelated suites or Metro export repeated for this text/affordance change.

Reload the development app and confirm the instruction is clear and card tapping still works. Native appearance/accessibility acceptance of this adjustment remains subject to phone feedback. Changes are uncommitted; no dependencies or native modules changed.
