

## Redesign AI Studio to Single-Page Layout

### Overview

Transform the AI Studio from a 3-phase flow (Setup -> Preview -> Storyboard) into a single-page layout where all configuration lives in dropdown tabs at the top and the scene workspace is always visible below -- matching the OpenArt reference screenshots.

### New Layout

```text
+---------------------------------------------------------------+
| AI Studio        [Save] [New Project]   [Script] [Download]   |  <- Header
+---------------------------------------------------------------+
| 16:9 | Character v | Environment v | Look v | Settings v      |  <- Toolbar Tabs
+---------------------------------------------------------------+
|                                                                |
|  [Generate Character Preview]  or  [Preview Image]             |  <- Preview bar (inline)
|                                                                |
|  +---------------------------+  +---------------------------+  |
|  |  Image Panel              |  |  Video Panel              |  |
|  |  [generated image]        |  |  [generated video]        |  |
|  |  [Edit] [Upscale] [DL]   |  |  [Generate Video]         |  |
|  +---------------------------+  +---------------------------+  |
|  Scene 3 of 15   [< Prev] [Next >]                            |
|                                                                |
|  [Script / Prompts collapsed below]                            |
+---------------------------------------------------------------+
|              + Add Blank Shot                                  |
+---------------------------------------------------------------+
| [Generate Storyboard]  [Generate All Images]  [Gen All Videos] |  <- Bottom Bar
+---------------------------------------------------------------+
```

### What Changes

**1. Enhanced `StoryboardToolbar.tsx`**
Add two new dropdown tabs to the existing toolbar:
- **Character**: Contains `SavedCharacter` component + `UploadZone` for selfie (everything from the Character card in StudioSetup)
- **Environment**: Contains `SavedEnvironments` component (everything from the Environment card in StudioSetup)
- **Look** (rename current "Visual Style"): Keeps outfit, hairstyle, makeup, skin, nails + adds `SavedLooks`, exact match toggle, UGC product upload, and marketing goal fields
- **Settings** (existing): Keeps creation mode, vlog category, topic, camera movement, script options, safety terms checkbox

**2. Refactored `AIStudio.tsx`**
- Remove the `appPhase` state machine (`setup` / `preview` / `storyboard`)
- Always render the toolbar + scene workspace
- Add an inline preview section: if no character preview exists yet, show a "Generate Character Preview" button; once generated, show a small thumbnail of the preview
- "Generate Storyboard" button moves to the bottom action bar (enabled only after preview exists)
- The `StudioSetup.tsx` component is no longer rendered as a separate page
- The `StudioPreview.tsx` component is replaced by inline preview display

**3. Inline Character Preview**
- Between the toolbar and the scene card, show a compact preview bar:
  - Before preview: "Upload a character photo and generate preview to start" with a button
  - After preview: Small thumbnail(s) of the character/final look preview with a "Regenerate Preview" option
- This replaces the full-page `StudioPreview` component

**4. Scene Workspace (always visible)**
- When no storyboard exists yet, the scene area shows a placeholder: "Generate a storyboard to start creating scenes"
- When a storyboard exists, shows the current single-scene view with prev/next navigation (same as current `StudioStoryboard`)
- "Add Blank Shot" remains below the scene

**5. Bottom Action Bar**
- Always visible (fixed at bottom)
- Shows contextually relevant actions:
  - "Generate Storyboard" (when no storyboard exists, requires preview)
  - "Generate All Images" + "Generate All Videos" (when storyboard exists)
- Saved Projects button/grid moves to a dialog accessible from the header

**6. Saved Projects**
- Move from the StudioSetup page to a dialog/drawer triggered by a "Load Project" button in the header
- Same `SavedProjectsGrid` component, just wrapped in a Dialog

### Files Changed

| File | Change |
|------|--------|
| `src/components/ai-studio/StoryboardToolbar.tsx` | Add Character, Environment dropdown tabs; expand Look tab with SavedLooks + product upload; expand Settings with creation mode, safety terms |
| `src/pages/AIStudio.tsx` | Remove `appPhase` state machine; always render toolbar + scene workspace; add inline preview bar; move "Generate Storyboard" to bottom bar; wrap saved projects in dialog |
| `src/components/ai-studio/StudioStoryboard.tsx` | Extract scene display into reusable section (remove its own toolbar since parent now handles it); simplify to just scene card + navigation + add blank shot |
| `src/components/ai-studio/StudioSetup.tsx` | No longer rendered -- all its content moves into toolbar dropdowns |
| `src/components/ai-studio/StudioPreview.tsx` | No longer rendered -- replaced by inline preview bar in AIStudio |

### What Stays the Same

- All generation logic (queue processor, edge functions, identity gate)
- Save/load project functionality (just moved to a dialog)
- Image/video generation, upscale, regenerate, lock, prompt editing
- Character preview generation flow (still required before storyboard)
- SceneCard component internals
- SavedCharacter, SavedEnvironments, SavedLooks, UploadZone components (reused inside toolbar dropdowns)

### Technical Notes

- The toolbar popover for Character and Environment will need wider panels (`w-96` or larger) to fit the upload zones and saved items
- Character tab passes `referenceImage`, `setReferenceImage`, `setReferenceImages` props
- Environment tab passes `environmentImage`, `setEnvironmentImage`, `setEnvironmentImages` props
- Look tab passes all outfit/hair/makeup/skin/nail config fields plus `productImage`/`setProductImage` for UGC mode
- The preview bar checks `previewCharacterImage` -- if null and `referenceImage` exists, shows "Generate Preview" button; if preview exists, shows thumbnail
- Bottom bar "Generate Storyboard" is disabled until `previewCharacterImage` is truthy
- Keyboard left/right navigation for scenes remains unchanged

