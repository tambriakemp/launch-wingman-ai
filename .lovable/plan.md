

## Redesign Storyboard to OpenArt-Style Single-Page Layout

### Overview

Restructure the AI Studio storyboard view from a vertically-scrolling list of all scenes to a single-page layout inspired by OpenArt, where settings live in a compact toolbar and scenes are viewed one at a time.

### Layout Changes

```text
+---------------------------------------------------------------+
| AI Studio    [Save] [Undo] [Redo]   Storyboard   [Download] |  <- Header
+---------------------------------------------------------------+
| 16:9 | Visual Style v | Character v | Settings v |            |  <- Settings Toolbar (dropdowns)
+---------------------------------------------------------------+
|                                                               |
|  +---------------------------+  +---------------------------+ |
|  |  Image Panel              |  |  Video Panel              | |
|  |  [generated image]        |  |  [generated video]        | |
|  |                           |  |                           | |
|  |  [Edit] [Upscale] [DL]   |> |  [Generate Video]         | |
|  +---------------------------+  +---------------------------+ |
|  Scene 3 of 15                  Script / Prompt below         |
|  [< Prev]  [Next >]                                          |
+---------------------------------------------------------------+
|              + Add Blank Shot                                 |
+---------------------------------------------------------------+
|  [Generate All Images]              [Generate All Videos]     |  <- Bottom Bar
+---------------------------------------------------------------+
```

### What Changes

**1. New Component: `StoryboardToolbar.tsx`**
- Horizontal bar below the header with dropdown popovers for:
  - **Aspect Ratio**: Click to show 16:9, 9:16, 1:1 options (like the OpenArt screenshot)
  - **Visual Style**: Shows outfit, hairstyle, makeup settings from the current "Look" card
  - **Character**: Shows the character reference / saved character selector
  - **Settings**: Shows vlog category, topic, camera movement, creation mode
- Each dropdown opens a popover panel with the relevant form fields (pulled from the current `StudioSetup.tsx` sections)
- Environment settings fold into the Visual Style or a separate dropdown

**2. Refactored `StudioStoryboard.tsx`**
- Remove the vertical scene list
- Show only ONE scene at a time with prev/next navigation
- Add a scene counter: "Scene 3 of 15"
- Arrow buttons (or keyboard left/right) to navigate between scenes
- The scene view shows Image (left) + Video (right) side by side, with script/prompt details below
- Keep all existing functionality: generate, upscale, regenerate, lock, select, download, prompt editing

**3. "Add Blank Shot" Button**
- Below the current scene, a button to append a new empty scene to the storyboard
- Creates a new `VlogStep` with empty prompts that the user can fill in
- Increments `step_number` and adds to `storyboard.steps` and `generatedMedia`

**4. Bottom Action Bar (optional, inspired by OpenArt)**
- Fixed bar at the bottom with "Generate All Images" and "Generate All Videos" batch buttons
- Replaces the floating batch toolbar that currently appears on selection

**5. Merge Setup + Storyboard Phases**
- The setup phase is no longer a separate full-page view
- When a storyboard exists, settings are accessible from the toolbar dropdowns
- The "Generate Character Preview" flow remains: user must still go through preview before first storyboard generation
- After storyboard is generated, users can tweak settings from the toolbar and regenerate individual scenes

### Files Changed

| File | Change |
|------|--------|
| `src/components/ai-studio/StoryboardToolbar.tsx` | **New** -- dropdown toolbar with Aspect Ratio, Visual Style, Character, Settings popovers |
| `src/components/ai-studio/StudioStoryboard.tsx` | Refactor to single-scene view with prev/next navigation, bottom action bar, "Add Blank Shot" |
| `src/components/ai-studio/SceneCard.tsx` | Simplify to work as a standalone full-width view (remove the 3-column layout, go to image left + video right with content below) |
| `src/pages/AIStudio.tsx` | Pass config + setConfig to StudioStoryboard so toolbar dropdowns can modify settings; add handler to append new blank scenes |
| `src/components/ai-studio/StudioSetup.tsx` | No structural changes -- still used for initial project setup before first storyboard generation |

### What Stays the Same

- All generation logic (queue processor, edge functions, identity gate)
- Save/load project functionality
- Image/video generation, upscale, regenerate, lock, prompt editing
- Character preview flow (setup -> preview -> storyboard)
- The setup phase for first-time configuration

### Technical Notes

- Scene navigation state: `const [currentSceneIndex, setCurrentSceneIndex] = useState(0)`
- Toolbar dropdowns use Radix `Popover` components for consistency
- Keyboard navigation: left/right arrow keys to switch scenes
- "Add Blank Shot" creates a step like: `{ step_number: N+1, step_name: "New Scene", a_roll: "", b_roll: "", close_up_details: "", camera_direction: "", image_prompt: "", video_prompt: "", script: "" }`
- Bottom bar shows scene generation progress: "5 of 15 images generated"
