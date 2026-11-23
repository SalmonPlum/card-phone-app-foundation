# Drawing History Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline task by task.

**Goal:** Optional persistent session history, recording only newly started sessions, with ordered reading and confirmed selective/all deletion.

**Architecture:** A validated bounded archive and serialized controller live outside React; a provider owns lifecycle expiry and the session recorder. Existing collection/details render saved bilingual card snapshots under their saved artwork definitions. A conditional fourth tab and Settings controls expose the archive without replacing the live drawing session.

**Tech Stack:** Existing TypeScript, Expo FileSystem async I/O, React Native/Expo Router, Jest/RNTL. No new dependency.

**Spec:** [Approved History design](../specs/2026-11-09-drawing-history-design.md). User explicitly authorized implementation after deferring 1,000-card decks. Inline current checkout; no commit/push requested.

## Global Constraints

- Default off; enable only enrolls next new session. Off immediately stops; no backfill/resume of an old session.
- Append once at actual flip→reveal, independently of confirmation/haptics/deferred feedback suppression.
- Last30 elapsed days from first reveal, newest50 sessions, up to100 cards each. Complete numeric IDs/bilingual snapshots/template/artwork metadata; no PNG copies.
- Empty sessions absent; Stop/final results finished, abandoned/off records partial. Read-only archive never resets/draws/resumes the live session.
- Selected/all deletion confirmed; current-session deletion/expiry cannot resurrect on later callbacks/writes. Off retains stored records.
- Corrupt/incompatible data preserved with recovery UI; storage failures never interrupt drawing. Atomic publication/serialized writes and truthfully surfaced save/delete errors.
- Preserve accepted animations/identity, local Expo/audit/build fixes; larger decks/slider/Catalogue intermittency remain separate.

## Review Focus

- Startup restoration must precede enrolling a session, while read failure keeps drawing usable and prevents destructive overwrite.
- Disable/re-enable, clear/delete, expiry and delayed writes must not resurrect records or enroll an existing session.
- Snapshot content must survive deck updates and missing images without redirecting to current-deck text.
- History enabled/off routing, four-tab geometry, native Back and deletion during an open archive must preserve live sessions/overlay safety.
- Private-file publication must prefer newest committed generation, never fall back to an older deleted archive or treat partial pending files as saved.

### Task 1: Archive, storage and controller

**Files:** create mobile/src/history/{archive.ts,HistoryController.ts} and platform/historyStorage.ts with adjacent tests.
**Interfaces:** HistoryArchive {schemaVersion:1,enabled:boolean,sessions:HistorySession[]}; HistorySession holds sessionId,firstRevealedAt,finished,snapshot DeckManifest with only revealed cards, and ordered {cardId,revealedAt}[]; HistoryStorage read():Promise<string|null>,write(archive):Promise<void>. Controller exposes snapshot/subscribe/load, setEnabled, beginSession, transition, deleteSessions/clear/retry/prune.

- [x] RED: default/restore/corruption, new-session-only eligibility, reveal ordering/dedup/manual waiting/finished/partial, stale IDs, off/on, retention50/30days, snapshot isolation, late writes/delete/expiry and failure/retry.
- [x] Implement validation with existing deck/artwork contracts accepting historical asset keys even when no longer bundled; strict bounds and complete content.
- [x] RED storage tests: only committed generations read, interrupted/failed publication preserves latest saved data, cleanup cannot resurrect older records. Implement asynchronous temp write and fresh committed-generation rename, then cleanup obsolete files. No fallback to older archives.
- [x] Confirm core tests GREEN.

### Task 2: Recorder, Settings and conditional navigation

**Files:** create history/HistoryProvider.tsx and features/history/HistorySettings.tsx; modify SessionProvider/useSessionController, root layout, BottomDock, tabs layout; new history route; i18n/jest.setup.
**Interfaces:** provider exposes controller + ready/enabled/records/error/recordingSessionId; beginSession on accepted secure reset, transition on accepted state changes independent from haptics. Initialization waits for history loading to settle, including failed load.

- [x] RED real-controller/root cases: persisted-on startup, enable mid-session waits reset, immediate unconfirmed reveal, off/on no resume, no feedback coupling, clear/delete blocks further recording, four-tab/disabled route, cs/en and narrow/large font dock.
- [x] Implement provider/lifecycle expiry timer bounded to24h; resume prunes. Add default-off Settings switch, next-session explanation, error/retry and confirmed Clear even when off.
- [x] Preserve Settings/dock styling and measured clearance. Confirm affected tests GREEN.

### Task 3: Archive browsing and deletion

**Files:** features/history/HistoryScreen.tsx plus adjacent tests; wire route and existing CardCollectionScreen under saved ArtworkProvider.
**Interfaces:** newest-first session list with Select/Cancel/Delete selected; archived grid uses saved cards/template in draw order, no live Results actions; date/deck/count/status bilingual.

- [x] RED saved reading unaffected by deck mutation/missing assets, return/list, partial/finished entries, cancel/confirmed selective/all deletion, expiry/deletion while browsing, disable while viewing and live session preservation.
- [x] Implement accessible themed list/empty/loading/error states and root-safe Back behavior. Confirm affected tests GREEN.
- [x] One full integrated Jest/domain/typecheck/lint/deck/theme/font validation and Android export after integration. Rerun only affected checks after scoped fixes unless risk warrants more.
- [x] Independent scoped review, regressions for material findings, update status/design/validation. No commit/push; phone review of four tabs, persistence and image/performance/a11y remains separate.

## Execution ledger

- User approved starting implementation; 1,000-card expansion explicitly excluded. Existing feature checkout retained; unrelated accepted working changes preserved.
- Storage ruling: publish a freshly named committed generation after async temp writing; keep only newest after cleanup and never read an older backup on corruption. This avoids overwriting a live JSON file and cannot restore deleted data via fallback. Failed cleanup remains a save error, with newest generation authoritative.

## Completion record

Implemented inline, no commit/push. Controller/storage/recording/UI cases observed
RED→GREEN, including delayed-load clear and expiry beyond the first24h tick.
Independent review's legacy snapshot reader-shape finding reproduced RED then
passed after requiring schema2 snapshots. Added Back/disabled-route/open-overlay
deletion/missing-artwork/large-Czech-dock and snapshot-isolation coverage.
Full57 suites476 tests,144 domain,TypeScript/full lint/deck/theme/font validation
and Android export passed. A final test-only Back event type/Settings assertion
correction passed9 UI cases with no production change; remaining checks reused.
No material findings or deferred minors. Export /tmp/cards-history-final-android-export.
Native filesystem behavior, four-tab appearance/performance and accessibility
require phone review; see ../../2026-11-09-drawing-history-validation.md.
