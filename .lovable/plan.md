

## Multi-Angle Environment References

Currently, each saved environment is a single image. When selected, only that one image is sent to the AI, which can cause inconsistencies (e.g., the stove moving to the island). This plan introduces **Environment Groups** -- a named collection of multiple reference images (e.g., "Kitchen" with 4 angles) that are ALL sent to the AI during generation, giving it a complete spatial understanding of the space.

---

### Database Changes

**New table: `ai_studio_environment_groups`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | NOT NULL |
| name | text | NOT NULL (e.g., "Kitchen", "Living Room") |
| created_at | timestamptz | default now() |

RLS: Users can SELECT, INSERT, DELETE their own rows.

**Modify existing `ai_studio_environments` table** -- add a nullable `group_id` column:

| Column | Type | Notes |
|--------|------|-------|
| group_id | uuid | nullable FK to `ai_studio_environment_groups.id`, ON DELETE CASCADE |

Existing standalone entries (group_id = NULL) continue to work as before.

---

### How It Works

1. **Creating a group**: User clicks "Add Environment Group", names it (e.g., "Kitchen"), then uploads 1-8 images (different angles) into that group.
2. **Selecting a group**: When the user clicks "Use" on a group, ALL images in the group are fetched and passed to the generation pipeline.
3. **Data flow change**: Instead of passing a single `environmentImage` (base64 string), the system will also pass `environmentImages` (array of base64 strings) to the edge functions.
4. **Edge function updates**: All three edge functions (`generate-character-preview`, `generate-scene-image`, `generate-storyboard`) will accept an `environmentImages` array, adding ALL images as reference parts with a prompt instruction like: "Multiple reference images of the same environment are provided showing different angles. Maintain exact spatial consistency -- keep all fixtures, appliances, and furniture in their original positions."

---

### UI Changes to `SavedEnvironments.tsx`

The component will be restructured to show two sections:

```text
Saved Environments
--------------------
[Kitchen]  (4 photos)  [Use] [x]
  [img1] [img2] [img3] [img4] [+ Add Photo]

[Office]   (2 photos)  [Use] [x]
  [img1] [img2] [+ Add Photo]

[+ Add Environment Group]

--- OR upload a single image below ---
```

- Each group is expandable/collapsible showing its photos as a thumbnail strip
- Users can add more photos to an existing group
- "Use" fetches all images in the group as base64 and passes them as an array
- Individual (ungrouped) environments still work as before for backward compatibility

---

### Edge Function Changes

All three functions receive a new optional `environmentImages: string[]` parameter:

- **generate-scene-image**: Each image in the array is added as a separate `image_url` content part. The prompt explicitly instructs: "Multiple angles of the same environment are provided. Keep all objects, fixtures, and layout exactly as shown across all references."
- **generate-character-preview**: Same pattern -- all environment images added as references.
- **generate-storyboard**: Environment images passed through for context.

---

### Files Changed

| File | Change |
|------|--------|
| DB migration | Create `ai_studio_environment_groups` table; add `group_id` column to `ai_studio_environments` |
| `src/components/ai-studio/SavedEnvironments.tsx` | Rewrite to support grouped environments with multi-image upload |
| `src/pages/AIStudio.tsx` | Add `environmentImages` state (string array); pass to edge function calls alongside existing `environmentImage` |
| `src/components/ai-studio/StudioSetup.tsx` | Update props to accept `setEnvironmentImages` and pass to SavedEnvironments |
| `supabase/functions/generate-scene-image/index.ts` | Accept `environmentImages` array, add all as reference parts with consistency prompt |
| `supabase/functions/generate-character-preview/index.ts` | Accept `environmentImages` array |
| `supabase/functions/generate-storyboard/index.ts` | Accept `environmentImages` array |

---

### Technical Notes

- Maximum 8 images per group to avoid exceeding API token limits
- Images are stored in the existing `ai-studio` storage bucket under `environments/{userId}/{groupId}/`
- The consistency prompt instructs the AI to treat all images as the SAME space and never rearrange objects
- Backward compatible: single-image environments still work via the existing `environmentImage` path

