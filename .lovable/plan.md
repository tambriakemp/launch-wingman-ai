

## Convert Create Schedule Dialog to Slide-Out Sheet

### Summary
Replace the `Dialog` wrapper in `PlannerTaskDialog.tsx` with a `Sheet` (slide-out panel from the right), keeping all form fields and logic identical.

### Changes — single file: `src/components/planner/PlannerTaskDialog.tsx`

**1. Swap imports**
- Remove: `Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle`
- Add: `Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter` from `@/components/ui/sheet`

**2. Replace JSX wrappers** (lines ~270-529)
- `<Dialog>` → `<Sheet>`
- `<DialogContent className="sm:max-w-[480px] ...">` → `<SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0">`
- `<DialogHeader>` → `<SheetHeader>`
- `<DialogTitle>` → `<SheetTitle>`
- `<DialogFooter>` → `<SheetFooter>`
- Remove explicit close X button (SheetContent already includes one)

All form fields, state, submit logic, recurrence UI, and unschedule button remain unchanged — only the container component changes from a centered modal to a right-side slide-out panel.

