

## Add Saved Character Reference Photo

Allow users to upload and save one character reference photo to their account, then select it for reuse across AI Studio sessions instead of re-uploading every time.

### How It Works

1. Below the "Character Reference" upload zone, a new "Saved Character" section appears
2. If no saved character exists, a small upload button lets the user save one photo (stored in cloud storage)
3. If a saved character exists, it shows as a thumbnail with a "Use This" button and a "Delete" option
4. Clicking "Use This" sets it as the active reference image (same as uploading manually)
5. Only one saved character photo per user is allowed

### Database & Storage Changes

- **Storage**: Use the existing `ai-studio` bucket. Save files at path `characters/{user_id}/saved-reference.png`
- **No new table needed** -- we can simply check if a file exists at the known path in storage. The storage bucket already exists and is public.

### Frontend Changes

**`src/components/ai-studio/SavedCharacter.tsx`** (new component)
- Queries storage for `characters/{userId}/saved-reference.png` on mount
- If found, displays thumbnail with "Use This" and "Delete" buttons
- If not found, shows a small upload area to save a reference
- On upload: saves to storage, displays thumbnail
- On "Use This": calls `onSelect(base64)` which sets the reference image
- On delete: removes from storage

**`src/components/ai-studio/StudioSetup.tsx`**
- Import and render `SavedCharacter` component between the Creation Mode selector and the Character Reference upload zone
- Pass `onSelect` callback that sets the reference image (same as `setReferenceImage`)
- Add a divider with "OR upload a new one" text between saved character and the upload zone

**`src/pages/AIStudio.tsx`**
- No changes needed -- `setReferenceImage` already handles base64 input from any source

### User Flow

```text
Creation Mode: [VLOG] [UGC]

Saved Character:
  [thumbnail]  [Use This]  [Delete]
  -- OR --
  [+ Save a character photo]

Character Reference:
  [Upload Zone - for one-time use]
```

### Technical Details

- Uses `supabase.storage.from('ai-studio')` for upload/download/delete
- File path convention: `characters/{user_id}/saved-reference.png` (overwritten on re-save)
- Fetches the public URL on load, converts to base64 when "Use This" is clicked
- The existing `ai-studio` bucket is already public, so we can use `getPublicUrl` for the thumbnail
- Auth check via `supabase.auth.getUser()` to get the user ID

