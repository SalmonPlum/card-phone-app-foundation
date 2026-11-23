# Local drawing-session history

## Intent and scope

An optional, device-only archive of whole drawing sessions. Users can revisit
cards in their original order and delete unwanted sessions without losing others.
This is the third separate foundation feature, after haptics and daily reminders.
No account, cloud sync, export, journaling, historical-session continuation or
notification changes are included. Preserve accepted drawing/search/detail timing,
persistent artwork surfaces, native proportions and the current live session.

## Confirmed behavior

- Add a History switch in Settings. Enabling reveals a fourth bottom tab.
- History begins only with the next new drawing session after it is enabled.
  Do not record or backfill an already-running session. The user explicitly said
  they do not care about mid-session history and chose starting with a new session.
- Turning History off stops recording immediately and hides the tab. Existing
  records remain until expiry or explicit deletion. Turning it back on does not
  resume recording the interrupted session; wait for another new session.
- A record contains one drawing session with its cards in draw order. Append a
  card immediately when it finishes revealing, without waiting for confirmation.
  Manual face-down waiting cards and merely queued/selected cards are not saved.
- Keep incomplete sessions; they can be deleted individually or with other
  selected records. Confirm destructive actions. Clear history removes all saved
  sessions; selected deletion retains every unselected session.

## Approved defaults and precise lifecycle

These approved defaults resolve the earlier tentative retention limits and
routine behavior beyond the initial confirmed choices.

- Fresh History is off. Retain sessions whose first revealed card is within the
  last 30 elapsed days (30 × 24 hours), capped at the newest 50 sessions. The cap
  counts sessions, not cards. Do not silently discard cards inside a retained
  session; supported decks currently contain at most 100 cards.
- A new session means a new root session identity, including the app's fresh
  startup session when History was already enabled and restored. Enabling while
  a session already exists does not capture it, even if no cards were revealed.
  Show “History will start with your next session” when relevant. Enabling does
  not automatically reset the live drawing session.
- Snapshot recording eligibility at session creation after preference loading.
  If startup history loading fails, drawing remains usable with recording off;
  recovering storage does not retrospectively enroll the session created then.
- Create no record for an empty session. The first revealed card creates it;
  subsequent reveals append to that same record. Duplicate/stale callbacks cannot
  duplicate cards. History effects are independent from the haptics switch and
  from the flag suppressing feedback for deferred animation completions.
- Reaching results via Stop or final-card confirmation marks a recorded session
  finished, even if the user intentionally stopped before exhausting the deck.
  Unfinished sessions remain partial after a new session or process restart.
  Stopping recording partway through a session leaves a partial record.
- History is read-only browsing. Opening it does not draw, resume an archived
  session, alter randomness, reset the live session or change current card order.
- Deleting/clearing the current session's record suppresses recording for the rest
  of that session, so later reveals cannot recreate a record the user removed.
  The History switch remains enabled; the next new session can be recorded.
- Prune expired/over-limit sessions when loading, recording and resuming, and when
  their expiry is reached while the app remains open. An active session older than
  the retention cutoff must not resurrect its expired record. Keep deletion and
  expiry safe against pending writes, timers and late callbacks.

## History screen and Settings

Use the existing theme, font scaling, bilingual text and measured floating dock
patterns. With History off the dock remains the existing three destinations;
with it on add History between Catalogue and Settings. Four labels must remain
readable and all targets usable on narrow screens and large text, allowing dock
height to grow and reporting that height to screens.

The History tab lists newest sessions first, showing localized date/time, deck
name, card count and finished/partial state (with an active recording session
identified as in progress). A readable empty state explains that recording starts
with a new session. Choosing an entry opens its ordered cards and their complete
read-only details using the existing collection/detail presentation. Back returns
to the same history list. Do not add the live Results New session controls to an
archived reading. Archived text uses the current app language.

The list has a Select/Cancel mode and a Delete selected action, with a localized
confirmation identifying the number of sessions. Settings offers Clear history
and confirms removal of all saved sessions. Clearing is available even when
History is off. No records means no active delete action. Deletion/expiry during
archive viewing dismisses that archive and safely returns to the list; disabling
History while its route is active returns to Draw without resetting the session.
Direct navigation to disabled History must not expose the archived list.

## Data and persistence approach

The user selected device-only operation. Reuse the installed app-private file
storage rather than adding a database/native dependency for this bounded archive.
A database would add migration and installation work without a demonstrated need
for this first 50-session foundation. An in-memory archive would lose the user’s
history on restart and therefore does not meet the request. No network service.

Store versioned validated data with session ID, deck ID/version/name, first-reveal
and per-card reveal timestamps, completion state, and ordered numeric card IDs.
Snapshot complete Czech/English card names/content and the deck's detail template,
so later deck edits/removals cannot change the meaning of an old reading. Keep
image references/metadata to bundled assets, not copies of PNG bytes. Use existing
artwork when available; if an asset is no longer bundled after an app update,
show a localized placeholder while retaining readable saved text and card order.
Artwork may use the current selected theme; preserving old theme appearance is
not a requirement.

Serialize writes and use an atomic replacement strategy so a stale or interrupted
write cannot restore deleted records or overwrite newer choices. No timestamp
random seeds or new insecure IDs: use the live session's existing secure identity.
Timestamps are only for display/order/retention. Bound validation to the supported
50-session/100-card archive shape and retain complete supported bilingual content.

Storage failures must not interrupt drawing. Surface a localized save/load/delete
error with retry from Settings/History; do not claim deletion was saved if it
failed. Invalid/incompatible storage must not be silently overwritten: preserve
it, disable recording until recovery, and offer retry or explicit confirmed clear.
The exact internal schema, async file API, backup/recovery strategy and UI
component decomposition are left to the builder within these constraints.

## Verification and delivery

Add behavioral regressions for session-start eligibility (including startup
hydration and failure), immediate automatic/manual reveal recording, confirmation
independence, ordered partial/finished sessions, haptics independence, stale and
deferred callbacks, off/on boundaries, restart restoration, 30-day/50-session
limits, expiry while open/resume, selective/all deletion, late writes that must
not resurrect deleted/expired data, storage failures/retry and deck changes.

Exercise conditional four-tab navigation, archive browsing/details and returning,
Czech/English and large text, Settings clear confirmation and preserved live
session/image ownership. Run affected checks during implementation and one final
integrated app/domain/typecheck/lint/deck/theme/export check set after integration;
reuse unchanged evidence after scoped corrections. Review independently before
handoff. Device performance/accessibility and the four-tab layout need phone
review; mocked animation tests do not establish physical acceptance.

No new native dependency/rebuild is expected if existing file storage suffices;
reload the already rebuilt client for review. No commit/push requested. Preserve
user-owned local Expo/audit files and local Android SDK/JDK fixes. Leave the
intermittent Catalogue blank-tile report and deferred slider repair separate.

## Status

Approved for implementation by the user on 2026-11-09 (“You can start implementing
the history”), with the current 100-card limit and 1,000-card support deferred.

Builder check completed: independent reviewer reported “nothing important left.”
No further user decisions are required before reviewing this proposed design.

## Larger decks deferred

The user explicitly deferred larger-deck support after asking about 1,000 cards.
History implementation keeps the current supported 1–100-card deck boundary.
Track 1,000-card decks and their history storage/performance implications as a
separate later feature in current-status.md; do not expand this design's scope.

Implementation completed; automated checks and pending phone review are recorded
in [the validation report](../../2026-11-09-drawing-history-validation.md). No new
native dependency/build or commit/push.
