

## Plan: Fix MCP Server Tool Registration

### Problem
The `prompts-mcp` edge function crashes on boot because `mcp-lite@0.10.0`'s `tool()` method expects positional arguments, not a single options object. Every request fails with `Cannot read properties of undefined (reading 'inputSchema')`.

### Fix
Rewrite all `mcpServer.tool()` calls in `supabase/functions/prompts-mcp/index.ts` to use the correct positional signature:

```typescript
// Current (broken):
mcpServer.tool({
  name: "list_prompts",
  description: "...",
  inputSchema: { ... },
  handler: async (params) => { ... },
});

// Fixed:
mcpServer.tool(
  "list_prompts",
  "...",
  { type: "object", properties: { ... } },
  async (params) => { ... }
);
```

All 5 tools (`list_prompts`, `search_prompts`, `get_prompt`, `update_prompt`, `regenerate_cover`) need this change. The `authHeader` injection logic at the bottom stays the same.

### File Changed
- `supabase/functions/prompts-mcp/index.ts` — rewrite all 5 `mcpServer.tool()` calls to positional args

