

## Rewrite "Map your offer stack" task

The task page becomes a lightweight **bridge** to the standalone Offers Library, mirroring how other Launch Tasks use a completion checklist before the "Save & mark complete" button.

### What the user will see on `/projects/:id/tasks/planning_offer_stack`

1. **Header** (unchanged) — Phase eyebrow, "Map your offer stack" title, why-it-matters, time chip.
2. **Funnel context banner** (unchanged) — "Your selected path: …" with the funnel diagram dialog.
3. **Primary CTA card** (new) — A prominent panel:
   - Title: *"Build your offers in the Offer Library"*
   - Body: *"Your offers live in one place across this project. Open the library to add, edit, or reorder them — they'll appear here automatically."*
   - Button: **Open Offer Library →** (navigates to `/projects/:id/offer`).
4. **"Offers in your stack" list** (new) — Shows offers already saved for this project's funnel:
   - Each row: drag handle (visual only), colored type pill (Lead magnet / Tripwire / Core / etc.), title, format · price line, green check if configured, chevron (clicking opens that offer in the standalone library).
   - Counter at top: *"X / Y configured"*.
   - Empty state: *"No offers yet. Open the library to add your first one."* with the same CTA.
   - Guarantees at least one offer row is rendered when one exists in the database (current project already has Lead magnet + Tripwire shown in screenshot).
5. **"This step is complete when:" checklist** (new — matches `TaskDetail.tsx` pattern):
   - ☐ I've added at least one offer to my stack
   - ☐ Each offer has a clear title and price
   - ☐ My offer stack reflects my chosen funnel path
   - First item auto-checks when ≥1 configured offer exists; the others are user-checked.
   - Helper text below: *"Check off all items above before saving and marking complete."*
   - When all checked → green confirmation: *"You're ready to save and continue!"*
6. **Save & mark complete button** — Disabled until all checklist items are checked. On click: marks `planning_offer_stack` complete via `completeTask()` and navigates back to the dashboard.

### What's removed

- Inline `OfferStackBuilder` component (the editing UI moves entirely to the standalone Offers Library).
- The old "X / Y offers configured" footer counter (now lives in the offers list section).
- Auto-save plumbing on this page (offers save in the library; this page only reads them).

### Technical notes

- Edit `src/pages/project/OfferSnapshotTask.tsx`:
  - Remove `OfferStackBuilder` import + usage and the `setOffers` / `saveOffersToDb` / `performSave` flow.
  - Keep the existing `existingOffers` query (scoped to project + funnel type) — use it read-only to render the list.
  - Add local `completedCriteria: string[]` state, with `completionCriteria` defined inline (3 items above). Auto-include the "added at least one offer" item when `existingOffers.length >= 1`.
  - Replace the footer with the `EditorialTaskShell` `footer` slot containing the checklist + completion button (matching the styling used in `TaskDetail.tsx` lines 1561–1642 — `editorial-eyebrow`, terracotta checkbox, moss confirmation card, ink-900 pill button).
  - "Open Offer Library" button uses `navigate(`/projects/${projectId}/offer`)`.
  - List rows reuse the type colors from `OFFER_TYPES` in `src/components/offers/offerTypes.ts` so the pills match the standalone library exactly.
- No DB / schema changes. No changes to `OffersLibrary.tsx`, `OfferEditorPanel.tsx`, or `taskTemplates.ts`.

### Files to edit

- `src/pages/project/OfferSnapshotTask.tsx` (significant rewrite of the body + footer; header + funnel banner kept)

