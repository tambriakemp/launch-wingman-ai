

## Fix Flyout Sidebar Issues

### Problem 1: Flyout overlapping content
The transparent backdrop overlay has no visual tint, so users can't tell the flyout is a modal layer. Add a subtle semi-transparent background to the backdrop so it dims the content behind the flyout.

**Change in `ProjectSidebar.tsx`**: On the backdrop div (line 432), add `bg-black/10` to the className so users see a slight dim effect.

### Problem 2: Flyout not full height
The flyout uses `h-screen` but may be clipped by parent stacking contexts. The issue is likely the `hidden md:flex` classes — the flyout div starts as `hidden` and only shows at `md:`. Change to ensure the height is computed correctly by using `h-dvh` (dynamic viewport height) instead of `h-screen`, and also apply it to the rail.

**Change in `ProjectSidebar.tsx`**:
- Rail (line 366): `h-screen` → `h-dvh`
- Flyout (line 448): `h-screen` → `h-dvh`

### Problem 3: Project switcher should be pinned above all sections
Currently the ProjectSelector only appears when the "Launch" section flyout is open. Move it to a permanent position at the top of the icon rail area (below the logo) so it's always accessible regardless of which section is active.

**Changes in `ProjectSidebar.tsx`**:
- Remove `showProjectSelector` from the Launch section definition
- Remove the project selector block from inside the flyout (lines 458-462)
- Add a compact project selector below the logo in the rail. Since the rail is only 56px wide, render a small clickable avatar/icon that opens the ProjectSelector in a Popover. Alternatively, move it to the top of the flyout panel as a persistent element that shows regardless of which section is open — render it above the section header in the flyout, always visible when any flyout is open.

**Recommended approach**: Place the ProjectSelector at the top of every flyout panel (above the section label), making it persistent whenever the flyout is open. This keeps it accessible without cluttering the narrow rail.

- In the flyout panel (after line 449, before the section header), add the ProjectSelector in a `px-3 py-2 border-b border-sidebar-border` div — unconditionally, not gated by `showProjectSelector`.
- Remove the conditional `showProjectSelector` block (lines 458-462).
- Remove `showProjectSelector: true` from the Launch section definition.

### Files modified
- `src/components/layout/ProjectSidebar.tsx` — all three fixes

