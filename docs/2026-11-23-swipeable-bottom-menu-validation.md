# Swipeable bottom menu — validation 2026-11-23

Implemented the [approved design](superpowers/specs/2026-11-23-swipeable-bottom-menu-design.md)
and [plan](superpowers/plans/2026-11-23-swipeable-bottom-menu.md) after the user's
phone feedback that the About me page looks good but menu labels are crowded.
The user selected horizontal scrolling instead of a More sheet and approved
implementation. No dependency, native rebuild, commit or push was required.

## Behavior

The themed floating pill keeps its icons, order, transparent surroundings and
measured safe-area clearance. A native horizontal ScrollView contains items with
natural label widths, one-line labels, at least 48 dp targets and a viewport width
cap for unusually long authored labels. Full accessibility names remain intact.
Fixed 14 dp decorative hint gutters avoid covering labels/targets. Hints indicate
left/right overflow only where content remains; all-fitting items distribute within
the viewport. Text still uses app and system scaling.

Swipes scroll the menu without selecting routes. Selection, native focus, external
route changes and geometry changes reveal the relevant destination with minimal
movement. Reduced motion avoids animated programmatic scrolls. Ordinary exploration
does not snap back. Fresh geometry generations discard stale item callbacks after
locale/font/size/width/route changes. Only dock items remount for fresh layouts;
the ScrollView, drawing session and native artwork surfaces remain mounted.

Tab press/long-press prevention, conditional History/Info, modal blocking and screen
clearance retain their existing behavior. Blocking disables native scrolling too.
A settling timeout releases the gesture guard if velocity is reported without
actual native momentum. App/background/system-overlay interruptions and a genuine
fresh touch release canceled native drags, without confusing normal responder
cancellation during scroll takeover with drag completion.

## Evidence

- Geometry tests observed missing-module RED, then GREEN: minimal first/last reveal,
  visible/oversized items, no-overflow, clamping/shrink and hint tolerance.
- Dock tests observed missing-scroll RED, then GREEN; final suite covers 12 cases
  for scrolling, hints, one-line bounds, selection/focus, reduced motion, route
  prevention/long press, blocking, drag/momentum, stale geometry, route removal,
  missing native momentum, superseded animation and interrupted drag recovery.
- Existing root integration covers drawing/session/clock retention through tabs,
  locale/theme/text-size changes, History/Info inclusion, details/results and
  measured dock consumption. Six affected suites / 64 tests passed before the
  final additional gesture/review regressions.
- Fresh reviewer found three P2 issues, reproduced RED then fixed GREEN: a second
  selection could leave an incompatible old animation active; Android cancellation
  could omit end-drag and retain a lock; release handling used a stale throttled
  offset instead of the final native contentOffset. No unresolved findings remain.
- Installed Android native source confirms scrollTo commands abort prior animation,
  and nonpaging horizontal views scroll focused children into view. This is source
  evidence, not phone acceptance. Native screen-reader focus still needs review.

Final checks after fixes:

- Full Jest: **60 suites / 498 tests passed**.
- Domain: **177 tests passed**, including three new scroll geometry cases.
- Strict TypeScript and full lint passed without warnings.
- Android Metro export passed: `/tmp/cards-swipe-dock-final-android-export`.
- `git diff --check` passed. Unchanged Info/deck/theme resource validation from the
  preceding Info implementation remains valid; no unrelated security work claimed.

Logs in `/tmp/`: `cards-swipe-final-jest.log`, `cards-swipe-final-domain.log`,
`cards-swipe-final-types.log`, `cards-swipe-final-lint.log`,
`cards-swipe-final-export.log`, `cards-swipe-review-red.log`,
`cards-swipe-review-green.log`, `cards-swipe-no-momentum-red.log`.

## Phone review pending

Reload the existing development client. Check swipe discovery/feel, first and last
items, four/five destinations, both languages, long custom labels, all themes and
larger app/system text. Verify edge hints, tap versus swipe, background/system-panel
interruptions, rapid selections and notification navigation. Check screen-reader
traversal to offscreen tabs and native focus scrolling, bottom content clearance,
and smooth return to the same active shuffle/reveal. Automated native layout
reports and mocks do not establish physical visuals, gestures or accessibility.

The deferred Settings text-size slider remains separate. Preserve all uncommitted
Info changes and user-owned local Expo/audit/Android configuration files.
