
## Clean Up AI Studio Header and Toolbar Layout

### Problem
1. The header starts higher on the page than other pages (uses `py-3` vs the standard `py-8` top spacing)
2. Two separate rows (action buttons + settings toolbar) look cluttered and redundant

### Solution

**1. Increase header top padding to match other pages**
- Change the header's inner padding from `py-3 px-6` to `py-6 px-6` so the icon/title sits at the same vertical position as other standardized pages

**2. Merge action buttons and settings toolbar into one unified row**
- Remove the second `border-t` row inside the sticky header (lines 615-637) that contains Projects, Save, Script, All, Help, New
- Move those action buttons into the `StoryboardToolbar` component, placing them after the Settings popover with a vertical divider separator
- This collapses two rows into one clean toolbar row below the header

### Layout After Changes

```text
+----------------------------------------------------------+
|  [icon] AI Studio                          [queue status] |  <- header with proper padding
|         Create AI-powered video content...                |
+----------------------------------------------------------+
| 9:16 16:9 1:1 | Character | Env | Look | Settings | | Projects Save ? New |  <- single toolbar
+----------------------------------------------------------+
| [main content area]                                       |
```

### Files to Modify

- **`src/pages/AIStudio.tsx`**: Increase header padding, remove the second action-buttons row, pass action handlers as props to StoryboardToolbar
- **`src/components/ai-studio/StoryboardToolbar.tsx`**: Accept new action button props, render them after Settings with a vertical divider separator

### Technical Details

**AIStudio.tsx changes:**
- Header padding: `py-3` to `py-6`
- Delete lines 615-637 (the entire second row div with Projects/Save/Script/All/Help/New)
- Pass new props to StoryboardToolbar: `onProjects`, `onSave`, `onDownloadScript`, `onDownloadAll`, `onHelp`, `onNew`, `isSaving`, `hasStoryboard`

**StoryboardToolbar.tsx changes:**
- Add new optional props for the action callbacks
- After the Settings `ToolbarButton`, add a `Separator` (vertical line) and render small ghost/outline buttons for Projects, Save, Script (if storyboard), All (if storyboard), Help (?), and New
- These use the same `text-xs` button styling as the existing toolbar items for visual consistency
