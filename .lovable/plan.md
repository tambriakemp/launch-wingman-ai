

## Fix: Flyout Pushes Content + Project Selector Visible

### Root Cause
The sidebar renders only `fixed`-position elements (rail + flyout). Fixed elements don't participate in document flow, so the main content's `md:ml-14` margin only accounts for the rail. The flyout overlaps because nothing pushes the content over. The project selector IS rendered in the flyout but gets hidden behind the page content due to z-index/overlap issues.

### Solution: Spacer div pattern
Wrap the desktop sidebar output in a non-fixed "spacer" div that changes width based on whether the flyout is open. This div participates in flex flow and naturally pushes the main content over. The fixed rail and flyout render inside it visually but the spacer ensures the layout reserves the right amount of space.

### Changes

**`src/components/layout/ProjectSidebar.tsx`** (desktop section only):

1. Wrap the entire desktop return in a `div` spacer with a dynamic width class:
   - Flyout closed: `w-14` (56px, rail only)
   - Flyout open: `w-[264px]` (56px rail + 208px flyout)
   - Add `transition-all duration-200` for smooth push animation
   - This div is `hidden md:block shrink-0` so it only affects desktop layout

2. Remove the backdrop overlay div entirely (no more dimming overlay since content pushes over, not covered)

3. Remove the outside-click `useEffect` for closing the flyout — instead, the flyout stays open until the user clicks a different rail icon or navigates. Navigation already closes it via `handleDesktopNav`.

4. Keep the flyout `fixed` positioned so it doesn't scroll with page content, but the spacer ensures content is pushed over.

**`src/components/layout/ProjectLayout.tsx`**:

1. Remove `md:ml-14` from the main content div — the spacer div now handles horizontal spacing via flex layout. The content div just needs `flex-1 flex flex-col min-w-0 relative`.

### Result
- Flyout opens: content smoothly slides right by 208px
- Flyout closes: content slides back
- Project selector at top of flyout is fully visible and accessible
- No overlay/backdrop needed since content is never covered

### Files modified
- `src/components/layout/ProjectSidebar.tsx`
- `src/components/layout/ProjectLayout.tsx`

