# Card details: fixed title and scroll-responsive artwork

Status: implemented in the working tree after the user explicitly requested continuing this feature; targeted checks passed, phone review pending. Use [the scoped implementation plan](../plans/2026-10-28-card-detail-scroll.md); preserve the drawing animation as-is.

## User request

- Put the card name at the top of details and keep it permanently visible while reading.
- Make more screen space available for the written meaning and description.
- Initially show the card face large. As the user scrolls down, smoothly shrink the face so more text fits on screen.
- As the user scrolls back to the top, smoothly restore the large face.

## Interpretation to carry forward

Apply the shared behavior to Catalogue and drawn-results details. Keep the fixed name above the artwork/text region. Artwork shrinking should reclaim actual layout space for text, rather than merely shrinking pixels inside an unchanged tall container. Preserve full artwork proportions, complete Czech/English text, system font scaling, Close/Android Back, continuous source-tile opening/return and persistent native image surfaces.

The drawing reveal remains face/name only and does not gain meaning/description scrolling. Direct-link card details should be reviewed for consistency when planning this feature.

## Implementation and phone tuning

The name and Close/Back share a fixed measured header. The face shrinks 1:1 with downward scroll to a thumbnail capped at approximately 112dp (or half its expanded height), and restores at the top. The same native face samples its collapsed rectangle on Close and returns directly to its source tile without resetting scroll first. No new gestures are requested. Reduced motion should preserve readable layout without requiring continuous animation. Avoid scroll/layout feedback that jumps text or changes the card identity.

Use targeted tests for changed scroll/layout behavior and affected overlay/lifecycle integrations. Native scrolling, text readability and animation quality require phone review.

Implementation choices: fixed measured name/Close-or-Back header, scroll-linked pinned artwork shrinking to approximately 112dp high (or half its expanded height on constrained hosts), and one native scroll view reclaiming space as the artwork band shrinks. The same persistent overlay face closes directly from its collapsed pose. Reduced motion uses a compact face from entry. These sizing choices remain open to phone tuning.

Checks and remaining phone validation are recorded in [the implementation report](../../2026-10-28-card-detail-scroll-validation.md). Reduced motion, including an unresolved native preference on direct links, starts compact without continuous size animation.
