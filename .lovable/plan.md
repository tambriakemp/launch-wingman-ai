

## Consolidate AI Studio Settings into a Single Slide-Out Panel

### Summary
Replace the 4 separate toolbar popover dropdowns (Create, Character, Environment, Look) with a single "Create" button that opens a right-side Sheet panel. This panel contains all settings in collapsible sections, plus the vlog topic / carousel message inputs (currently inline on the page). The inline topic/carousel blocks on AIStudio.tsx get removed.

### Changes

**1. `src/components/ai-studio/StoryboardToolbar.tsx` — Major refactor**

- Import `Sheet, SheetContent, SheetHeader, SheetTitle` from `@/components/ui/sheet`
- Add a `open` / `setOpen` state for the sheet
- Replace the 4 `ToolbarButton` popovers (Aspect Ratio stays as-is) with a single button labeled "Create" (or "Settings") that opens the Sheet
- Inside the Sheet, organize content into collapsible sections:
  1. **Creation Mode** — vlog/ugc/carousel toggle, vlog category, carousel aesthetic + slide count, camera movement, scene count
  2. **Topic / Message** — vlog topic + brainstorm + own script (when vlog), carousel setting/environment + message/theme + brainstorm (when carousel), UGC marketing goal (when ugc)
  3. **Character** — saved characters + upload zone
  4. **Environment** — saved environments
  5. **Look** — exact match, ultra-realistic, quick presets, product upload (ugc), outfit, final look (GRWM), hairstyle, makeup, skin & nails, saved looks
- The Sheet should be `w-full sm:max-w-[480px] overflow-y-auto`
- Keep the Aspect Ratio popover, Projects, Save, Script, All, New buttons in the toolbar as they are

**2. `src/pages/AIStudio.tsx` — Remove inline topic/carousel blocks**

- Remove the inline vlog topic block (lines ~847-879)
- Remove the inline carousel input block (lines ~882-910)
- These inputs now live inside the Sheet panel in StoryboardToolbar
- Pass `handleGenerateTopicIdeas` and `isGeneratingTopic` through to the toolbar (already passed as props)
- Import `Sparkles` is already in the toolbar

**3. Props — minor additions to `StoryboardToolbarProps`**

- No new props needed — `onGenerateTopicIdeas` and `isGeneratingTopic` are already passed
- The toolbar already has all config/setConfig access needed for topic/carousel fields

### Technical notes
- `ToolbarButton` component stays for potential future use but the 4 main popovers are replaced by the single Sheet
- `CollapsibleSection` component already exists in the toolbar and will be reused for organizing sections inside the Sheet
- The `StatusDot` indicators move into section headers inside the Sheet to show configuration status

