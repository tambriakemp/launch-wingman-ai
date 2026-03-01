

## Reorganize Studio Setup into 3 Separate Cards

### What Changes

Split the current single "Creation Mode & Uploads" card into 3 distinct cards with clear headings, and simplify the environment upload flow to be group-only (no standalone upload box).

### Layout (top to bottom)

1. **Card: "Character"** -- SavedCharacter component + single UploadZone for one-time selfie upload
2. **Card: "Environment"** -- SavedEnvironments component only (groups-based), remove the standalone UploadZone and the "OR upload a single image below" divider. New uploads go through the "Add Environment Group" flow.
3. **Card: "Look"** -- Creation mode toggle (Vlog/UGC), product upload (UGC only), then the full Aesthetic & Style section (aspect ratio, camera, category, outfit, hair, makeup, etc.) + SavedLooks at the bottom

### Changes to SavedEnvironments.tsx

- Remove the standalone entries section (the `grid grid-cols-2` block rendering individual saved images)
- Remove the "OR upload a single image below" divider at the bottom
- Remove the `standaloneEntries` state and related handlers (`handleUseEntry`, `handleDeleteEntry`)
- Keep all group functionality exactly as-is (it already works well)

### Changes to StudioSetup.tsx

- Split the single `<section>` into 3 separate `<section>` cards, each with a heading styled like the existing "Aesthetic & Style" heading (colored bar + bold text)
- **Character card**: SavedCharacter + UploadZone for selfie
- **Environment card**: SavedEnvironments only (no UploadZone after it)
- **Look card**: Creation mode toggle, product upload (UGC), all style fields, SavedLooks
- Move the creation mode toggle into the Look card since it controls the content/style, not the character or environment

### Files Changed

| File | Change |
|------|--------|
| `src/components/ai-studio/StudioSetup.tsx` | Split into 3 cards: Character, Environment, Look |
| `src/components/ai-studio/SavedEnvironments.tsx` | Remove standalone entries UI and "OR upload single image" divider |

