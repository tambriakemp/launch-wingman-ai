

## Fix AI Studio Character Reference Upload/Delete

### Root Cause
The storage RLS policies for the `ai-studio` bucket compare `auth.uid()` against `(storage.foldername(name))[1]`, which returns `'characters'` (the first folder in the path). The actual user ID is at index `[2]` since paths are `characters/{userId}/saved-reference-0.png`.

This breaks:
- **Delete** — policy rejects because `auth.uid() != 'characters'`
- **Upload (upsert)** — upsert requires UPDATE permission, which also fails
- **3-slot grid** — never appears because no photos can be saved successfully

### Fix
One database migration to drop and recreate the UPDATE and DELETE policies with the correct array index `[2]`:

```sql
DROP POLICY "Users can update their own AI studio assets" ON storage.objects;
CREATE POLICY "Users can update their own AI studio assets"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'ai-studio' AND (auth.uid())::text = (storage.foldername(name))[2]);

DROP POLICY "Users can delete their own AI studio assets" ON storage.objects;
CREATE POLICY "Users can delete their own AI studio assets"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'ai-studio' AND (auth.uid())::text = (storage.foldername(name))[2]);
```

No code changes needed — `SavedCharacter.tsx` logic is correct. Once the policies are fixed, uploads will succeed, the 3-slot grid will appear after the first photo, and deletes will work.

