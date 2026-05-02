## Restore horizontal scrolling Week view + compact all-day cards

Switch the Week board back to a horizontally scrolling 61-day window (30 days back, today, 30 days forward), keeping the editorial design from the current grid intact. Also tighten the all-day cards so they don't grow vertically.

### 1. `src/pages/Planner.tsx`
- Replace `weekDays` (length 7) with a 61-day window: `Array.from({length: 61}, (_, i) => addDays(startOfDay(anchorDate), i - 30))`.
- Keep prev/next behavior: shifting by 7 days re-anchors and re-centers the scroller on `anchorDate` via a `scrollToTodayNonce`-style counter passed to the board view (so it scrolls the new anchor column into view).
- "Today" button: set `anchorDate = startOfDay(new Date())` and bump the nonce.
- Header label logic stays as-is (Week N · Month Year, italic range from `weekStart`/`weekEnd`).
- Remove the `PlannerWeekRail` from the board layout (it was tied to the 7-day frame and won't fit alongside a wide scroller). Board view becomes full width.

### 2. `src/components/planner/PlannerWeekBoardView.tsx`
- Continue accepting `days: Date[]`, but render as a single horizontally scrolling row instead of `grid-cols-7`:
  - Container: `flex gap-3 overflow-x-auto p-6 md:p-8` with momentum scrolling.
  - Each day column: fixed width (`w-[260px] shrink-0`), same card styling as today (paper-100, hairline border, today/weekend variants, italic Fraunces date number, source-colored task cards, "+ Add" button).
- Add a `scrollToAnchorNonce` prop and a `useLayoutEffect` that scrolls the column matching `days[Math.floor(days.length/2)]` (today/anchor) into view (centered) whenever the nonce changes or on first mount.
- Keep DnD, source pills, hover, all existing visuals.

### 3. Compact all-day cards
- In the task card render, keep all-day cards visually identical in height to timed cards. Today the layout is a 3-row `grid gap-1.5` (time row → title → source pill). For all-day:
  - Collapse the layout: render the "All day" label inline on the same row as the title (not as its own row), so the card is the same height as a timed card without a long description.
  - Specifically: condense to two rows — top row `[All day pill] [checkbox]`, second row `[title] [source pill]` inline — or keep the same 3-row structure but force `min-height` parity and tighter `py-1.5` padding for all-day variants.
- Result: all-day cards are not vertically taller than 1-line timed cards.

## Out of scope
- Month and List views unchanged.
- No DB or schema changes.
- The `PlannerWeekRail` is removed from this view; can be re-introduced later if requested.

## Technical notes
- Use the existing `startOfDay`, `addDays` imports.
- `scrollToAnchorNonce`: `const [scrollNonce, setScrollNonce] = useState(0)`, increment on Today/prev/next clicks, pass to `PlannerWeekBoardView`.
- Inside the board, find the anchor column by matching `format(day, "yyyy-MM-dd") === format(anchorDate, "yyyy-MM-dd")` via a ref map, then `el.scrollIntoView({ inline: "center", block: "nearest" })`.
