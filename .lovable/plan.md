

## Plan: Remove Multi-Shot & Move Character Bind to Step 2

### Changes

**1. Remove Multi-Shot entirely**

- `src/components/ai-studio/MultiShotEditor.tsx` — delete file
- `src/components/ai-studio/types.ts` — remove `multiShot` from `QueueItem`
- `src/components/ai-studio/StudioStoryboard.tsx` — remove MultiShotEditor import, props (`multiShotEnabled`, `onMultiShotToggle`, `multiShots`, `onMultiShotsChange`), and the rendered component
- `src/pages/AIStudio.tsx` — remove `multiShotEnabled`/`multiShots` state, remove multi-shot logic in video body construction, remove props passed to StudioStoryboard
- `supabase/functions/generate-video/index.ts` — remove `multiShot` / `multi_prompt` handling (keep single-prompt path only)

**2. Move Character Bind panel to bottom of Step 2 (Concept) in StoryboardToolbar**

- `src/components/ai-studio/StoryboardToolbar.tsx` — add `characterBind` and `onCharacterBindChange` and `sessionReferenceUrl` props; render `CharacterBindPanel` at the bottom of the Step 2 CollapsibleSection (after all concept fields, before closing tag)
- `src/components/ai-studio/StudioStoryboard.tsx` — remove CharacterBindPanel from the storyboard view (it was in the 2-column grid with multi-shot); keep passing `characterBind` data through to video queue items
- `src/pages/AIStudio.tsx` — pass `characterBind`, `onCharacterBindChange`, and `sessionReferenceUrl` props to `StoryboardToolbar`

This makes Character Bind a decision users make early (Step 2) alongside their concept, which is correct since it affects how the video model generates all scenes.

### Technical Notes
- The `CharacterBindPanel` component itself stays unchanged — only its location moves
- The 2-column grid in StudioStoryboard that held both panels gets removed entirely
- Video queue construction still reads `characterBind` from state (unchanged)

