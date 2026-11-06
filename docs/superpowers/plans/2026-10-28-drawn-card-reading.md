# Drawn-card reading implementation plan

> Execute inline, using targeted regressions and one final scoped review. User explicitly requested this next; do not ask again about the existing tap-confirm preference. Preserve prior features/user files; no commits/push requested.

**Goal:** Swipe up from the large held drawn card to read its information, with reversible shrinking and safe card-tap confirmation.

**Spec:** `../specs/2026-10-28-drawn-card-reading-design.md`.

## Interfaces and scope

- `revealReading.ts`: `DrawReadingState={key:string;offset:number}`, `drawReadingKey(state:SessionState):string` (session and current/last drawn ID, including zero), `drawReadingPose(target:Pose,offset:number,reducedMotion:boolean):Pose` using shared detail collapse math with unchanged initial pose.
- `fitDrawForeground(host,captionHeight,headerHeight=0)` keeps legacy reference geometry at default0; with measured header it fits a full foreground face below the name, above hints, without cropping.
- `useShuffleAnimation(...,reading?:SharedValue<DrawReadingState>)` resets reading key/offset only when card/session changes, in the same UI publication job as phase/frame/progress. Queue-only DRAW or pause never resets reading position.
- `DrawRevealReader.tsx`: fixed name, one Animated.ScrollView with a translated static artwork header/hit target, hints and shared detail sections below the initial viewport. Shared native offset drives pinned translation; guarded root reading state drives face and band. Touch-drag guard and explicit accessibility activation. No image inside this component.
- `ShuffleScene.tsx`: owns shared reading state, measured title/hints and live confirmation token guard; mounts the reader across foreground phases and keys its non-image scroll view by card/session. The selected Stack stays under its existing parent.
- `Stack.tsx`: apply reading pose only in reveal/resume, then existing exit rise/opacity. No shuffle path or clock changes.
- Add one Czech/English swipe hint; remove obsolete face/name-only documentation. No domain/session mutation or dependency changes.

## Task 1: Safe inline reader and persistent artwork

- [x] Observe behavioral RED for missing swipe prompt/info after reveal and native face shrinking/restoration; ensure flip still hides content.
- [x] Implement geometry and shared reading publication, inline reader, guarded card confirmation and frozen-pose exit. Keep large initial face and full artwork; information starts below the first viewport.
- [x] Regress scroll vs tap, text taps, deliberate card tap after drag, accessibility activation, stale callbacks, new card/session reset, same image identity, pause/locale round trips, reduced motion and collapsed confirmation/final exit.
- [x] Run affected draw/navigation/results/session checks, pure geometry/motion tests, dictionary validation, TypeScript/scoped lint and Android export. Broaden only for actual failures/new shared behavior risks.
- [x] Review the scoped feature once, fix substantive findings with regressions, and record exact checks/choices/phone limitations in Markdown. Preserve animation-polish backlog and future template/reveal/palette plans.

Implemented in the working tree. Automated checks and one scoped review are complete; physical phone acceptance remains pending. See [verification](../../2026-10-28-drawn-card-reading-validation.md).
