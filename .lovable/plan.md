

## AI Studio Dashboard with Two Cards

### Overview
Create a new dashboard page at `/app/ai-studio` that shows two cards — **Storyboard Creator** and **Avatar Outfit Swap**. Move the current AI Studio storyboard workspace to `/app/ai-studio/create`. Remove Outfit Swap from the sidebar.

### Changes

**1. Create `src/pages/AIStudioDashboard.tsx`**
- Page with `ProjectLayout`, header ("AI Studio" title + subtitle)
- 2-column grid with two cards:
  - **Storyboard Creator** (Film icon) — "Generate storyboards, scenes, and talking-head videos" → links to `/app/ai-studio/create`
  - **Avatar Outfit Swap** (Shirt icon) — "Swap clothing on your character using a reference photo" → links to `/app/ai-studio/outfit-swap`
- Each card: icon, title, short description, hover effect, clickable → navigates via `useNavigate`

**2. Update `src/App.tsx`**
- Import `AIStudioDashboard`
- Change `/app/ai-studio` route to render `AIStudioDashboard`
- Add new route `/app/ai-studio/create` → existing `AIStudio` component

**3. Update `src/components/layout/ProjectSidebar.tsx`**
- Remove the `outfit-swap` menu item (line 96)

**4. Update `src/pages/AIStudio.tsx`**
- Add a back button/link at the top to navigate back to `/app/ai-studio`

### Files
- **Create**: `src/pages/AIStudioDashboard.tsx`
- **Modify**: `src/App.tsx`, `src/components/layout/ProjectSidebar.tsx`, `src/pages/AIStudio.tsx`

