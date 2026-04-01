

## Simplify Carousel Settings & Reorder Sections

### Changes — single file: `src/components/ai-studio/StoryboardToolbar.tsx`

**1. Hide "Number of Slides" slider when in carousel mode**
- In the Creation Mode section (~line 170-186), wrap the "Number of Slides" block so it only shows when mode is NOT carousel
- "Number of Scenes" (already present below) serves the same purpose for carousel

**2. Move Setting & Message section to last**
- Reorder the collapsible sections inside the sheet from:
  1. Creation Mode → 2. Setting & Message → 3. Character → 4. Environment → 5. Look & Style
- To:
  1. Creation Mode → 2. Character → 3. Environment → 4. Look & Style → 5. Setting & Message

**3. Improve carousel field labels for clarity**
- Change "Setting / Environment" label to "Scene Description" or keep as-is with better placeholder text
- Change "Message / Theme" label to "Story / Caption Theme" with a clearer placeholder
- These are minor label tweaks to reduce confusion

