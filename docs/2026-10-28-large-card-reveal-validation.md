# Larger drawn-card reveal: implementation and verification

Date: 2026-10-28. This records the initial 640ms implementation; subsequent phone feedback confirmed it works and requested a slower 900ms lift plus a subtle dim layer. See [the refinement plan and latest checks](superpowers/plans/2026-10-28-reveal-calm-tweaks.md). Code is in the existing feature checkout and has not been committed. The user approved the previous results presentation on their phone and authorized continuing. This report covers drawing enlargement; the requested fixed-title, scroll-responsive detail design is [a separate saved follow-up](superpowers/specs/2026-10-28-card-detail-scroll-design.md).

## Implemented behavior

The selected card grows from the receiver's actual painted top into the usable drawing host above the dock, completing enlargement during the existing 640ms lift before the unchanged 620ms flip. Destination width aims at 90% of host width and is limited by height and caption space. The complete 2:3 face and localized name hold until explicit confirmation. The next draw uses the remaining cards only. The accepted 1.25× shuffle and session/clock logic are unchanged.

ShuffleScene now owns the full measured host, the existing scrollable mat/controls, and one persistent selected image surface outside the mat. Scene placement includes letterboxing and native scroll offset. The selected surface stays under the same parent through extraction, enlargement, flip, reveal and confirmation. No new image-parent handoff, decode-all-deck behavior, dependency, dim effect or exit animation was introduced.

Normal captions use their natural measured content height. An oversized name/hint/error panel is capped at 40% of host height and scrolls internally, preserving visible artwork and reachable full text/retry. This cap is an implementation choice for phone validation. Underlying mat/footer interaction and accessibility are disabled while the foreground card is active; confirmation remains locked until reveal, and asset retry remains separate.

## Evidence

- Observed behavioral RED for the new growth regression: the old endpoint width was 297.5 reference units, below the larger-foreground assertion. The other 14 native-clock tests passed at that stage.
- Growth/endpoint/hold/confirmation regression now passes and checks persistent face/back instances, unchanged full size at flip boundaries, and indefinite hold.
- Native-layout regression verifies the scrolled receiver-to-host seam, a wrapped caption, held-reveal resize and persistent face identity. Native scheduling tests retain the existing deferred RN/UI boundary, reduced-motion, stale-token, queue and image-error coverage.
- Independent final code review found one substantive short-screen/large-text issue: oversized captions collapsed the artwork. A regression reproduced a 1dp artwork height with a 700dp caption in a 280×300 host. The bounded, scrollable caption correction passes that regression. No other blockers were reported; final verification is recorded below.
- Foreground/motion Node checks: 11/11 pass, covering 280×300, 320×480 and 430×800 hosts, caption bounds, 2:3 artwork, scene/scroll conversion, finite fallback geometry, depth and original timing constants.

Final verification after the caption correction:

- `npm test -- --runInBand src/features/draw/__tests__ src/navigation/__tests__ src/features/results/__tests__ src/session/__tests__`: 10 suites / 77 tests passed.
- `node --test --experimental-test-isolation=none src/features/draw/__tests__/foreground.node.test.ts src/features/draw/__tests__/motion.node.test.ts`: 11 tests passed; these files remained unchanged after that run.
- `npm run typecheck`: passed after the final code/test changes.
- `npm run lint`: passed; after the caption/test correction, scoped `npx --no-install eslint src/features/draw` also passed.
- `CI=1 npx --no-install expo export --platform android --output-dir /tmp/cards-large-reveal-final-export`: passed after the final correction. This is a Metro/Hermes bundle, not an APK or device run.
- `git diff --check`: passed. Updated Markdown links and whitespace were checked separately, including files outside the application repository.

The checks deliberately target draw, navigation/layout, results and session integration. Unchanged deck/randomness/content/security suites were not rerun. This feature does not resolve the already documented security failure. Logs were kept in `/tmp/cards-enlargement-*.log` during this session rather than printing full outputs repeatedly.

## Phone validation still required

Reload the current Metro development app; no native modules or dependency versions changed. Check smooth extraction and growth before flip, desired final size, full artwork, no blink/jump, indefinite hold and confirmation, a second draw, and Stop/results after confirmation. Exercise tab switches/backgrounding during growth/flip, reduced motion, Czech/English names, narrow/short hosts and large system text. Confirm oversized caption/retry content scrolls without confirming accidentally. Real-device performance and 100-card rendering remain unverified; mocked clocks, measured layout fixtures and Metro exports do not establish native visual acceptance.

No merge, push, native APK build, or device acceptance is claimed. User-owned gitignore/expo-env/audit files and pre-existing Markdown edits were preserved.
