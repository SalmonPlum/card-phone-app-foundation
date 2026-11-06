# Independent app text size: implementation and verification

## Latest native outcome: unresolved and deferred

The user rejected the latest slider drag behavior on the phone (“Not good”) and
explicitly requested fixing it later to avoid spending more time now. Slider
interaction remains unaccepted; pause investigation and implementation until the
user resumes it. Passing synthetic gesture tests and reviews below do not
establish native usability. The remaining native cause has not been verified.
Preserve the working tree; no revert or additional commit/push was requested.

## Dragging correction after native feedback

The user accepted the slider's appearance but found dragging non-continuous.
The prior implementation only rendered the saved stop position and changed all
app fonts at every crossed stop. Tests reproduced the visible jump (thumb left
178dp instead of 134dp for an intermediate finger position), premature preference
writes, move-target coordinate errors and stale commits after track resizing.

The thumb/fill now follow a continuous local fraction during horizontal movement.
Global typography and saving change only on release at the nearest existing stop,
so text reflow cannot move Settings during the drag. Tap and screen-reader
adjustments retain their direct selection behavior. Movement uses a cached track
page origin and thumb grab offset. Cancellation, width changes and external
preference changes restore the selected stop without saving a stale preview.

Four regressions observed RED→GREEN. Ten slider tests passed; retained passing
Settings/router integration results bring affected coverage to **3 suites / 44
tests**. TypeScript and scoped lint passed. No provider, typography, startup,
storage or resource changes were made, so unchanged checks below were reused.
Independent scoped review approved with no findings. Native responder arbitration, drag feel and
per-frame performance still require phone review; synthetic move events do not
establish them.

## Slider refinement after phone feedback

The user requested a slider with small-to-big icons instead of the three option
words. Settings now uses small/large A-shaped decorative icons and a three-stop
slider, retaining the same 90%/100%/115% values and preference storage. Track taps
and horizontal drags snap to the closest stop and clamp at the ends; repeated
movement within a stop does not trigger duplicate size writes. A 48dp touch
track exposes one localized adjustable control with increment/decrement actions.
Vertical movement does not select a size and termination may yield to a parent
before a horizontal drag is claimed.

Six focused slider tests and the affected Settings/navigation suites pass:
**3 suites / 40 tests**, including prop restoration, localized actions, touch
bounds, drag deduplication and unchanged live scaling/theme/save retry behavior.
TypeScript and scoped ESLint pass. This presentation change leaves the previously
verified provider, typography and startup code unchanged, so their checks below
were not repeated. Independent scoped review approved with no findings. Actual native responder
arbitration, dragging feel and icon appearance still need phone acceptance.

The original implementation evidence below describes the earlier three-button
presentation where applicable; the slider supersedes that control layout.

The user authorized implementing the proposed sizes for phone comparison.
Small is 90%, Standard is 100%, and Large is 115%. All rendered app text changes,
including navigation, controls, Settings, card names, reading, startup/recovery
and image-error placeholders. Text embedded in fixed artwork remains artwork;
decorative icon geometry stays unchanged.

## Implementation

- A dedicated provider owns the size ID and saves it to `app-text-size.txt` via
  the existing private FileSystem mechanism. No new dependencies or theme schema.
- Missing/invalid/unreadable values use Standard. Explicit choices invalidate
  late reads; serialized writes and revision guards prevent stale outcomes from
  replacing the current selection or error state. Saving failures retain the
  live preference and offer an independent localized retry.
- Shared resolved typography scales font size, tracking and safe line height
  once; line height rounds upward. OS scaling remains enabled and is applied by
  native Text. Theme changes retain the size setting and optical calibration.
- Root startup waits for size restoration alongside fonts/theme within the
  existing 15-second deadline. Retry invalidates earlier reads; system-font
  recovery retains current size and ignores late restoration without a write.
  Preparation/recovery content scrolls when enlarged copy exceeds the viewport,
  and stays centered when it fits. Recovery buttons retain 48dp minimum targets.
- Settings has a Font size / Velikost písma group after Language. Three-way
  controls stack at effective app × OS scale >=1.15; binary groups use >=1.3.
  Narrow screens stack as before. Targets remain at least 48dp and labels wrap.
- Existing measured headers/menu heights and scroll-end padding remain
  authoritative. Tests retain session and reading identity across size changes.

## Verification

Preference suites observed RED for absent modules, then passed 13 tests covering
storage, remount restoration, read/write races, save retry and startup invalidation.
Typography tests observed RED for missing scaling, then passed exact numeric
scaling and actual-font safety checks for all theme/role/size combinations.
Three startup regressions observed RED, then GREEN for restored sizing before
mount, scaled loading/recovery copy, bounded stalled reads and old-read rejection.
Settings/integration tests observed RED for missing controls, then GREEN for
localized selection, live scaling, save retry, theme independence and reading
retention.

Integrated final checks:

- Full Jest: **36 suites / 293 tests passed**.
- Domain: **118 tests passed**.
- TypeScript and full ESLint passed.
- Deck validation: 13 offline PNGs, complete bilingual deck content and
  53 interface translation keys per locale passed.
- Theme validation: three themes, 11 offline static font faces,
  checksum/license/registry checks and 107 required glyphs per face passed.
- Initial Android Metro export passed to `/tmp/cards-text-size-android-export`.
- Application/document diff checks passed.

Independent final review found one material issue: startup recovery was not
scrollable, making actions potentially unreachable with Large + large OS text
on a short screen. A new regression observed RED for the missing scroll
viewport, then GREEN after adding it. Post-fix startup/navigation/layout checks
passed **3 suites / 40 tests**, TypeScript and scoped lint passed, and the final
Android export passed to `/tmp/cards-text-size-recovery-android-export`. Together
with the unchanged passing suites, verification covers **36 suites / 294 tests**.
No unresolved review findings remain. No second full suite was run after this
isolated recovery-container fix, per the verification agreement.

Native visual, touch, text-measurement, restart and performance acceptance require
phone evidence; mocked layout fixtures verify consumption of measured dock/header
bounds and presence of a scroll responder, not actual native text fitting.

## Phone review

Try all three sizes and themes in English/Czech. Check menus/buttons, the size
controls themselves, both detail readers, long names/paragraphs, image errors,
startup/recovery messages and final content scrolling clear of the floating dock.
Combine Large with larger OS text. Restart after changing size and verify it is
restored; change theme and ensure size, draw session and reading position remain.
The three percentages are provisional until the user compares them in person.

## Saved follow-ups

- Expand the testing deck to at least 20 cards for theme-aware artwork/search.
- Rounded card corners consistently across Catalogue and other surfaces.

These requests are recorded only; this feature does not implement them.
