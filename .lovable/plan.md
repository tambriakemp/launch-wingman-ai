

## Plan: Upgrade Brainstorm with Character Vibe & Clickable Ideas

### Changes across 4 files + 1 edge function

**1. `src/components/ai-studio/types.ts`**
- Add `characterVibe: string` to `AppConfig` after `avatarDescription`

**2. `src/components/ai-studio/constants.ts`**
- Add `characterVibe: ""` to `INITIAL_CONFIG` after `avatarDescription`

**3. `src/components/ai-studio/StoryboardToolbar.tsx`**
- Add `brainstormIdeas?: string[]` and `onSelectIdea?: (idea: string) => void` to props interface
- Add Character Vibe textarea in the Character section (after SavedCharacter + Upload Reference, before closing `</div>`)
- Add clickable ideas list after the vlog topic textarea (before "Use own script")
- Add clickable ideas list after the carousel scene description textarea (before the "All slides share..." note)

**4. `src/pages/AIStudio.tsx`**
- Add `brainstormIdeas` state: `useState<string[]>([])`
- Replace `handleGenerateTopicIdeas` to populate `brainstormIdeas` array instead of auto-setting first idea
- Pass `brainstormIdeas` and `onSelectIdea` props to `StoryboardToolbar` — on select, set the appropriate config field and clear ideas

**5. `supabase/functions/generate-storyboard/index.ts`**
- Replace the entire brainstorm block with new prompts that:
  - Read `config.characterVibe` plus outfit/hair/makeup/skin for character context (no longer depends solely on `characterProfile`)
  - Carousel: generates 6 "Setting — Message" ideas with trending/lifestyle awareness
  - Vlog: generates 6 emoji + scenario ideas with trending awareness
  - Uses safe JSON parsing (`.text()` then `JSON.parse()`)
  - Temperature 0.9

