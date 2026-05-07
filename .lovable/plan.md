## Smart default slot + All Day section

### Behavior
- On first render of `/habits`, auto-select the slot matching the user's local time:
  - 5:00–11:59 → Morning
  - 12:00–16:59 → Afternoon
  - 17:00–23:59 → Evening
  - 0:00–4:59 → Morning (or keep last)
- User can still tap any slot to override (no auto-switching after manual change).
- When the active slot is Morning / Afternoon / Evening, render two sections in the habit list:
  1. **{Slot name}** — habits whose `time_of_day` includes that slot
  2. **All day** — habits with empty `time_of_day` or that include `all_day`
- When active slot is **All Day**, behave as today (single list, no extra section).
- Empty-state copy adjusts: if both the slot section and all-day section are empty, show "No habits in this slot."; if only the slot section is empty, still show the All Day section with a small muted "Nothing scheduled for {slot}" note above it.

### Files
- `src/pages/HabitTracker.tsx`
  - Add `getCurrentSlot()` helper using `new Date().getHours()`.
  - Initialize `activeSlot` state with `useState<HabitSlot>(() => getCurrentSlot())`.
  - Split `visibleHabits` into `slotHabits` and `allDayHabits` memos.
  - Render two grouped sections with small section headers (`text-xs font-medium text-muted-foreground uppercase tracking-wide px-1`) when `activeSlot !== "all_day"`.

No schema, API, or other component changes.
