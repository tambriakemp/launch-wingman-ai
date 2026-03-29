

## Expose Saved Character & Environment References via API

### Summary
Add two new actions to the `ai-studio-api` edge function: `list_character_references` and `list_environment_references`. These return the user's saved reference image URLs so automation scripts can use them directly in generation calls.

### Changes

#### 1. `supabase/functions/ai-studio-api/index.ts`
- Add `"list_character_references"` and `"list_environment_references"` to `VALID_ACTIONS`
- Add two new direct DB/storage action handlers:

**`list_character_references`** — Lists up to 3 saved character reference images from storage (`characters/{userId}/saved-reference-{0,1,2}.png`). Returns an array of public URLs for slots that have files.

**`list_environment_references`** — Queries `ai_studio_environment_groups` and `ai_studio_environments` for the user. Returns groups with their images as public URLs:
```json
{
  "groups": [
    {
      "id": "...",
      "name": "Kitchen",
      "images": [
        { "id": "...", "label": "kitchen1.png", "url": "https://..." }
      ]
    }
  ]
}
```

#### 2. `supabase/functions/ai-studio-api-docs/index.ts`
- Add documentation entries for both new actions with example responses.

### Implementation details
- Character refs use storage listing (same pattern as `SavedCharacter.tsx` — check `characters/{userId}/` for `saved-reference-{0,1,2}` files, return public URLs with labels)
- Environment refs use DB queries to `ai_studio_environment_groups` + `ai_studio_environments`, then build public URLs from `file_path` via storage
- For API key auth, the service role client is already set up, so both queries will work
- No new tables or migrations needed

