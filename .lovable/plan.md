

## AI Studio Public API

### Summary
Create a single new edge function `ai-studio-api` that serves as a unified, API-key authenticated endpoint exposing all AI Studio capabilities. This lets you automate vlog image creation via HTTP requests without using the UI.

### Endpoints (all via POST to `/functions/v1/ai-studio-api`)

The `action` field in the request body determines the operation:

| Action | Description | Wraps |
|---|---|---|
| `generate_storyboard` | Generate a full storyboard from config + reference images | `generate-storyboard` |
| `generate_character_preview` | Generate the canonical character preview image | `generate-character-preview` |
| `generate_scene_image` | Generate a single scene image from a storyboard step | `generate-scene-image` |
| `generate_video` | Submit a video generation job from a scene image | `generate-video` |
| `check_video_status` | Poll video generation status | `check-video-status` |
| `list_projects` | List saved AI Studio projects | Direct DB query |
| `get_project` | Get a saved project with its config and storyboard | Direct DB query |

### Authentication
- Uses the user's Supabase JWT (same `Authorization: Bearer <token>` header)
- All operations are scoped to the authenticated user

### Request Format Examples

**Generate storyboard:**
```json
{
  "action": "generate_storyboard",
  "config": {
    "creationMode": "vlog",
    "vlogCategory": "Get Ready With Me",
    "vlogTopic": "Morning routine for work",
    "outfitType": "Business casual blazer",
    "hairstyle": "Sleek low bun",
    "makeup": "Natural glam",
    "skinComplexion": "Medium",
    "skinUndertone": "warm",
    "nailStyle": "French tips",
    "sceneCount": 10,
    "useOwnScript": false,
    "exactMatch": true,
    "ultraRealistic": true,
    ...all AppConfig fields
  },
  "referenceImageUrls": ["https://..."],
  "environmentImageUrls": ["https://..."]
}
```

**Generate scene image:**
```json
{
  "action": "generate_scene_image",
  "prompt": "Walking into the kitchen, morning light...",
  "config": { ...AppConfig },
  "previewCharacter": "https://storage-url/preview.png",
  "environmentImageUrls": ["https://..."],
  "isFinalLook": false,
  "anchorImageUrl": "https://...",
  "previousSceneImageUrl": "https://..."
}
```

### Changes

#### 1. New edge function: `supabase/functions/ai-studio-api/index.ts`
- Single entry point with `action` routing
- Validates JWT and extracts user ID
- For each action, constructs the internal function call by invoking the existing edge functions via `fetch` (internal service-to-service calls using the same auth header)
- Returns the same response format as the underlying functions
- Includes full AppConfig type documentation in error messages for discoverability

#### 2. New edge function: `supabase/functions/ai-studio-api-docs/index.ts`
- A GET endpoint that returns a JSON schema / OpenAPI-like description of all available actions, their required fields, and the full `AppConfig` type
- No auth required — serves as self-documenting reference
- Includes example payloads for each action

### How it works internally
The API function acts as a thin proxy:
1. Receives the request with `action` + payload
2. Validates auth
3. Forwards to the appropriate internal edge function (e.g., `generate-storyboard`, `generate-scene-image`) using the Supabase URL + service role for internal calls, passing through the user's auth
4. Returns the result

This avoids duplicating any generation logic — the existing functions remain the source of truth.

### Technical details
- All image references should be URLs (not base64) — upload to `ai-studio` storage bucket first if needed
- The proxy pattern means no logic duplication and automatic benefit from any future improvements to the underlying functions
- Rate limits and credit checks are handled by the underlying functions
- Video generation remains async (submit → poll pattern)

