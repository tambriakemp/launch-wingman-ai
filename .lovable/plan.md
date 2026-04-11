

## Plan: Delete 5 Duplicate Prompts

### What's happening
Out of 2,662 AI prompts, 5 exact duplicates were found (same prompt text). Each has 2 copies — the older one will be kept, the newer one deleted.

### Records to delete
- `778d4853-5161-4e4a-be17-0a0958eabcdc` (duplicate of "African American woman with laptop")
- `8fedb0cc-87ec-4024-9225-e5af3c17cb7b` (duplicate of "Dark studio microphone boom")
- `a2f1eb7a-7806-46b7-90f6-0770c8a0f66f` (duplicate of "Office interior seated desk laptop")
- `373edfcf-e6c9-4d2d-b39e-6689c64d6714` (duplicate of "Elegant tailored blazer dress model")
- `32f362cf-ddfc-4c5a-8337-23eaf9e4d58a` (duplicate of "Aerial Crowd, Shoulder To Shoulder")

### Implementation
One database migration with a single DELETE statement targeting these 5 IDs.

```sql
DELETE FROM content_vault_resources
WHERE id IN (
  '778d4853-5161-4e4a-be17-0a0958eabcdc',
  '8fedb0cc-87ec-4024-9225-e5af3c17cb7b',
  'a2f1eb7a-7806-46b7-90f6-0770c8a0f66f',
  '373edfcf-e6c9-4d2d-b39e-6689c64d6714',
  '32f362cf-ddfc-4c5a-8337-23eaf9e4d58a'
);
```

No code changes needed — just the one migration.

