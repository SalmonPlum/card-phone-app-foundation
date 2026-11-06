# Reveal mode implementation plan

> Execute inline using executing-plans. Authorization already supplied; no commits/push requested.

**Goal:** Save Automatic / Tap to flip in Settings and wait for intentional reveal in manual mode.
**Architecture:** A separate root preference provider uses existing private FileSystem storage. DRAW snapshots mode; awaitingReveal and token-guarded REVEAL own manual waiting. Existing persistent Stack and reader handle back-only waiting before normal flip/reading.
**Tech:** Expo/React Native, TypeScript, Reanimated, existing FileSystem, Jest and Node.
**Spec:** ../specs/2026-10-28-reveal-mode-design.md

## Constraints and review focus

Preserve numeric IDs, secure entropy, offline assets, bilingual content, session identity, native image parent and current timings. No dependency changes or locale-file migration. Check queued-draw mode changes, delayed preference hydration/writes, same-touch flip/confirmation, stale session/epoch input, and pause/new-session boundaries.

## Task 1: Preference and domain flow

- [x] RED: manual lift enters untimed waiting; only matching REVEAL flips, automatic unchanged, queued mode is retained, stale/reset/duplicate actions ignored.
- [x] Add RevealMode, optional state snapshot for fixture compatibility, DRAW mode and guarded REVEAL event; maintain invariants and zero-duration waiting.
- [x] Add separate RevealModeProvider/storage with loading gate, immediate choices, serialized persistence, late-read protection and retry tests.
- [x] Wire provider to controller and accessible Settings choices, preserving language and palette.

## Task 2: Persistent manual reveal UI

- [x] RED: waiting shows only back/flip prompt; tap flips without confirming, fixed target/cover/image survive waiting, reading works afterward.
- [x] Extend existing Stack/frame/scene/reader to support waiting, guarded action and name/detail hiding.
- [x] Verify affected suites and lifecycle/stale/rapid-tap boundaries; run type/lint/deck checks and final Android export once.
- [x] One scoped review, resolve substantive findings, update status/verification Markdown with pending phone checks.

## Execution record

Implemented inline. RED observed: manual domain tests advanced directly to flip; UI tests lacked Flip card and Settings choices; provider/storage tests had missing modules. GREEN evidence is in [verification](../../2026-10-28-reveal-mode-validation.md). One focused independent review found no substantive issues. No commit or push. Phone acceptance pending.

Ruling: Automatic is the compatibility default and a draw snapshots mode at accepted DRAW, including queued draws — prevents Settings changes unexpectedly revealing a waiting card. Initial preference loading gates user draws without delaying session creation; read failure falls back to Automatic. Preferences use a separate file, avoiding migration of language storage. Original language/reveal documents are marked historical where their placeholder scope is superseded.
