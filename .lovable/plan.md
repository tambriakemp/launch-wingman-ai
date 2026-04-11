

## Plan: Expose Reference Images to MCP Server

### Problem
Claude can see the `regenerate_cover` tool accepts an optional `referenceImageUrl`, but has no way to discover what reference images exist. It needs a tool to list saved characters and their photo URLs so it can automatically pass the right reference when regenerating covers.

### Solution
Add a new `list_characters` MCP tool (and REST endpoint) that returns saved characters with their `photo_urls`. This lets Claude:
1. Call `list_characters` to see available reference photos
2. Pick the appropriate `photo_urls[0]` from a character
3. Pass it as `referenceImageUrl` when calling `regenerate_cover`

### Changes

**`supabase/functions/prompts-mcp/index.ts`** — Add `list_characters` tool:
- Queries the `characters` table via service client
- Returns `id`, `name`, `niche`, `photo_urls` for each character
- Optionally filter by user (but since this is API-key authenticated, returns all characters for the authenticated user's account)

**`supabase/functions/prompts-api/index.ts`** — Add `list_characters` REST action:
- Same logic as MCP tool, exposed as REST for consistency

### New Tool Schema

```
list_characters
  Description: "List saved characters with their reference photo URLs. Use these URLs as referenceImageUrl when calling regenerate_cover."
  Input: { limit?: number }
  Output: { characters: [{ id, name, niche, photo_urls }] }
```

### How Claude Will Use It

1. `list_characters` → gets characters with photo URLs
2. `regenerate_cover({ promptId: "...", referenceImageUrl: characters[0].photo_urls[0] })` → generates cover with identity preservation

### Files Changed
- `supabase/functions/prompts-mcp/index.ts` — add `list_characters` tool
- `supabase/functions/prompts-api/index.ts` — add `list_characters` action

