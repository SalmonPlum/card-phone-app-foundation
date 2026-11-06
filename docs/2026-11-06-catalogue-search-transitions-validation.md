# Catalogue search transitions — validation 2026-11-06

Implemented the approved individual fades and smooth grid rearrangement. Search
behavior was already accepted on the phone; this transition still awaits phone
review. No commit, push, dependency installation or native rebuild requested.

## Result

- Removed and returning cards fade over 300ms. Retained cards glide over 450ms
  with eased movement; artwork and caption move together.
- Native FlatList row identity and virtualization remain. Unchanged rows move
  as a unit; cards remounting under different rows start from measured previous
  global coordinates. Offscreen/unmeasured cards fade without invented origins.
- The input remains mounted/responsive. Mounted tile snapshots wait at most
  32ms; later queries invalidate old callbacks. Missing snapshots fall back to a
  fade. Leaving cards cannot receive touches or accessibility focus.
- Reduced/unknown motion applies results immediately. Cancellation settles
  active native timing at its destination on its next frame. Motion state is
  published synchronously on the UI runtime before the new result set commits.
- Taps/return measurements use the existing safe detail fade while geometry may
  be moving. The conservative 650ms interval covers a 200ms start-eligibility
  window plus a possible 450ms native animation, including cancellation.
- Changing the filter token invalidates pending tile touches so they cannot
  block a subsequent fresh tap. Existing keyboard, filter-generation and detail
  ownership tests remain green. Theme/size/layout/focus changes invalidate
  pending snapshots; unrelated rendering does not start a search entry effect.

## Verification

Before the slower-timing refinement, the final full Jest run: **41 suites / 342 tests passed**. TypeScript, full ESLint,
affected final lint checks, Android Metro export and whitespace/diff checks
passed. Domain/deck/theme/font validation results from the preceding search
implementation remain applicable: this refinement changes none of those files.

Lifecycle and geometry regressions observed RED then GREEN, including safe
selection geometry, rapid edits, missing callbacks, cancellation boundaries and
cross-row starting positions. Integration exposed an old touch blocking a new
tap after filtering; a focused regression reproduced it before request cleanup.

One independent scoped review found active native timing did not stop when
motion was cancelled. Its frame-level regression observed RED then GREEN after
checking the shared cancellation state on every frame. The review also identified
native publication ordering as uncertain; synchronous UI publication now precedes
the React snapshot commit, with a RED/GREEN ordering regression. No unresolved
material review findings remain.

Evidence logs: `/tmp/cards-motion-post-review-jest.log`,
`/tmp/cards-motion-post-review-lint.log`,
`/tmp/cards-motion-post-review-export.log`,
`/tmp/cards-motion-filter-touch-red.log`,
`/tmp/cards-motion-cancel-red.log`, `/tmp/cards-motion-publish-red.log`.
Final export: `/tmp/cards-search-motion-final-android-export`.

## Phone review

- Type gradually, type quickly and clear search. Review fading and gliding,
  including cards moving from the right column into the left and between rows.
- Filter after deep scrolling; check blank-result recovery and returning cards.
- Tap a retained/moving result with the keyboard visible, close details and
  confirm filtered return. Rapidly edit, change tabs and background/resume.
- Review all themes and app/OS text sizes, one/two columns, rotation, captions,
  dock clearance and clipping/shadows during movement.
- Enable reduced motion, including during a transition; check immediate settling
  and spoken focus without access to disappearing cards.

Mocked native timing and Metro export do not establish native smoothness,
clipping, accessibility or performance acceptance. Slider repair stays deferred.

## Slower timing refinement

The user liked the animation treatment but found it too fast. Fades were changed
from 150ms to 250ms and movement from 200ms to 350ms. The start-eligibility window
remains 200ms; source-geometry protection extends to 550ms to cover the longer
movement. Shared timing constants keep animation and protection durations aligned.
The existing boundary regression observed RED at 401ms, then GREEN with protection
lasting through 550ms. All four affected suites / 31 tests, TypeScript, scoped
ESLint and diff checks passed. No full-suite or export repeat was needed for this
timing-only adjustment. Review the slower feel on the phone after reloading.
Logs: `/tmp/cards-search-slower-red.log`, `/tmp/cards-search-slower-green.log`.

The user then requested one further small slowdown. Current fades are 300ms and
movement is 450ms, with the same 200ms eligibility and a 650ms geometry-protection
window. The boundary regression observed RED at551ms then GREEN; all four affected
suites/31 tests, TypeScript, scoped lint and diff checks passed again. Phone feel
awaits review. Logs: `/tmp/cards-search-slower-again-red.log` and
`/tmp/cards-search-slower-again-green.log`.

The user subsequently reviewed the 300ms/450ms timings on the phone and said
“Perfect.” This is acceptance of transition feel; exhaustive native keyboard,
accessibility and performance checks remain separate.
