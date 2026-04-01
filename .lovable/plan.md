
## Fix reel format, orientation, and persistence

### What’s wrong now
- The current reel merger in `src/pages/AIStudio.tsx` uses `Canvas + MediaRecorder`, which outputs a browser-native blob. In practice that is ending up as WebM/WebP-like output, not a true MP4.
- It derives reel dimensions from the first source video’s metadata, so if that clip comes back landscape, the merged reel stays landscape even when the project is portrait.
- The reel only exists as a temporary object URL in state (`mergedReelUrl`), and it is explicitly revoked when the dialog closes, so there is no way to reopen it later.

### Recommended implementation

#### 1. Replace the current client-side reel export with a backend merge flow
Use a backend function to create a real MP4 file and store it permanently in the existing `ai-studio` storage bucket.

Files:
- `supabase/functions/merge-scene-videos/index.ts` new
- `src/pages/AIStudio.tsx`

Behavior:
- Send ordered scene `videoUrl`s, selected `aspectRatio`, and current `projectId` to the backend function.
- Backend downloads the videos, normalizes them to the requested canvas size, concatenates them, writes a real `.mp4`, uploads it to `ai-studio/{userId}/reels/...`, and returns a persistent public URL.
- UI uses that URL both for preview and download.

Why this is the right fix:
- Guarantees MP4 output instead of browser-recorder fallbacks.
- Lets us force the final reel to match the project ratio.
- Gives a permanent URL that can be saved with the project.

#### 2. Persist reel metadata on the saved AI Studio project
Add reel fields to `ai_studio_projects` so each saved project can keep its latest reel.

Database changes:
- Add nullable fields like:
  - `reel_url text`
  - `reel_path text`
  - `reel_created_at timestamptz`
  - optional `reel_status text` if we want future async support

Notes:
- Existing RLS already scopes projects to the current user, so this fits current access patterns.
- No auth model changes needed.

#### 3. Update AI Studio save/load behavior
In `src/pages/AIStudio.tsx`:
- Add state for persistent reel data, separate from temporary merge progress.
- When a reel is created successfully:
  - set local preview URL/state from the returned storage URL
  - if a project already exists, immediately update that project row with reel metadata
  - if the project has not been saved yet, keep the reel state locally and include it on the next save
- On project load:
  - restore `reel_url` into state
  - show access to the reel again even after refresh or later reopen

#### 4. Update the reel dialog and access points
In `src/pages/AIStudio.tsx`:
- Change the dialog to use the persistent reel URL directly.
- Download filename should be `.mp4`.
- Add a second access point outside the success dialog, so users can reopen the reel later:
  - either a “View Reel” / “Download Reel” button beside “Create Reel”
  - or a small “Latest Reel” card above the storyboard actions when a reel exists

Recommended UX:
- `Create Reel` when 2+ videos exist
- `View Reel` and `Download Reel` once a reel has been created
- If source videos change later, optionally show “Re-create Reel” to replace the previous one

#### 5. Make project orientation authoritative for the final reel
In the merge function:
- Map project aspect ratios to fixed output dimensions, for example:
```text
9:16  -> 1080x1920
16:9  -> 1920x1080
1:1   -> 1080x1080
```
- Normalize every clip into that target canvas before concatenation.
- If a source clip arrives in the wrong shape, scale/crop or pad consistently so the final reel still matches the chosen orientation.

Also worth checking:
- `supabase/functions/generate-video/index.ts` currently accepts `aspectRatio` but does not visibly pass it through in the request body shown here. That likely contributes to clips arriving in the wrong orientation. This should be corrected as part of the implementation so both individual clips and the final reel respect the same ratio.

### Files likely involved
- `src/pages/AIStudio.tsx`
- `src/components/ai-studio/SavedProjectsGrid.tsx` (optional if you want a reel badge/thumbnail)
- `supabase/functions/merge-scene-videos/index.ts` new
- `supabase/functions/generate-video/index.ts`
- new SQL migration for `ai_studio_projects`

### Technical details
- The current client-side merge should be removed rather than patched.
- Persist the reel URL on the project row, not only inside transient React state.
- Keep using the existing `ai-studio` bucket and existing project ownership rules.
- If backend video merging requires an external processor/runtime capability, implement it inside the backend function with proper storage upload and return only the final stored URL to the client.

### Expected result
After this change:
- Reel downloads as an actual MP4
- Reel orientation matches the selected project orientation
- Users can reopen and download the reel later from the same saved project
