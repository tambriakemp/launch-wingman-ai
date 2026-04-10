

## Plan: Generate Image Captions Feature

### What it does
Adds a "Generate Image Captions" option to the Generate dropdown in the AI Studio toolbar. When clicked, a modal opens where the user selects one of their project offers (or types a custom topic). AI generates a sequential caption for each scene image — captions build on each other narratively (like the Instagram story screenshots) and the final one includes a CTA. The modal also checks if the user has completed Planning and Messaging tasks and shows an encouragement message if not.

### UI Flow
1. User clicks **Generate > Generate Image Captions** in the toolbar
2. Modal opens with:
   - A project selector dropdown (fetches user's projects)
   - Once a project is selected, shows offer cards to pick from OR a freeform text input
   - A notice if Planning/Messaging sections are incomplete ("Complete your Planning & Messaging tasks for better captions")
   - "Generate Captions" button
3. AI returns one caption per scene image; captions are displayed in the modal for review
4. User can edit captions inline, then click "Apply to Images" which adds them as text overlays on the corresponding scene cards

### New Files
- **`src/components/ai-studio/GenerateCaptionsModal.tsx`** — The modal component with project/offer selection, context status check, caption display and editing
- **`supabase/functions/generate-image-captions/index.ts`** — Edge function that takes offer/topic context + planning/messaging data + scene count, returns an array of sequential captions with the last one containing a CTA

### Modified Files
- **`src/components/ai-studio/StoryboardToolbar.tsx`** — Add "Generate Image Captions" menu item to the Generate dropdown; add `onGenerateCaptions` prop
- **`src/pages/AIStudio.tsx`** — Add state for the captions modal, pass handler to toolbar, handle applying captions as text overlays

### Edge Function Logic
The `generate-image-captions` function receives:
- `topic` (offer title + description or custom text)
- `sceneCount` (number of images)
- `contextData` (niche, target audience, pain point, desired outcome, core message, transformation statement, talking points — whatever is available from planning/messaging tasks)

System prompt instructs the AI to:
- Generate `sceneCount` captions that build upon each other like an Instagram story sequence
- Keep each caption punchy (1-3 short sentences)
- Make the final caption a clear CTA
- Use the offer/messaging context for tone and relevance

### Context Check Logic
In the modal, fetch `project_tasks` for the selected project where `task_id` starts with `planning_` or `messaging_` and check completion status. If fewer than ~50% are completed, show an info banner encouraging the user to complete them first for better results.

### Technical Notes
- Projects and offers are fetched client-side via Supabase queries in the modal
- Planning/messaging context is fetched when a project is selected and passed to the edge function
- Generated captions can be applied as text overlays using the existing `TextOverlay` system, or kept as separate caption metadata for display
- The edge function uses Lovable AI (`google/gemini-3-flash-preview`)

