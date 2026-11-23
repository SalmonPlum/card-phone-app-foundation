# Drawing haptics

## Scope

First of three separate device-only features: drawing haptics, daily reminder,
then session history. This design covers haptics only. No notification or history
implementation, slider repair, animation retiming or session behavior changes.

## Approved behavior

- Add a Haptic feedback switch to Settings with complete Czech/English strings.
- Default on; persist the choice locally independently of themes and other settings.
- Emit one stronger Heavy haptic when a card finishes its flip and enters the existing
  revealed/reading phase, in automatic and manual reveal modes alike.
- Emit one Light haptic (the original reveal strength) when each shuffle packet
  lands, at the accepted strip-to-contact boundary. No continuous rumble.
- Do not pulse for other shuffle motion, queued draws, face-down waiting, confirmation,
  screen navigation, re-renders or returning from the background to an old reveal.
- Prevent duplicate pulses for the same session/card. Background events do not
  cause delayed feedback on resume. Preference hydration must not replay a reveal.
- If disabled, emit no feedback. Unsupported hardware or native feedback failure
  must not interrupt drawing. Respect device capabilities and OS restrictions.
- Preserve current animation timing, image surfaces and session identity.

## Approaches

Use Expo Haptics for a short native impact through a small platform adapter.
A generic vibration API offers less consistent gentle feedback across platforms.
Expo Haptics is the recommended implementation choice; a server has no role here.
No new shared settings abstraction or unrelated restructuring is needed.

## Integration and verification

Use the existing persistent-settings pattern, including hydration and recoverable
save errors. Keep native side effects outside the framework-free domain reducer.
Connect feedback to accepted reveal/packet-contact transitions, guarded by session identity
and foreground state. Use an Expo-compatible dependency and rebuild the development
client for physical testing if required.

Target regressions at distinct Heavy reveal / Light packet feedback, manual waiting, disabled/loading
preferences, lifecycle boundaries, duplicate/stale callbacks and native failure.
Run affected settings/session tests, TypeScript and lint; inspect the Settings
control and feedback strength on a phone. No claim of physical haptic acceptance
from mocked tests.

## Status

Approved by the user on 2026-11-09 (“Yes, lets do it”). Device-only scope,
separate delivery, reveal timing and default-on switch are approved.

## Approved refinement

After native rebuild, the user confirmed feedback works but reveal strength is
too weak. They approved (“yes exactly”) stronger reveal feedback plus the current
gentle strength at each packet landing under the same switch. Heavy is the
implementation choice for the stronger impact; phone strength acceptance remains
required. Continuous rumbling was considered; packet-synchronized pulses were
chosen for their connection to the visible shuffle motion.
