

## Add Saved Environment Photos (Multiple, Labeled)

Allow users to save multiple labeled environment/setting photos (e.g., "Kitchen", "Office", "Living Room") and select one to use as the environment reference.

### Storage

Use the existing `ai-studio` bucket. Files stored at:
```
environments/{user_id}/{uuid}.png
```

### Database

A new table `ai_studio_environments` is needed to store metadata (label, file path) since we need multiple labeled entries per user:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL |
| label | text | NOT NULL (e.g., "Kitchen") |
| file_path | text | NOT NULL (storage path) |
| created_at | timestamptz | default now() |

RLS policies: Users can SELECT, INSERT, DELETE their own rows (matched on `auth.uid() = user_id`).

### New Component: `SavedEnvironments.tsx`

Similar pattern to `SavedCharacter.tsx` but supports multiple entries:

- On mount, queries `ai_studio_environments` for the current user
- Displays a grid/list of saved environments as labeled thumbnails
- Each entry shows: thumbnail, label text, **[Use]** and **[Delete]** buttons
- A **[+ Add Environment]** button opens a small form: file upload + text input for label
- Clicking **Use** converts the image to base64 and calls `onSelect(base64)` (sets `environmentImage`)
- Clicking **Delete** removes the storage file and the database row
- No limit enforced, but UI keeps it compact (scrollable if many)

### Integration in `StudioSetup.tsx`

Insert `SavedEnvironments` above the existing Environment `UploadZone` (same pattern as SavedCharacter):

```
Environment / Setting (Optional):
  [Saved: Kitchen] [Saved: Office] [+ Add]
  --- OR upload a new one below ---
  [Upload Zone - one-time use]
```

### Files Changed

| File | Change |
|------|--------|
| Database migration | Create `ai_studio_environments` table with RLS |
| `src/components/ai-studio/SavedEnvironments.tsx` | New component |
| `src/components/ai-studio/StudioSetup.tsx` | Import and render `SavedEnvironments` above environment UploadZone |

### Technical Details

- Upload flow: user clicks "+ Add", picks a file, types a label, clicks Save. File goes to storage at `environments/{userId}/{crypto.randomUUID()}.png`, row inserted into `ai_studio_environments`.
- Delete flow: removes storage file via `supabase.storage.from('ai-studio').remove([filePath])`, then deletes the DB row.
- "Use" flow: fetches public URL, converts to base64 via FileReader, calls `onSelect()` which sets `environmentImage` state in AIStudio.
- Thumbnails use `supabase.storage.from('ai-studio').getPublicUrl(filePath)`.

