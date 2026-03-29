

## Add Personal API Keys for AI Studio API Authentication

### Problem
Currently, the AI Studio API requires a short-lived JWT (session token) obtained by signing in with your real email/password. You want a long-lived, revocable API key you can use instead — like an "app password."

### Approach
Generate a random API key (e.g. `lw_sk_...`) that users can create/revoke from Settings. The `ai-studio-api` edge function will accept this key as a Bearer token and resolve it to the user, bypassing JWT auth.

### Changes

#### 1. Migration — new `personal_api_keys` table
```sql
CREATE TABLE public.personal_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key_hash TEXT NOT NULL,        -- SHA-256 hash of the key (we never store plaintext)
  key_prefix TEXT NOT NULL,      -- first 8 chars for display (e.g. "lw_sk_ab")
  label TEXT DEFAULT 'Default',  -- user-friendly name
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.personal_api_keys ENABLE ROW LEVEL SECURITY;
-- Users can manage their own keys
CREATE POLICY "Users manage own keys" ON public.personal_api_keys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

#### 2. New edge function: `supabase/functions/generate-personal-api-key/index.ts`
- Authenticated endpoint (requires JWT)
- Generates a random key like `lw_sk_<32 random hex chars>`
- Stores SHA-256 hash + prefix in `personal_api_keys`
- Returns the full key **once** (user must copy it — it's never shown again)
- Optionally accepts a `label` field

#### 3. Update `supabase/functions/ai-studio-api/index.ts`
- Before JWT validation, check if the Bearer token starts with `lw_sk_`
- If so, hash it with SHA-256 and look up in `personal_api_keys`
- If found, use that `user_id` for the request (skip JWT flow)
- Update `last_used_at` on the key row
- If not found, return 401

#### 4. New UI in Settings: `src/components/settings/ApiKeysCard.tsx`
- "Personal API Keys" card in Settings page
- "Generate New Key" button → calls the edge function → shows the key once with a copy button
- Lists existing keys (showing prefix + label + last used)
- Revoke button to delete a key
- Warning that the key is shown only once

#### 5. Wire into Settings page
- Add `ApiKeysCard` to the settings page alongside existing cards

### Usage after implementation
```bash
# Generate a key once from Settings UI, then use it forever:
curl -X POST ".../functions/v1/ai-studio-api" \
  -H "Authorization: Bearer lw_sk_abc123..." \
  -H "Content-Type: application/json" \
  -d '{"action": "list_projects"}'
```

No password needed. Revoke anytime from Settings.

