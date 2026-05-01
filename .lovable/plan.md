## Habit Tracker Layout Fixes

Two visual issues on `/habits` (HabitGrid component).

### 1. Move % and actions menu to the front (left) of each row

Today the row order is:
`[Habit name + streak] [31 day cells] [% + ⋯ menu]`

The trailing `% + ⋯` column gets pushed off-screen on narrow viewports and feels disconnected from the habit it describes.

**Change:** Move the completion `%` and the `⋯` actions dropdown into the left "title" column, next to the habit name and streak. New row order:

`[● Habit name / category · 🔥streak · 0% · ⋯] [31 day cells]`

- Widen the title column from `w-[200px]` to `w-[260px]` to fit the extra content.
- Remove the trailing `w-[70px]` cell from both the header row and each habit row.
- Header spacer column also widens to `w-[260px]`.
- Layout inside the title cell: colored dot, name + category (flex-1, truncate), streak chip, `%` text, `⋯` menu button.

### 2. Card background doesn't stretch to the end

The grid is wrapped in `<div className="min-w-[600px] rounded-xl border border-border bg-card">`. `min-w` only enforces a floor — on wide viewports the inner content (title col + 31 × 32px day cells + rate col ≈ 1262px) defines the width, but on narrower-but-still-wide viewports (e.g. 1008px preview shown in screenshot 2) the card stops at content width while the page area extends further, leaving cream background visible on the right.

**Change:** Make the card stretch to the full width of its overflow container so the white surface reaches the right edge of the scroll area:

- Add `w-max` (or equivalently `inline-block min-w-full`) so the card's bordered surface always covers at least the available width AND the content width. With horizontal overflow, the card will extend to whichever is larger.
- Concretely: change wrapper to `min-w-full w-max rounded-xl border border-border bg-card`. This guarantees the white background spans either the full visible area (when content is narrow) or the full content (when scrolling horizontally).

### Files touched

- `src/components/habits/HabitGrid.tsx` — only file changed. Reorder columns in the header and each row, drop the trailing rate/menu column, widen the title column, and update the wrapper width classes.

No other components, data, or styles need changes.
