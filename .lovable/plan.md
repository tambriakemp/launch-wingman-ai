

## Save and Load Storyboard Projects

### What This Does
After generating a storyboard with all its scenes, you'll be able to save the entire project -- config settings, storyboard script, character preview, and all generated scene images -- so you can close the page and come back later to view, edit, or continue working without regenerating anything.

### How It Will Work

1. **Save Button** appears in the storyboard header (next to "Download Script" and "Download All")
2. Clicking Save prompts for a project name, then persists everything to the database
3. A **"Load Project"** button on the setup screen lets you browse and open saved projects
4. Loading a project restores the full storyboard view with all images intact

### Database Change

Add a `generated_media` JSONB column to the existing `ai_studio_projects` table to store per-scene image/video URLs and lock states.

```sql
ALTER TABLE ai_studio_projects ADD COLUMN generated_media jsonb DEFAULT '{}'::jsonb;
```

No new tables needed -- the existing table already has `config`, `storyboard`, `character_preview_url`, `final_look_preview_url`, and `status`.

### UI Changes

**Storyboard Header** (`StudioStoryboard.tsx`):
- Add a "Save Project" button next to the existing Download buttons
- Shows a name input dialog, then saves

**Setup Screen** (`StudioSetup.tsx`):
- Add a "Saved Projects" section at the top showing cards for each saved project
- Each card shows: project name, creation date, scene count, and a thumbnail (character preview)
- Click to load; swipe/button to delete

### Save Logic (in `AIStudio.tsx`):
- Collects: `config`, `storyboard`, `generatedMedia` (image/video URLs only, no transient state), `previewCharacterImage`, `previewFinalLookImage`
- Upserts into `ai_studio_projects`
- If already loaded from a saved project, updates the same row (auto-save on re-save)

### Load Logic (in `AIStudio.tsx`):
- Fetches the project row
- Restores `config` -> `setConfig`
- Restores `storyboard` -> `setStoryboard`
- Restores `generatedMedia` (rebuilds with default flags like `isGeneratingImage: false`)
- Restores preview images
- Sets `appPhase` to `'storyboard'`

### New Component

**SavedProjectsGrid** -- displays saved projects on the setup screen as clickable cards with name, date, thumbnail, and delete option.

### Files Changed

| File | Change |
|------|--------|
| `ai_studio_projects` table | Add `generated_media` JSONB column |
| `src/pages/AIStudio.tsx` | Add save/load handlers, track current project ID, pass callbacks to child components |
| `src/components/ai-studio/StudioStoryboard.tsx` | Add "Save Project" button + name dialog |
| `src/components/ai-studio/StudioSetup.tsx` | Add saved projects section at top |
| `src/components/ai-studio/SavedProjectsGrid.tsx` | New component: project cards with load/delete |

