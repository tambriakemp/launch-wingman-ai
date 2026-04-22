

## Add `create_prompt` to the Prompt Vault MCP (and matching REST action)

Goal: extend the `prompts-mcp` (and `prompts-api`) Edge Functions so authorized users can **create new AI prompts** in the Content Vault directly from Claude/ChatGPT/etc., with all metadata needed to render them in the vault — title, prompt text, type, tags, and an optional cover image (uploaded URL **or** AI-generated on the fly).

### What the user will see

In Claude Desktop (or any MCP client), two new tools appear on the `launchely-prompts` server:

1. **`create_prompt`** — creates a new image or video prompt in the AI Prompts vault.
2. **`delete_prompt`** *(bonus, low cost to add alongside)* — removes a prompt by ID. Skip if you'd rather not.

A successful `create_prompt` call returns the new prompt's ID, slug, public URL (vault deep link), and cover image URL — so the assistant can immediately confirm and link to it.

The new prompt instantly shows up in **Content Vault → AI Prompts → General** at `/app/content-vault/ai-prompts/general`, identical to prompts created via the admin Bulk Importer.

### Inputs accepted by `create_prompt`

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Used as the prompt card heading |
| `prompt` | yes | The actual prompt text (stored in `description`) |
| `type` | no | `image_prompt` (default) or `video_prompt` |
| `tags` | no | Array of strings, e.g. `["Portraits","Golden Hour"]` |
| `subcategorySlug` | no | Defaults to `general` under category `ai-prompts` |
| `coverImageUrl` | no | If provided, used as-is |
| `generateCover` | no | Boolean — if `true` and no `coverImageUrl`, generates one via Lovable AI (Gemini 3 Pro Image) using the prompt text |
| `referenceImageUrl` | no | Optional reference photo for identity preservation when `generateCover=true` (same logic as `regenerate_cover`) |

### Server-side rules

- **Admin gate**: only callers whose `user_id` has `app_role = 'admin'` (checked via the existing `has_role` SQL function) can create prompts. Mirrors the `Admins can insert resources` RLS policy. Non-admins get `403 Forbidden`.
- **Subcategory resolution**: if `subcategorySlug` is omitted, look up `subcategory_id` for `ai-prompts/general` (the same default the bulk importer uses, ID `e867d3a7-...`).
- **Position**: query `MAX(position)` in that subcategory and insert at `max + 1` so new prompts append to the end.
- **Duplicate guard**: case-insensitive check against existing `title` and normalized `description` in the same subcategory; reject with a clear `"Duplicate prompt: an existing prompt has the same title or text"` error so the assistant can adjust and retry.
- **Required DB defaults handled**: `resource_url` set to `"#"` (vault convention for prompts), `resource_type` from the `type` arg, `tags` defaulting to `null` if empty.
- **Cover generation** (when `generateCover=true`): reuses the exact pipeline already in `regenerate_cover` — calls Lovable AI gateway with optional reference photo, uploads to `content-media/covers/`, and stores the public URL on the new row. Synchronous — the call returns once the cover is saved.

### Response shape

```json
{
  "success": true,
  "prompt": {
    "id": "uuid",
    "title": "Golden Hour Portrait",
    "prompt": "...full text...",
    "type": "image_prompt",
    "tags": ["Portraits"],
    "cover_image_url": "https://.../covers/...jpg",
    "vault_url": "https://launchely.com/app/content-vault/ai-prompts/general"
  }
}
```

### REST parity (`prompts-api`)

Add `create_prompt` (and `delete_prompt` if approved) to the `VALID_ACTIONS` list and switch case in `supabase/functions/prompts-api/index.ts`, with identical behavior. Keeps the personal-API-key REST flow and the MCP flow in sync — both already share the same auth/key system.

### Files to change

- `supabase/functions/prompts-mcp/index.ts` — add `create_prompt` (and optionally `delete_prompt`) tool definitions; add a small `requireAdmin(serviceClient, userId)` helper that calls `has_role`.
- `supabase/functions/prompts-api/index.ts` — add the matching REST action(s) and the same `requireAdmin` helper.
- *(No DB migration, no new secrets, no client-side changes — the new prompts surface automatically in the existing vault UI.)*

### Memory updates

- Update `mem://integrations/claude-mcp-and-rest-api` to list the new `create_prompt` (and `delete_prompt`) tools alongside the existing read/update tools, and note the admin-only gate.

### Risks & non-goals

- **Admin-only by design** — non-admin personal API keys can already *read* prompts but won't be able to write. If you want regular users to create prompts under their own private namespace later, that's a separate, larger change (per-user vault scoping doesn't exist yet).
- **Cover generation cost & latency** — `generateCover=true` calls the Lovable AI image model and typically takes 8–20s. Default is `false` so simple text-only creates stay fast and free.
- **No bulk variant** — single-prompt create only. The admin Bulk Importer remains the right tool for CSV/PDF batches.

### Open question

Want **`delete_prompt`** included in the same change (admin-only, by ID, also exposed in MCP + REST)? It's ~15 lines and rounds out the CRUD surface, but happy to skip if you'd rather keep the MCP read/create-only.

