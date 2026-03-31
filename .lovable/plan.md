

## Add Carousel Mode to AI Studio

### Summary
Add a third creation mode ("Carousel") to the AI Studio, touching 4 files: types, constants, toolbar, main page, and the edge function.

### Changes

**1. `src/components/ai-studio/types.ts`**
- Extend `CreationMode` to `'vlog' | 'ugc' | 'carousel'`
- Add `carouselVibe`, `carouselMessage`, `carouselAesthetic` (strings) and `carouselSlideCount` (number) to `AppConfig`

**2. `src/components/ai-studio/constants.ts`**
- Add `CAROUSEL_AESTHETICS` and `CAROUSEL_SHOT_PALETTE` arrays
- Add carousel defaults to `INITIAL_CONFIG`

**3. `src/components/ai-studio/StoryboardToolbar.tsx`**
- Change mode toggle from 2-col to 3-col grid, add CAROUSEL button
- Add carousel-specific settings section (aesthetic dropdown, slide count slider) after the vlog category block
- Import `CAROUSEL_AESTHETICS`

**4. `src/pages/AIStudio.tsx`**
- Add carousel input block (Setting/Environment + Message/Theme textareas with Brainstorm button) after vlog topic block
- Update `handleGenerateTopicIdeas` to handle carousel brainstorm response (parse `ideas` array into `carouselVibe` + `carouselMessage`)
- Add carousel validation in `handleGenerateStoryboard` (require `carouselVibe`)

**5. `supabase/functions/generate-storyboard/index.ts`**
- In `action === 'brainstorm'`: branch for carousel mode with multi-idea prompt, return `{ ideas }` array
- In `action === 'generate'`: branch for carousel mode with dedicated system prompt focused on cohesive carousel shot lists, visual anchoring, and shot variety

All changes follow the exact specifications provided in the user's message.

