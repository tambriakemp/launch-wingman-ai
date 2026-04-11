

## Plan: REST API + MCP Server for AI Prompts (with Edit & Cover Regeneration)

### What
Create two new edge functions that expose AI prompts for reading **and writing**:
1. **`prompts-api`** — REST API with CRUD + cover regeneration
2. **`prompts-mcp`** — MCP server so Claude Desktop can natively discover and use these as tools

Both support editing prompt text, title, tags, and regenerating covers using a saved reference photo — all authenticated via personal API keys (`lw_sk_...`) or JWT.

### Actions Available

| Action | Description | Parameters |
|--------|-------------|------------|
| `list_prompts` | Browse prompts with pagination | `limit`, `offset`, `tag`, `type` |
| `search_prompts` | Full-text search | `query`, `limit` |
| `get_prompt` | Get single prompt | `promptId` |
| `update_prompt` | Edit title, prompt text, and/or tags | `promptId`, `title?`, `prompt?`, `tags?` |
| `regenerate_cover` | Generate new cover image from prompt text | `promptId`, `referenceImageUrl?` |

### How It Works

**Editing**: `update_prompt` updates `title`, `description` (prompt text), and `tags` on `content_vault_resources` via service role client (since API key auth bypasses RLS).

**Cover regeneration**: Calls the existing `generate-prompt-cover` edge function internally, passing the prompt's `description` and optional `referenceImageUrl`. The returned base64 image is uploaded to the `content-media` storage bucket and the resource's `cover_image_url` is updated.

**Reference photos**: Claude can pass a `referenceImageUrl` (any public URL) when calling `regenerate_cover`. If the user has a saved reference in `ai-studio` storage, they can provide that URL.

### Files Created

1. **`supabase/functions/prompts-api/index.ts`** — REST API with all 5 actions, auth via personal API keys or JWT (reuses existing pattern from `ai-studio-api`)
2. **`supabase/functions/prompts-mcp/index.ts`** — MCP server using Hono + mcp-lite exposing all 5 actions as MCP tools
3. **`supabase/functions/prompts-mcp/deno.json`** — Import map for mcp-lite dependency

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "launchely-prompts": {
      "url": "https://ydhagqgurqhlguxkkppb.supabase.co/functions/v1/prompts-mcp",
      "headers": {
        "Authorization": "Bearer lw_sk_your_key_here"
      }
    }
  }
}
```

### Example Responses

**update_prompt**:
```json
{ "success": true, "prompt": { "id": "...", "title": "Rooftop — Red Dress (Wide)", "prompt": "...", "tags": ["editorial"] } }
```

**regenerate_cover**:
```json
{ "success": true, "cover_image_url": "https://...content-media/covers/abc123.jpg" }
```

### Technical Details
- Auth pattern copied from `ai-studio-api` (SHA-256 hash lookup on `personal_api_keys`)
- Cover regeneration reuses `generate-prompt-cover` logic inline (calls Lovable AI gateway with `google/gemini-3-pro-image-preview`)
- Prompts filtered by `resource_type IN ('image_prompt', 'video_prompt')` to scope to AI prompts only
- Both functions deployed automatically

