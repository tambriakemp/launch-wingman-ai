
## AI Studio UX Audit and Improvement Plan

### Current State Summary

The AI Studio is a workspace for generating AI influencer content (vlog storyboards and UGC). It has a toolbar with dropdown popovers (Character, Environment, Look, Settings), a character preview bar, a single-scene storyboard view with navigation dots, and a fixed bottom action bar.

---

### Issues Identified

#### 1. Workflow is Unclear -- No Guided Onboarding
- The page opens with two empty placeholder cards ("Upload a character photo..." and "No storyboard yet") and a disabled "Generate Storyboard" button at the bottom. Nothing guides the user through the required steps.
- The toolbar dropdowns (Character, Environment, Look, Settings) give no visual indication of which ones are configured vs. empty. A new user doesn't know what to do first.

**Fix:** Add status indicators to each toolbar button showing completion state (e.g., a green dot or checkmark when a character is uploaded, environment selected, etc.). Add a compact step indicator or progress breadcrumb above the preview area: "1. Upload Character > 2. Configure Look > 3. Generate Preview > 4. Build Storyboard."

#### 2. Too Many Clicks to Get Started
- To begin, a user must: open Character popover > upload or select a saved character > close popover > open Settings > accept safety terms > close popover > click Generate Preview. That's 6+ interactions before seeing anything.

**Fix:** Surface the most critical actions inline. Move the safety terms checkbox and character upload into the main workspace area (not hidden in popovers) when no character is loaded. Once a character is set, collapse these into the toolbar.

#### 3. Settings Popover is Overloaded
- The Settings popover contains: Creation Mode toggle, Camera Movement, Vlog Category, Vlog Topic textarea, Brainstorm button, Own Script checkbox + textarea, AND Safety Terms checkbox. That's 7+ distinct controls crammed into a 320px-wide dropdown.
- Safety terms are buried at the bottom of Settings -- users don't know they need to accept them until they try to generate and get an error toast.

**Fix:** Split Settings into two concerns:
- Move "Creation Mode" and "Vlog Category / Topic" into the main workspace left column (these are primary creative decisions, not settings).
- Keep camera movement and script options in Settings.
- Move safety terms out of Settings entirely -- show them inline as a one-time banner before the first generation.

#### 4. Look Popover is Overwhelming
- The Look popover contains: Exact Match toggle, Product Upload (UGC), Marketing Goal (UGC), Outfit selector + custom input + additional details, Final Look outfit (GRWM), Hairstyle selector + custom input, Makeup selector + custom input, Skin complexion + undertone (2 dropdowns), Nail style + custom input, and Saved Looks. That's 12+ form fields in a narrow popover.

**Fix:** Group related fields with collapsible sections (Outfit, Hair, Makeup, Skin/Nails) so users can focus on one area at a time. Default to collapsed except the first section. Add a "Quick Look" preset row at the top (e.g., "Natural Minimal", "Glam Baddie", "Streetwear") that auto-fills multiple fields at once.

#### 5. Character Preview Bar Lacks Context
- After generating a preview, the bar shows a tiny 64px thumbnail with "Character Ready" and a summary like "Default Outfit . Sleek Straight Wig . Bare Face." There's no way to compare before/after or see what was configured without reopening popovers.

**Fix:** Make the preview bar expandable -- clicking it reveals a larger view with the full configuration summary and side-by-side comparison for GRWM (default vs. final look).

#### 6. Storyboard Area is Underutilized
- Before storyboard generation, 60%+ of the screen is empty placeholder cards. After generation, the single-scene view with prev/next navigation means users can only see one scene at a time with no overview.

**Fix:** Add a filmstrip/thumbnail strip below the main scene card showing all scenes as small thumbnails. This provides overview and direct navigation without replacing the detailed single-scene view. Use the empty pre-storyboard space for the topic/category inputs and preview generation flow.

#### 7. Bottom Action Bar is Disconnected
- The fixed bottom bar shows "Generate Storyboard" (pre-storyboard) or "Generate All Images / Generate All Videos" (post-storyboard). It's easy to miss and feels disconnected from the content above.

**Fix:** Move the "Generate Storyboard" action into the main content area near the topic/category inputs. Keep "Generate All" actions as contextual buttons within the storyboard section header, not as a floating footer.

#### 8. Mobile Experience Not Addressed
- Toolbar popovers with 12+ fields are difficult to use on mobile. The side-by-side Image/Video layout in SceneCard breaks on narrow screens (it uses `lg:grid-cols-2` but the single-column fallback stacks two tall panels).

**Fix:** On mobile, convert toolbar popovers into full-screen sheet/drawer modals. Add a tabbed interface within each sheet for grouped fields.

#### 9. No Visual Feedback During Multi-Step Generation
- When generating GRWM previews (default + final look sequentially), the button just says "Generating Preview..." with no indication that it's a two-step process or which step it's on.

**Fix:** Show step progress: "Generating Default Look (1/2)..." then "Generating Final Look (2/2)..."

#### 10. Dot Navigation Doesn't Scale
- Scene navigation uses small dots that become hard to click/distinguish beyond 8-10 scenes.

**Fix:** Replace dots with a numbered thumbnail strip that scrolls horizontally when there are many scenes.

---

### Implementation Plan (Prioritized)

| Priority | Change | Files |
|----------|--------|-------|
| 1 | Add toolbar button status indicators (dot/checkmark for configured items) | `StoryboardToolbar.tsx` |
| 2 | Surface safety terms as inline banner instead of buried in Settings | `AIStudio.tsx`, `StoryboardToolbar.tsx` |
| 3 | Add collapsible sections to Look popover | `StoryboardToolbar.tsx` |
| 4 | Move vlog category/topic inputs into main workspace area | `AIStudio.tsx`, `StoryboardToolbar.tsx` |
| 5 | Add scene thumbnail filmstrip below main scene card | `StudioStoryboard.tsx` |
| 6 | Show two-step progress for GRWM preview generation | `AIStudio.tsx` |
| 7 | Make character preview bar expandable with full config summary | `AIStudio.tsx` |
| 8 | Mobile-optimize toolbar with drawer/sheet modals | `StoryboardToolbar.tsx` |
| 9 | Remove fixed bottom bar, integrate actions contextually | `AIStudio.tsx` |
| 10 | Add quick-look presets to Look popover | `StoryboardToolbar.tsx`, `constants.ts` |
