# Compact Draw-tab results controls

User selected the top-right option on 2026-11-23 (“yes use right top”).

- Empty results show only a compact, content-width Draw cards button; hide New
  session when no cards were drawn. Keep the empty message and card count.
- Nonempty results place a visible circular restart icon at the top right of the
  existing results header, beside the count. Keep the accessible New session name.
  The header remains in the existing results scroll viewport, with wrapped count
  text and a 48 dp icon target. Do not add reset to active drawing.
- Reuse existing reset/retry behavior, error visibility, draw order, secure entropy,
  session identity, details/artwork and animation guards. Preserve the empty-state
  Draw cards reset and recovery after entropy failure.
- Top-right was selected over a bottom floating action that could cover cards and
  compete with navigation. Per-app text/icon configuration stays backlogged.
- Target only changed results controls and affected reset/retry integration, plus
  scoped lint/types. No full suite, export or unrelated validation. No commit/push.

Implementation: add a bundled native restart drawing to IconButton; make the
results header a count-plus-icon row and make the empty action self-sized. Phone
review checks compact appearance, top-right placement and larger-text wrapping.

## Approved icon refinement

The top-right New session button uses overlapping cards with a small restart arrow,
replacing its initial standalone restart arrow. Preserve the circular button and
translated accessibility label. The empty Draw cards button is unaffected.
