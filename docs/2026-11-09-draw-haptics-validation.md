# Drawing haptics — validation 2026-11-09

## Delivered

Approved [design](superpowers/specs/2026-11-09-draw-haptics-design.md) and
[implementation plan](superpowers/plans/2026-11-09-draw-haptics.md).

After the approved refinement, one stronger Heavy impact is requested after the
flip completes, for automatic and manual reveal; the original gentle Light
strength is requested at each shuffle packet landing. Settings provides a themed, accessible Haptic feedback switch
(Hmatová odezva in Czech), default on and saved independently in the app-private
`app-haptics.txt` file. Ordered writes, stale-read protection and localized save
retry follow the existing settings pattern. There is no session reset when the
preference changes. No haptic is requested while settings load or the app is
inactive, during other shuffle motion/wait/confirmation, or from rerenders and
stale tokens.
Suppressed feedback is never replayed on hydration or resume. Native module
absence, synchronous failure and rejected requests cannot block drawing.

The Expo-compatible `expo-haptics` dependency is pinned at 58.0.7. Initial downloads
failed DNS from this environment, including the allowed-network retry. The user
installed it; installed version, package and lockfile were verified. Existing
security overrides and other dependencies are unchanged.

## Review and regressions

Independent scoped review found one important resume edge: DrawPreview defers
completion received while inactive/unfocused. A foreground check alone allowed a
late pulse when that completion was delivered on return. Background and tab-blur
regressions reproduced it RED. Deferred callbacks now suppress feedback while
retaining active/focus guards, token validation and normal reveal progression.
Both cases passed GREEN and verify that subsequent fresh draws still pulse.
The review's minor test-coverage observation was addressed with a module-load
failure regression. No unresolved material findings or deferred minors.

Other coverage includes both reveal modes, successive cards, disabled and loading
preferences, saved-off restoration, no reset/replay on toggling, stale completions,
StrictMode/rerenders, ordered writes, late startup reads, native failures and
bilingual save-error/retry interaction. Early absent-module RED, missing switch/
positive-pulse RED and deferred-feedback RED logs are preserved under /tmp.

## Final verification

- Jest: 48 suites / 392 tests passed.
- Domain: 144 tests passed; domain code is unchanged.
- TypeScript and full ESLint passed without warnings after the affected fixes.
- Deck validation: 50 PNGs, complete 20-card sample/3-card alternate packs and
  58 interface strings per language.
- Theme/font validation: 3 themes, 11 faces, 108 required Czech/English glyphs.
- Final Android Metro export passed: /tmp/cards-haptics-final-android-export.
- Whitespace/diff review passed. No commit or push requested for this feature.

Logs: /tmp/cards-haptics-final-jest.log, /tmp/cards-haptics-final-domain.log,
/tmp/cards-haptics-final-lint.log, /tmp/cards-haptics-final-export.log,
/tmp/cards-haptics-deferred-red.log and /tmp/cards-haptics-deferred-green.log.
Initial integrated testing ran while the dependency was being installed; obsolete
virtual mocks caused positive haptic cases to miss the native double. Normal
installed-module mocks resolved that test-only collision; the final full run is
fully green. No remaining test failures are omitted.

## Phone review

Rebuild the Android development client once with `npm run android` from mobile,
then reload. Installing the JavaScript package/reloading alone does not add its
native module to an older development client; older clients remain usable but
cannot provide the new feedback. Expo Haptics supplies the Android VIBRATE
manifest permission through native manifest merging.

- Check a gentle pulse just after automatic and manual flips, with none while
  shuffling, waiting face down or confirming. Review strength and timing.
- Switch feedback off and draw, then restart and verify off persists. Switch on
  and confirm subsequent reveals pulse without restarting the drawing session.
- Background/resume and change tabs around reveal; confirm no delayed or duplicate
  pulse. Check both languages and larger text for the Settings switch and retry.
- Device capability and OS restrictions can suppress feedback. Mocked tests and
  Metro export do not establish native compilation or physical feedback quality.

Notifications and history remain separate upcoming features; neither is built
here. Slider repair remains deferred. User-owned Expo files/audit report retained.

## First phone feedback and diagnosis

The user reported the Settings switch appears but no feedback is felt. They
confirmed starting with `npm start --clear`, rather than rebuilding/installing
the native client. Local debug APK predates the new dependency. A native rebuild
and installation with `npm run android` is required before judging feedback
strength or runtime behavior. No physical feedback acceptance yet.

## Android build setup correction

The user's `npm run android` failed. The local Gradle daemon log contains the
actual cause: `SDK location not found`. Verified the installed SDK and added
ignored `mobile/android/local.properties` pointing at `/home/salmon/Android/Sdk`.
No shared configuration, dependencies or application behavior changed. The
independent build attempt could not start in this environment: cache access was
read-only, and the allowed retry failed obtaining a usable wildcard IP. Native
compilation/installation must still be verified by retrying in the host terminal.

### Java compiler correction after SDK fix

The next host build moved past SDK discovery and failed because the selected
`/usr/lib/jvm/java-25-openjdk` installation has no compiler. Android Studio's
`/usr/local/android-studio/jbr/bin/javac` exists and runs (25.0.3). Set
`org.gradle.java.home=/usr/local/android-studio/jbr` in the ignored local Android
Gradle properties. No system Java or shared configuration changes. Independent
Gradle retry still fails obtaining a usable wildcard IP before configuration;
host build and haptics acceptance remain unverified.

## Phone confirmation and refinement request

The user confirmed the rebuilt app works. Native availability is resolved by
host evidence; they consider the current reveal pulse too weak and suggest
using that gentle strength while shuffling, with stronger drawing feedback.
Per-packet landing cadence was then approved (“yes exactly”). Original Light
reveal strength is superseded by Heavy reveal feedback.

## Stronger reveal and packet feedback — implemented

Native adapter now maps reveal to Heavy and shuffle to the original Light impact.
Only accepted strip→contact and flip→reveal boundaries trigger feedback. Both
branches share preference/foreground guards and the controller's existing deferred
callback suppression. No continuous timer, extra switch, dependency or native
build change. Session ownership, randomness and animation timing remain unchanged.

Stronger reveal style and missing packet feedback were observed RED, then GREEN.
Affected verification: six Jest suites / 53 tests, TypeScript, scoped lint and
diff checks passed. Real-root regressions now cover deferred packet and reveal
completion for background and tab blur. Android export passed at
/tmp/cards-haptics-strength-android-export. Logs: /tmp/cards-haptics-strength-red.log,
/tmp/cards-haptics-strength-green.log, /tmp/cards-haptics-strength-lint.log and
/tmp/cards-haptics-strength-export.log. Earlier unchanged domain/full checks were
reused; no repeated full-suite run for this narrow refinement. Focused code review
found no material issues. No commit/push requested.

Reload the rebuilt client; no further native rebuild is needed for these changes.
Review Heavy reveal strength, Light packet cadence and switch-off behavior on
the phone. The user subsequently accepted physical strength/cadence on the phone
(“yes thats good”). Preserve this feedback baseline; exhaustive checklist coverage
is not implied.
