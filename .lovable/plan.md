## Comparison: reference HTML vs. current `MobileAddHabitDrawer.tsx`

I extracted the visible content + structure from `Add_Habit_Bottom_Drawer.html` and walked it against the current JSX. The structure matches well — same sections in the same order, same labels, same italic helper, same "I noticed" callout, same in-flow Add button. A few small things are off and worth fixing in the same pass as the corner-radius bug.

### Findings

| Reference | Current JSX | Status |
|---|---|---|
| Drawer top is rounded (sits a bit below the status bar) | `height: 100vh` makes drawer flush to top, hiding `rounded-t-[10px]` | **Bug — fix** |
| Top edge has visible drag handle | Vaul renders it but it sits on cream bg, low contrast | Minor — bump opacity |
| Header: Cancel · *New habit* · Save | ✓ Matches | OK |
| Habit input card with terracotta border + glow + italic helper | ✓ Matches | OK |
| WHEN section: Time / Cadence / Reminder rows | ✓ Matches | OK |
| Time labels include `Morning / All day / Evening / Anytime` | ✓ Matches | OK |
| Reminder shows `7:30pm` formatted | ✓ Matches (`formatTime12`) | OK |
| PAIR WITH: After → habit name | ✓ Matches | OK |
| TAG: small dot + tag name + "Change" | ✓ Matches | OK |
| "I noticed" copy is specific ("…you almost always log dinner, so the walk has a built-in cue") | Generic ("…you almost always remember the first one") | Minor copy tweak |
| Add button is in-flow at the bottom of the drawer | ✓ Matches (just fixed) | OK |
| Default new-habit time = Evening | ✓ Matches | OK |

### Plan

1. **Fix top corners (primary bug).**
   - Change `MobileAddHabitDrawer` `DrawerContent` from `height: 100vh / maxHeight: 100vh` to `maxHeight: 92vh` (matches the project's other drawer at `h-[90vh]`). This restores the visible curve and leaves space for the drag handle.
   - Add `className="rounded-t-[24px]"` to `DrawerContent` so the curve reads as editorial (the base `rounded-t-[10px]` is too subtle for this design).
   - Add `overflow-hidden` on the inner `.hb-theme` container so the cream background doesn't square off the corners.

2. **Drag handle polish.** In `MobileAddHabitDrawer` only, nudge the handle: render a thin custom handle inside the drawer at the top with `width: 36px; height: 4px; bg: rgba(31,27,23,0.18); margin: 8px auto 0`. Hide vaul's default handle for this drawer (it's already auto-rendered, so we can leave it and just adjust spacing — pick the simpler of the two when implementing).

3. **AI nudge copy.** Update the fallback text to reference the paired habit by name and the "built-in cue" framing from the reference, e.g. *"Pairing this with "{pairName}" is smart — you almost always do {pairName}, so this gets a built-in cue."*

4. **No structural changes** to sections, fields, icons, picker bodies, footer button, or the ManageTags entry point — they already match the reference.

### Files to edit

- `src/components/habits/mobile/MobileAddHabitDrawer.tsx` — height/radius/overflow on `DrawerContent`, drag-handle tweak, copy update.

No DB, hook, or schema changes.
