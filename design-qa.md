# Design QA

## References

- Source: `/Users/jackd/.codex/visualizations/2026/08/01/019fbd1b-8b9d-7400-bf2d-e9b29daff5d0/follow-up/script-detail-reference.png`
- Implementation: `/Users/jackd/.codex/visualizations/2026/08/01/019fbd1b-8b9d-7400-bf2d-e9b29daff5d0/follow-up/script-detail-local-post-fix.png`
- Side-by-side comparison: `/Users/jackd/.codex/visualizations/2026/08/01/019fbd1b-8b9d-7400-bf2d-e9b29daff5d0/follow-up/script-detail-comparison.png`
- Empty-project verification: `/Users/jackd/.codex/visualizations/2026/08/01/019fbd1b-8b9d-7400-bf2d-e9b29daff5d0/follow-up/script-empty-state-local.png`
- Connected-content verification: `/Users/jackd/.codex/visualizations/2026/08/01/019fbd1b-8b9d-7400-bf2d-e9b29daff5d0/follow-up/script-connected-content-local.png`

Both source and implementation detail screenshots were captured at a 1512 x 760 CSS viewport in Chrome. The implementation reported a device-pixel ratio of 2; the captured PNG is 1512 x 760 pixels. The comparison image is 3024 x 760 pixels.

## Final comparison

The implementation preserves the reference shell, top-bar height, sidebar proportion, tab rhythm, summary-card hierarchy, and content density. Script data differs deliberately because the implementation screenshot uses the safe demo workspace rather than the signed-in production workspace.

The requested controls now measure exactly the same: `Edit` and `+ New project` are both 110 x 38 CSS pixels. `Edit` has a white background, a 1px `rgb(17, 17, 17)` border, black text, and no wrapping.

All native `.form-select` controls share the same 14 x 14 Lucide chevron asset, positioned 10px from the right edge and vertically centred. The icon comes from the installed Lucide library.

The empty-project wrapper has no background, border, or shadow. Its text and two actions are centred at the exact horizontal and vertical midpoint of the available content area.

## Iteration history

1. Initial comparison found the shared ghost-button rule overriding the Edit border and found the fixed width wrapping `+ New project`.
2. Increased both controls to 110px, added `white-space: nowrap`, and raised the Edit selector specificity so the white/black treatment wins.
3. Connected-content review found inherited link underlining on `View content`; the link now explicitly removes text decoration.
4. Recaptured the detail view and remeasured both top-bar controls after the fixes.

## Interaction QA

- Normal-tab Novas Flow handoff created a ScriptAI script from a realistic content payload and returned the new opaque script ID to the opener.
- The created script retained the source title, platforms, brief, hook, script, caption, CTA, notes, and references, then exposed `View content`.
- Accent colour updated the app-wide primary tokens immediately and persisted.
- Autosave-off exposed an explicit `Save changes` action; clicking it persisted and returned `Saved` feedback.
- Empty-project Create and Import actions remained available after removing the wrapper card.
- No warning or error console entries were present during the final detail-view check.

## Remaining differences

None requiring a visual fix. Dynamic script names, blocks, status, dates, and project counts differ because the source and implementation use different safe datasets.
