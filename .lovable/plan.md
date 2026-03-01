

## Save Aesthetic Look Presets

Add a "Save This Look" button at the bottom of the Aesthetic & Style section that lets users name and save all current style settings, then load them later to pre-populate all fields.

### What Gets Saved

All fields within the Aesthetic & Style section:
- Exact Match toggle
- Aspect Ratio
- Camera Movement
- Outfit (type, details, additional info)
- Final Look (type, details, additional info)
- Hairstyle (+ custom)
- Makeup (+ custom)
- Skin (complexion, undertone)
- Nails (style, custom)

### Database

New table `ai_studio_saved_looks`:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | NOT NULL |
| name | text | NOT NULL (e.g., "Glam Night Out") |
| settings | jsonb | NOT NULL -- stores all aesthetic field values |
| created_at | timestamptz | default now() |

RLS: Users can SELECT, INSERT, DELETE their own rows.

The `settings` jsonb will store a subset of AppConfig fields:
```json
{
  "exactMatch": true,
  "aspectRatio": "9:16",
  "cameraMovement": "...",
  "outfitType": "...",
  "outfitDetails": "...",
  "outfitAdditionalInfo": "...",
  "finalLookType": "...",
  "finalLook": "...",
  "finalLookAdditionalInfo": "...",
  "hairstyle": "...",
  "customHairstyle": "...",
  "makeup": "...",
  "customMakeup": "...",
  "skinComplexion": "...",
  "skinUndertone": "...",
  "nailStyle": "...",
  "customNailStyle": "..."
}
```

### New Component: `SavedLooks.tsx`

Placed at the bottom of the Aesthetic & Style card (before the Terms section):

- Shows a horizontal scrollable list of saved looks as small chips/cards with the name
- Each chip has a **Load** action (applies settings to config) and a **Delete** (x) button
- A **"Save This Look"** button that opens an inline form asking for a name, then saves
- On load: merges the saved settings into the current `config` via `setConfig`

### UI Flow

```
[Nails section]
...
--- divider ---
Saved Looks:
[Glam Night Out] [x]  [Casual Day] [x]  [+ Save This Look]

When "Save This Look" clicked:
[Name input] [Save] [Cancel]
```

### Files Changed

| File | Change |
|------|--------|
| Database migration | Create `ai_studio_saved_looks` table with RLS |
| `src/components/ai-studio/SavedLooks.tsx` | New component |
| `src/components/ai-studio/StudioSetup.tsx` | Import and render SavedLooks at bottom of Aesthetic & Style section, pass `config` and `setConfig` |

