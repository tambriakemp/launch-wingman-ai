

## Plan: Remove Hardcoded Brainstorm Limits + Smarter Prompts

### Problem
The brainstorm prompt says "Generate 5" and the response is capped with `.slice(0, 5)`. Ideas also repeat because the prompt lacks date/seasonal context.

### Changes

**File: `supabase/functions/generate-storyboard/index.ts`**

1. **Carousel brainstorm prompt** — Replace "Generate 5 creative carousel ideas" with a richer prompt:
   - Generate 8–12 ideas (not a fixed number)
   - Inject `new Date().toISOString()` so the AI considers current season, holidays, trending moments
   - Mix aspirational, relatable, humorous, educational angles
   - If character profile exists, tailor to their niche/audience; otherwise generate broadly appealing lifestyle content
   - Explicit instruction: "Every call must produce completely unique ideas — never repeat"

2. **Remove `.slice(0, 5)`** — return all generated ideas without truncation

3. **Vlog brainstorm prompt** — Same seasonal/trending awareness and character-optional logic

4. **Remove "Story / Caption Theme"** from carousel generation prompt — merge into single `carouselVibe` field

**File: `src/components/ai-studio/StoryboardToolbar.tsx`**

5. Remove the "Story / Caption Theme" textarea for carousel mode
6. Update "Scene Description" placeholder to be more descriptive: *"Describe your scene — location, vibe, lighting, props, and the story or message. e.g. 'Cozy coffee shop, warm golden light, latte art — morning routine that changed my productivity'"*

