

## Plan: Merge "Vlog Category" and "Aesthetic / Mood" into a single dropdown

### What changes

The two dropdowns — **Vlog category** (e.g. "Get Ready With Me", "Morning Routine") and **Aesthetic / mood** (e.g. "Luxury / Soft Life", "Clean Girl / Minimal") — will be merged into one dropdown labeled **Vlog / Carousel Category**. The combined list will include all unique items from both arrays.

### Files to change

**1. `src/components/ai-studio/constants.ts`**
- Merge `VLOG_CATEGORIES` and `CAROUSEL_AESTHETICS` into a single array `VLOG_CATEGORIES` (keep the name). Add the aesthetic items that aren't already present. Remove `CAROUSEL_AESTHETICS` export.
- Update `INITIAL_CONFIG` to remove `carouselAesthetic` default (or keep field but default to first category).

**2. `src/components/ai-studio/types.ts`**
- Remove `carouselAesthetic` from `AppConfig` (the `vlogCategory` field will serve both purposes).

**3. `src/components/ai-studio/StoryboardToolbar.tsx`**
- Remove the "Aesthetic / mood" dropdown entirely.
- Rename the remaining dropdown label from "Vlog category" to **"Vlog / Carousel category"**.
- Remove `CAROUSEL_AESTHETICS` import.
- Update `hasConcept`/`hasAnyConfig` checks that reference `carouselVibe` (keep those as-is since `carouselVibe` is a separate text field still in use for carousel mode).

**4. `supabase/functions/generate-storyboard/index.ts`**
- Replace references to `config.carouselAesthetic` with `config.vlogCategory`.
- Update `isCarousel` check: use `config.carouselVibe` only (since `carouselAesthetic` no longer exists).
- Update the system prompt to use `vlogCategory` where it previously said `carouselAesthetic`.

**5. `supabase/functions/generate-scene-image/index.ts`**
- Same: replace `config.carouselAesthetic` with `config.vlogCategory` in all references.
- Update `isCarousel` checks to use `config.carouselVibe` only.

**6. `src/pages/AIStudio.tsx`**
- No changes needed (doesn't reference `carouselAesthetic` directly in logic that matters).

### Combined category list

The merged `VLOG_CATEGORIES` array will be:
```
"Get Ready With Me", "Morning Routine", "Night Routine", "Cooking / In the Kitchen",
"Cleaning / Reset Routine", "Lifestyle / Day In My Life", "Work-From-Home",
"Shopping / Haul", "Self-Care / Spa Day", "Mom Life", "Beauty / Glam", "Travel / Outside",
"Luxury / Soft Life", "Clean Girl / Minimal", "Dark Academia", "Y2K / Baddie",
"Cozy / Warm Tones", "Professional / Corporate", "Street Style / Urban",
"Cottagecore / Feminine", "Moody / Editorial", "Bright / Colorful", "Neutral / Earthy",
"Custom"
```

"Custom" appears once at the end.

