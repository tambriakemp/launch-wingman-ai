

## Create "Generate" Dropdown & Reorganize Toolbar

### Summary
Move "Generate All Images", "Generate All Videos", and "Generate Reel" (renamed from "Create Reel") into a single "Generate" dropdown button. Place it on the top toolbar row alongside Create, Save, and the ellipsis menu. Remove the batch actions row's generate/reel buttons.

### New toolbar order (left to right)
```text
[Create]  [Generate ▾]  [⋯]  [Save]  ———  [Projects]
```

- **Generate ▾** dropdown contains:
  - Generate All Images
  - Generate All Videos
  - Generate Reel (replaces "Create Reel")
  - View Reel (if reel exists)
  - Download Reel (if reel exists)

### Changes

**`src/components/ai-studio/StoryboardToolbar.tsx`**
1. Add new props: `onGenerateAllImages`, `onGenerateAllVideos`, `onCreateReel`, `onViewReel`, `onDownloadReel`, `isMergingVideos`, `mergedReelUrl`, `videoCount`, `anyGeneratingVideo`.
2. Add a "Generate" `DropdownMenu` button after the Create button (only shown when `hasStoryboard`).
3. Reorder: Create, Generate dropdown, ellipsis menu, Save — then Projects on the right.

**`src/pages/AIStudio.tsx`**
1. Extract the inline "Generate All Images" and "Generate All Videos" logic into named handler functions.
2. Pass those handlers plus reel-related handlers/state as new props to `StoryboardToolbar`.
3. Remove the batch actions row's generate buttons and reel dropdown (lines ~936-989). Keep only the "Storyboard · N scenes" label.

### Technical details
- Use the existing `DropdownMenu` component.
- The Generate dropdown trigger uses a `Sparkles` or `Zap` icon with "Generate" label and a `ChevronDown`.
- Reel menu items inside the Generate dropdown use the same conditional logic currently in the standalone Reel dropdown (show View/Download only when `mergedReelUrl` exists, show button only when 2+ videos exist).

