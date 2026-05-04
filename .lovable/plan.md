## Goal

Bring all modals/dialogs across the app in line with the new Assessments "editorial native" design system (warm paper, ink, terracotta accents, Fraunces display headings, soft rounded shells, mobile sheet behavior with safe-area chrome and haptics).

We'll do this primarily by upgrading the **shared shadcn primitives** (`Dialog`, `AlertDialog`) so all 79+ consumer components inherit the new look automatically — no need to touch each modal file individually.

## What changes

### 1. New shared modal shell — `src/components/ui/dialog.tsx`

Rebuild `DialogContent` / `DialogHeader` / `DialogFooter` / `DialogTitle` / `DialogDescription` / `DialogBody` to mirror Assessment surfaces:

- **Overlay**: warm ink wash `rgba(31,27,23,0.55)` + 8px blur (matches the assessments backdrop, not the current 3px blur).
- **Content shell**:
  - Background `--paper-100` (`#FBF7F1`).
  - Border: hairline `rgba(31,27,23,0.10)` instead of the heavy ink-900 1px stroke.
  - Corners: soft `20px` radius (assessments use `18–24px`), not the current sharp `4px`.
  - Shadow: assessment-style `0 24px 60px -20px rgba(31,27,23,0.35)`.
  - Max-width `560px`; on mobile (`<640px`) snaps to a **bottom sheet** with rounded top corners, full-width, safe-area-aware bottom padding, drag-affordance pill, slides up from bottom (`data-[state=open]:slide-in-from-bottom`).
- **Close button**: small circular paper-200 button with terracotta hover, top-right with safe-area offset on mobile.
- **Header**:
  - Background paper (no separate paper-200 bar).
  - Optional `eyebrow` rendered as small uppercase **terracotta** mono label with `№ 0X ·` stamp (already supported — kept).
  - Title uses `font-display` (Fraunces) at `26px` desktop / `22px` mobile, weight 400, `-0.02em` tracking, with optional italic terracotta accent word (new prop `italicWord`, mirrors `LargeMobileTitle`).
  - Description: Fraunces italic 15px ink-60 (kept).
  - Bottom hairline divider only when a body follows.
- **Body**: `px-7 py-6` desktop, `px-5 py-5` mobile, paper background.
- **Footer**: paper background, hairline top, right-aligned actions; on mobile becomes a sticky bottom bar with safe-area bottom padding, full-width primary button.
- **Haptics**: fire `useHaptics().light()` on open and `selection()` on close (mobile/native only).

### 2. Same upgrade for `src/components/ui/alert-dialog.tsx`

Mirror the changes above so destructive confirmations (incl. `DeleteConfirmDialog`, `DeleteConfirmationDialog`) match. Keep the typed-DELETE input styling but skin its `Input` to the editorial paper field.

### 3. Mobile-sheet behavior

Add a `useIsMobile()` branch in `DialogContent` (and `AlertDialogContent`) that swaps positioning classes:

```text
desktop:  centered, 560px, 20px radius, scale-in
mobile :  bottom-anchored, 100% width, top-radius 24px, slide-in-from-bottom,
          max-height 92vh, internal scroll, safe-area bottom padding,
          1px drag handle bar at top
```

This makes every existing dialog feel like a native iOS sheet on phones without the consumers changing.

### 4. Token alignment

Add a small set of CSS vars (or reuse existing) so the dialog uses the same palette as `assessments/tokens.ts`:

- `--paper-100` `#FBF7F1`, `--paper-200` `#F7F1E8`
- `--ink-900` `#1F1B17`, `--fg-secondary` `rgba(31,27,23,0.62)`
- `--terracotta-500` `#C65A3E`, `--border-hairline` `rgba(31,27,23,0.10)`

Verify these already exist in `src/index.css`; if any are missing we add them (non-breaking — additive).

### 5. Spot-fix one custom modal as proof

`src/components/dashboard/StuckHelpDialog.tsx` (the modal in the screenshot) is rebuilt on top of the new primitive: add `eyebrow="Stuck Help"`, italic accent on "blocking", switch the inner reassurance/step cards to paper-200 + terracotta accent + Fraunces, and convert action buttons to the assessment `PrimaryButton` style (ink pill primary, ghost secondary).

### 6. Out of scope

- We do **not** rewrite each of the 79 dialogs individually. They'll inherit the new shell automatically. If a specific modal (e.g. `TaskDialog`, `LaunchCalendarEventDialog`) needs further editorial polish, that can happen in a follow-up.
- `Sheet` / `Drawer` / `Popover` primitives are not touched in this pass.

## Files to change

- `src/components/ui/dialog.tsx` — rewrite shell, add mobile sheet branch, add italicWord on title, integrate haptics.
- `src/components/ui/alert-dialog.tsx` — mirror shell + mobile sheet.
- `src/components/dashboard/StuckHelpDialog.tsx` — re-skin to new pattern as the canonical example.
- `src/index.css` — add any missing paper/ink/terracotta CSS vars (only if not already defined).

## Acceptance

- The "What's blocking you right now?" modal matches the Assessments visual language (warm paper, Fraunces title with italic terracotta accent, eyebrow stamp, soft 20px corners, ink primary pill button).
- Opening any other dialog (e.g. Project Settings, Habit, Task, Delete confirmation) on desktop shows the same paper/ink shell; on mobile it slides up as a bottom sheet with safe-area padding.
- No consumer files break — all existing `<DialogHeader>`, `<DialogTitle>`, `<DialogFooter>` calls keep working.