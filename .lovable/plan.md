

## Remove Scrollbar from Sidebar Navigation

### Problem
Both the admin and user sidebars use `overflow-y-auto` on the nav element, which shows a visible scrollbar that disrupts the clean design.

### Solution
Replace `overflow-y-auto` with `overflow-y-auto scrollbar-hide` using a custom CSS utility that hides the scrollbar while preserving scroll functionality. The nav will still scroll on overflow (via touch/trackpad/mousewheel) but without the visible scrollbar.

### Changes

1. **`src/index.css`** — Add a `.scrollbar-hide` utility class that uses webkit and Firefox CSS to hide the scrollbar.

2. **`src/components/layout/AdminSidebar.tsx`** — Change `overflow-y-auto` to `overflow-y-auto scrollbar-hide` on the nav element (line 124).

3. **`src/components/layout/ProjectSidebar.tsx`** — Same change on its nav element (line 144).

