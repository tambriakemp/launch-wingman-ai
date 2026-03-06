

# Fix: Planner crashes due to missing MobileSidebarProvider

## Problem
The Planner page (`src/pages/Planner.tsx`) directly renders `<ProjectSidebar />` and wraps content in its own layout. But `ProjectSidebar` requires `MobileSidebarProvider` context, which is provided by `ProjectLayout`. Every other page uses `ProjectLayout` — Planner bypasses it.

## Fix
Refactor `src/pages/Planner.tsx` to use `ProjectLayout` instead of manually rendering `ProjectSidebar` and its own layout wrapper.

### Changes:
- Remove the `<ProjectSidebar />` import and usage
- Remove the manual `<div className="flex min-h-screen">` wrapper
- Import and use `<ProjectLayout>` to wrap the page content
- Keep all internal Planner logic (tabs, search, dialog) unchanged

### File to modify:
- `src/pages/Planner.tsx` — swap `ProjectSidebar` for `ProjectLayout`

