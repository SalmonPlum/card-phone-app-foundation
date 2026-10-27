# Draw card proportions correction

Date: 2026-10-27. Scope base: `6f45ebc` (source unchanged from the reported `31e82a4` styling state). Work stays on the current feature branch; no merge, push, publication or navigation implementation.

The draw renderer now preserves the bundled artwork's native 2:3 proportions, matching the catalogue. The accepted forest/ivory styling remains in place. Removing Home and adopting the Stitch bottom menu is separately recorded and remains deferred.

## Root cause and measurements

The shipped faces and backs are 600×900 PNGs. Catalogue `CardFace` resolves each source's native width/height and uses that ratio without unequal axis scaling. Draw `Stack` instead painted a 238×358 rectangle and applied `scaleY = pose.scale × .88` after rotation. This compressed the artwork vertically throughout the animation; on rotated stacks it also made the card's transformed local axes nonperpendicular. The `above()` layer-anchor helper and old geometry assertions both repeated the same `.88` assumption, so existing seam tests could pass while the artwork looked too square.

At the unrotated reveal, the old displayed rectangle in scene coordinates was 297.5×393.8: aspect ratio 0.7554596242 versus the native/catalogue 0.6666666667, approximately 13.32% too wide relative to its height. These are rendered-style calculations, not phone measurements. The 238×358 base alone also differed from the native ratio by approximately 0.279%.

The correction applies the same pose scale to both axes and uses 238×357 for the stack, edges, back host and images. Centering changes from a 179 to a 178.5 half-height, retaining each pose's center. Reveal is now 297.5×446.25 in scene coordinates, exactly 2:3. `above()` uses the same uniformly scaled rotated offsets as the card renderer, keeping packet surfaces joined to actual stack tops.

## Regression evidence

Used systematic debugging and test-driven development. Production changes were made only after both geometry regressions failed against the old implementation.

- RED: `npm test -- --runInBand src/features/draw/__tests__/stack.test.tsx` reported 1 failed / 4 passed. The new test read the shipped PNG's width/height, checked real catalogue `CardFace` sizing against it, then measured rendered draw images using transformed local basis lengths. Reveal failed with expected 0.6666666667 and received 0.7554596242.
- RED: `node --experimental-strip-types --test --experimental-test-isolation=none src/features/draw/__tests__/motion.node.test.ts` reported 1 failed / 2 passed. The rigid layer-offset regression rejected the old compressed vertical anchor.
- GREEN: the motion suite passed 3/3 after correcting both render and anchor geometry. The new draw regression passed across 18 phase/role samples: reveal, both full flip endpoints, lift start/middle/end, regrip, return, lower, ready, strip source/flying, contact, source aside and resume. It checks both front/back image dimensions where present, actual painted-image counts, native aspect, and perpendicular local axes; rotated bounding-box ratios are deliberately not used as a proxy for physical card shape.
- Existing painted-surface tests still verify source→flying, flying→receiver, receiver→selected and source resume joins for 1, 8 and 100 cards. The flip regression retains the intentional horizontal foreshortening during the turn.
- An intermediate combined stack/native-clock run had 3 native-clock failures because its expected top-left positions still used the old half-height. Those fixtures now describe the same receiver/source centers with the 357-high card (`396.5` / `151.5` top), and the final full suite passes them.

## Preserved behavior

Pose constants, pose scale values, interpolation, curved return, easing, phase durations and shuffle speed are unchanged. Stack-top anchors necessarily track the corrected physical card geometry. No selected foreground scale increase, larger-reveal feature, scene sizing, state reducer, packet selection, random ordering, animation clock, pause/resume handling, image identity, persistent stack host or layer count behavior changed. Full tests include the existing packet completion, repeated pass/draw, coherent UI boundary and native image identity coverage.

Only `Stack.tsx`, `motion.ts`, their stack/motion/native-clock tests and this report are included. No dependency, lockfile, security, theme, catalogue or route code changes. Existing user edits to `mobile/.gitignore`, `mobile/expo-env.d.ts` and untracked `mobile/npm-audit-after.json` remain untouched and outside the commit.

## Final verification

From `development/mobile`, all commands exited 0:

- `npm test -- --runInBand`: 16 suites / 120 tests passed.
- `npm run test:domain`: 71/71 passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with no findings.
- `npm run validate:decks`: both manifests, 13 PNGs, localized text and static registry passed.
- `npx expo export --platform android --output-dir /tmp/cards-draw-proportions-android-export`: Android Hermes bundle exported, 1547 modules. Metro emitted the existing `NO_COLOR`/`FORCE_COLOR` environment warning; export succeeded.
- `git diff --check`: passed.

Phone visual validation remains pending. Reload the development client and compare the revealed card with catalogue artwork, then watch rotated stacks, transfers, lift/flip and confirmation/resume. These automated calculations and the Android export do not establish native display appearance, frame pacing, clipping or physical device acceptance.
