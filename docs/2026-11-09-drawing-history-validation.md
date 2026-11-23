# Drawing history — validation 2026-11-09

Implemented the [approved design](superpowers/specs/2026-11-09-drawing-history-design.md)
using the [implementation plan](superpowers/plans/2026-11-09-drawing-history.md).
No commit or push requested. Device acceptance is still pending.

## Delivered behavior

History is off initially. Settings enables an additional History destination
between Catalogue and Settings; turning it off removes that destination and
immediately stops recording, retaining saved data. Enabling captures only the
next new session, never the existing session or previously revealed cards. A
restored enabled preference is loaded before the app creates its initial session.
Read failures leave drawing usable without enrolling that already-running session
when storage later recovers.

The first accepted flip→reveal creates a record; successive reveals append once
in draw order, before confirmation and independently of haptic feedback/deferred
feedback suppression. Manual face-down waiting, queued draws and stale callbacks
do not create records. Stop/final results mark the record finished; abandoned or
disabled sessions remain partial. Empty sessions are absent. History browsing is
read-only and never resets or resumes the live drawing session.

The archive retains newest 50 sessions, at most 100 cards per session, for 30
elapsed days from first reveal. Loading, recording, foreground resume and bounded
open-app timers prune expiry. Current-session deletion/clear/expiry disables further
recording for that identity; future reveals cannot recreate it. Re-enabling after
off likewise waits for a fresh session identity.

The History list shows localized date/time, saved deck name, card count and
finished/partial/in-progress status. Select/Cancel and confirmed selected deletion
preserve other sessions; Settings confirms Clear history even while recording is
off. The list remains mounted while a saved reading uses the shared ordered
collection/details presentation. Native Back closes a card overlay before returning
to the list. Deleting the displayed reading safely unmounts it/releases dock locks.
Disabled direct History navigation returns to Draw without exposing the archive.

Complete Czech/English names, content, templates and artwork metadata are saved
with numeric IDs. Reading uses those snapshots rather than current-deck text.
Unavailable image references get the existing localized placeholder; saved text
still opens. Current theme/fonts apply without changing artwork proportions or
accepted animation timing. Four labels/targets and measured dock clearance are
covered at narrow widths with larger Czech text.

## Persistence and recovery

Existing Expo FileSystem async private I/O is used; no dependency or native config
change was added. A fully written temporary payload is renamed to a fresh committed
generation in the same private directory. The native Android implementation uses
renameTo for file URIs and throws if it cannot move. Once published, obsolete
committed files are cleaned up. Reading always picks the highest committed generation
and never falls back to an older archive that could contain deleted data. Pending
files are ignored; a failed publication leaves the previous committed file intact.
Cleanup failure surfaces as a save error, with the newest generation authoritative.

Archive mutation/writes are serialized and superseded pending writes are skipped.
In-flight work finishes before the newest state is written. A late startup read
cannot undo an explicit clear. Save/deletion failures remain visible with retry;
changes are optimistic in memory and the UI explicitly warns that unsaved deletions
may return after restart. Unknown/corrupt stored data is preserved and recording
is disabled until retry or confirmed Clear. No timestamp seeds/new random IDs:
records use the root session's existing secure identity.

## Review and regressions

Tests observed missing-feature RED then GREEN for archive/controller/storage and
recording/navigation integration. Additional RED→GREEN cases established that a
late startup read cannot undo Clear, and expiry continues beyond the first bounded
24-hour timer tick while the app remains open.

Independent scoped review found one important parser gap: the existing deck
validator can normalize legacy decks, while archive parsing returned the original
unnormalized snapshot. A legacy-shaped archive could therefore reach the reader
without its template/sections. The reproduction saw RED, then GREEN after explicitly
requiring schema-2 snapshots. Normal configured legacy packs remain supported by
the existing deck loader, which normalizes them before any session is created.

Review coverage suggestions were addressed with tests for native Back precedence,
disabled direct routing, deletion while an overlay is open, missing image assets,
large-text/Czech navigation, snapshot isolation and recovery eligibility. No
unresolved material findings or deferred review minors remain. Physical behavior
and performance checks remain distinct below.

## Final automated checks

- Full integrated Jest: 57 suites / 476 tests passed.
- A subsequent test-only hardware-Back callback typing correction and extra assertion
  that disabling a visited History tab leaves Settings visible passed its nine UI
  cases. No production change after the full run; reuse other valid results.
- All 144 domain tests passed; domain/session/randomness logic and the 100-card cap
  remain unchanged.
- TypeScript and full lint passed, no warnings. Initial full TypeScript caught the
  test-only Back event signature; corrected it to pass the real event shape.
- Deck validation passed: both packs, 50 local PNGs and 98 interface strings/locale.
- Theme/font validation passed: 3 themes, 11 faces, 110 required cs/en glyphs.
- Final Android Metro export passed: /tmp/cards-history-final-android-export.
- Diff/whitespace checks passed; local Android SDK/JDK settings remain intact.

Logs: /tmp/cards-history-final-jest.log, /tmp/cards-history-final-domain.log,
/tmp/cards-history-final-lint.log, /tmp/cards-history-final-export.log,
/tmp/cards-history-review-red.log, /tmp/cards-history-review-green.log,
/tmp/cards-history-load-red.log, /tmp/cards-history-expiry-red.log,
/tmp/cards-history-final-ui.log. Native measurement and listener doubles are
confined to tests; no production behavior was weakened for the harness.

## Phone review / next step

Reload the existing rebuilt development app. No new dependency/native rebuild is
required for History. To start: enable Save drawing history, return to Draw, end
the existing session with Stop if necessary, then choose New session. History
will not enroll the session that existed when the switch was enabled.

- Draw/reveal without confirming and verify an ordered in-progress record. Test
  automatic/manual reveal, multiple cards, Stop and final-card completion.
- Switch off/on mid-session: recording stops and resumes only after New session.
  Restart with History enabled: prior partial/finished sessions survive and the
  fresh live session is eligible without resetting from archive browsing.
- Read saved cards and return; verify full text, native image sizing, theme changes,
  card-overlay Back precedence and preservation of the live session.
- Select/delete/cancel and Clear while off; verify remaining sessions and no
  recreation of deleted current records. Check restart after successful saving.
- Inspect four tabs, scroll clearance, Czech/English, larger app/OS text, narrow
  screens, screen-reader labels/checkboxes and long session/deck names.
- Check real archive I/O and larger 100-card session performance; mock files,
  animation clocks and Metro exports do not establish phone performance or
  crash/power-loss behavior of the device filesystem.

The intermittent Catalogue blank-tile report remains separate and unreproduced
after reload. Notifications still need their own delivery acceptance. Slider
repair, security/release checks and 1,000-card decks remain deferred/outstanding.
