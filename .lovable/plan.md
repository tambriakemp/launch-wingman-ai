

## Plan: Merge Carousel into Vlog/Carousel Mode + Add "Use Reference as Start Photo" Option

### Summary
Merge the Carousel and Vlog modes into a single **"Vlog / Carousel"** mode (2 modes total instead of 3). Add a toggle in Step 2 to let users use their uploaded reference photo as the start image instead of typing a topic.

### What Changes

---

**1. Types & Constants**

**`src/components/ai-studio/types.ts`**
- Change `CreationMode` from `'vlog' | 'ugc' | 'carousel'` to `'vlog' | 'ugc'`
- Add `useReferenceAsStart: boolean` to `AppConfig`

**`src/components/ai-studio/constants.ts`**
- Add `useReferenceAsStart: false` to `INITIAL_CONFIG`
- No other changes (carousel aesthetics, shot palette etc. stay — they're used by the backend)

---

**2. Toolbar UI — `src/components/ai-studio/StoryboardToolbar.tsx`**

- **Mode toggle**: Change from 3 buttons to 2: **"VLOG / CAROUSEL"** and **"UGC"**. The vlog button sets `creationMode: 'vlog'`.
- Remove the separate carousel button entirely.

- **Step 2 — Concept**: Add a toggle at the top:
  ```
  <label className="flex items-center gap-2 cursor-pointer mb-3">
    <Switch checked={config.useReferenceAsStart} onCheckedChange={...} />
    <span className="text-xs font-medium">Use reference photo as start image</span>
  </label>
  ```
  When enabled: hide the category selector, topic textarea, and brainstorm button. Show a note: "Your uploaded character photo will be used as Scene 1. The AI will build the remaining scenes from it."
  When disabled: show the existing vlog fields (category, topic, brainstorm, script toggle) merged with carousel fields (aesthetic selector, scene description textarea).

- **Merged vlog+carousel fields** (when `useReferenceAsStart` is off):
  - Show Vlog Category selector
  - Show Carousel Aesthetic selector (both visible — category drives narrative, aesthetic drives visual mood)
  - Show the topic/scene description textarea (use `vlogTopic` as the single field, with a label like "Topic / Scene Description")
  - Show brainstorm button + ideas
  - Show "Use own script" toggle (keep as-is)

---

**3. AIStudio.tsx — Frontend Logic**

- Remove all `=== 'carousel'` checks and map them to `'vlog'`:
  - `onSelectIdea`: merge carousel idea parsing (the `Setting — Message` split) into the vlog flow — when idea contains ` — `, set both `carouselVibe` and `carouselMessage`; otherwise set `vlogTopic`
  - `handleGenerateTopicIdeas`: remove `isCarousel` guard, always allow brainstorm
  - `handleGenerateStoryboard`: remove `carousel` validation (use `vlogTopic` as primary, fall back to `carouselVibe`)
  - Image generation queue sorting for carousel continuity: keep — just change check from `=== 'carousel'` to checking if `carouselAesthetic` is set or similar
  - When `useReferenceAsStart` is true: skip Scene 1 image generation and instead use the reference image URL directly as `generatedMedia[0].imageUrl`

---

**4. Edge Functions — Backend**

**`supabase/functions/generate-storyboard/index.ts`**
- Merge brainstorm logic: when `carouselVibe` or `carouselAesthetic` is set, use carousel-style brainstorm prompt; otherwise use vlog-style
- Merge storyboard generation: detect carousel-style content by checking `config.carouselAesthetic` or `config.carouselVibe` instead of `creationMode === 'carousel'`
- Pass through `useReferenceAsStart` flag — when true, instruct Scene 1 to match the reference photo exactly

**`supabase/functions/generate-scene-image/index.ts`**
- Replace `config.creationMode === 'carousel'` checks with a helper like `const isCarousel = !!(config.carouselVibe || config.carouselAesthetic)` to preserve the carousel-specific continuity instructions

---

**5. StudioSetup.tsx** (legacy setup page)
- Update mode toggle from 2 buttons to match new naming
- Map any `'carousel'` references to `'vlog'`

---

### Files to Modify
- `src/components/ai-studio/types.ts` — update CreationMode, add useReferenceAsStart
- `src/components/ai-studio/constants.ts` — add default
- `src/components/ai-studio/StoryboardToolbar.tsx` — merge mode buttons, add toggle, merge concept fields
- `src/pages/AIStudio.tsx` — remove carousel-specific branching, handle useReferenceAsStart
- `src/components/ai-studio/StudioSetup.tsx` — update mode toggle
- `supabase/functions/generate-storyboard/index.ts` — detect carousel by config fields instead of mode
- `supabase/functions/generate-scene-image/index.ts` — same detection change

