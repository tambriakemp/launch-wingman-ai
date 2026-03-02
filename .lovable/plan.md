

## Standardize Headers for AI Studio, Social Planner, and Assessments

### Overview
Three pages need their headers updated to match the standardized pattern (colored icon container + title + subtitle) used across all other main navigation pages.

### Changes

**1. Social Planner (`src/components/content/ContentTab.tsx`)**
- Replace the plain `<h1>Social Planner</h1>` (line 118) with the standard header layout: a teal/cyan icon container with a `Calendar` icon, title, and subtitle
- Keep the action buttons (Generate, Create Post) on the right side of the same bar
- Maintain the full-height calendar layout below

**2. Assessments (`src/pages/Assessments.tsx`)**
- Replace the current motion-wrapped header (lines 180-188) with the standard layout: `max-w-7xl mx-auto px-6 py-8` container, a purple icon container with `ClipboardCheck` icon, title "Assessments", and subtitle
- Update the outer container from `max-w-4xl` to `max-w-7xl` to match standard width

**3. AI Studio (`src/pages/AIStudio.tsx`)**
- The header icon/title/subtitle (lines 596-603) is already correct
- Move the action buttons (Projects, Save, Script, All, Help, New) from the right side of the header to sit on the same row as the Settings popovers toolbar below
- This consolidates the two toolbar rows into a cleaner layout while keeping the standard header prominent

### Technical Details

**ContentTab.tsx** header bar changes (line 116-119):
```text
Current:  <h1>Social Planner</h1>
New:      [teal icon] Social Planner / Plan and schedule your social content.
```
The action buttons remain on the right side of this bar.

**Assessments.tsx** changes (lines 178-188):
- Wrap content in `max-w-7xl mx-auto px-6 py-8`
- Replace motion header with standard icon + title + subtitle pattern using `ClipboardCheck` in a purple container

**AIStudio.tsx** header changes (lines 595-637):
- Keep the sticky header with standard icon/title/subtitle on the left
- Move Projects, Save, Script, All, Help, New buttons down to merge with the settings toolbar row (the row with Character, Environment, Look, Settings popovers)
- The sticky header row keeps only the icon, title, subtitle, and queue status indicator
