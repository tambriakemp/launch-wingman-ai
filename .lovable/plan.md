

## Plan: AI-Powered Brainstorm + Character Profile Feature

### Problem
1. Brainstorm generates generic ideas — no personalization based on the user's character/brand
2. Currently only stores 3 photos in storage with no metadata (name, niche, aesthetic, personality)
3. Only one "saved character" exists per user — no way to manage multiple characters

### Solution

#### 1. New "Characters" database table

Create a `characters` table to store character profiles:
- `id`, `user_id`, `name`, `niche` (e.g., "fitness coach", "tech reviewer"), `aesthetic` (e.g., "minimalist", "bold"), `personality_traits` (text), `target_audience` (text), `brand_colors` (text)
- `photo_urls` (JSONB array of up to 3 image URLs)
- `created_at`, `updated_at`
- RLS: users can only CRUD their own characters

#### 2. New "Character" page under AI Avatar Studio

Route: `/app/ai-studio/characters`

- Dashboard card alongside Storyboard Creator and Outfit Swap
- Character Builder form: upload 3 photos (face, profile, full body) + fill in profile fields (name, niche, aesthetic, personality, target audience)
- List of saved characters with edit/delete
- Each character card shows thumbnail + name + niche

#### 3. Update SavedCharacter component

- Instead of reading raw files from storage, fetch from `characters` table
- Show a dropdown/list of saved characters to pick from
- Selected character loads its photos AND profile data into the studio

#### 4. AI-Powered Brainstorm using character context

Update the `generate-storyboard` edge function's brainstorm action:
- Accept character profile data (niche, aesthetic, personality, target audience) in the prompt
- Generate personalized, varied ideas based on who the character is
- For carousel: "Generate 5 creative carousel ideas specifically for a [niche] creator with a [aesthetic] vibe targeting [audience]..."
- For vlog: similar personalization
- No more repetitive generic output — each brainstorm call produces unique, character-relevant ideas

### Files to create/edit

| File | Change |
|------|--------|
| **Migration** | Create `characters` table with RLS |
| `src/pages/AIStudioCharacters.tsx` | New character builder page |
| `src/pages/AIStudio.tsx` | Add Characters card to dashboard, pass character data to brainstorm |
| `src/components/ai-studio/SavedCharacter.tsx` | Refactor to list characters from DB |
| `supabase/functions/generate-storyboard/index.ts` | Enrich brainstorm prompt with character profile |
| `src/App.tsx` | Add route for `/app/ai-studio/characters` |

### UI Flow

```text
AI Avatar Studio Dashboard
├── Storyboard Creator
├── Avatar Outfit Swap
└── Character Builder  ← NEW
    ├── + Create Character
    │   ├── Upload 3 photos (face, profile, full body)
    │   ├── Name, Niche, Aesthetic, Personality, Target Audience
    │   └── Save
    └── List of saved characters (edit / delete)

In Storyboard Creator:
  Character section → "Select Character" dropdown → picks from saved characters
  Brainstorm button → sends character profile as context → personalized ideas
```

