

# AI-Powered Social Media Bio Generation

## Overview

This plan modifies the Social Media Bio Builder to:
1. **Always enable the "Generate Bio" button** (remove the `disabled={!hasAllFields}` condition)
2. **Create a new edge function** (`generate-social-bio`) that uses full project context from planning and messaging phases to craft a high-converting bio using the selected formula
3. **Add loading state** while the AI generates the bio
4. **Update the UI** to show any user-provided field values are used as hints, but the AI can fill in missing pieces

---

## Current Problem

The button on line 616-618 of `SocialBioBuilder.tsx` is disabled when fields are empty:
```tsx
<Button 
  onClick={() => setIsGenerated(true)} 
  disabled={!hasAllFields}  // This prevents clicking when fields are empty
  className="w-full"
>
```

---

## Solution Architecture

```text
+-------------------+     +------------------------+     +----------------------+
|  SocialBioBuilder |---->|  generate-social-bio   |---->|  AI Gateway          |
|  Component        |     |  Edge Function         |     |  (Gemini 2.5 Flash)  |
+-------------------+     +------------------------+     +----------------------+
        |                           |
        |  Sends:                   |  Fetches:
        |  - projectId              |  - funnel (niche, audience, pain, outcome)
        |  - platform               |  - offers (title, description)
        |  - formulaId              |  - project (transformation statement)
        |  - fieldData (optional)   |  - messaging tasks (core message, talking points)
        |                           |
        +---------------------------+
```

---

## Part 1: Create Edge Function

**File:** `supabase/functions/generate-social-bio/index.ts`

The edge function will:
1. Accept `projectId`, `platform`, `formulaId`, and optional `fieldData`
2. Fetch full project context (funnel, offers, project, completed tasks)
3. Build a prompt that incorporates the bio formula structure
4. Generate a bio that fits the platform's character limit
5. Return the generated bio content

### Key Context to Include
| Source | Data |
|--------|------|
| `funnels` table | niche, target_audience, primary_pain_point, desired_outcome |
| `offers` table | title, description, transformation_statement |
| `projects` table | transformation_statement, name |
| `project_tasks` table | core_message, talking_points from messaging phase |

### Prompt Strategy
The AI will receive:
- The selected bio formula template (e.g., "I help [who] [achieve result] using [method]")
- Any user-provided field values (used as hints/preferences)
- Full project context
- Platform character limit

The AI generates a complete bio that:
- Follows the formula structure
- Uses project context to fill in missing fields
- Respects platform character limits
- Sounds natural and converting

---

## Part 2: Update SocialBioBuilder Component

**File:** `src/components/SocialBioBuilder.tsx`

### Changes

1. **Add loading state**
```tsx
const [isGenerating, setIsGenerating] = useState(false);
```

2. **Remove disabled condition from Generate button** (line 616-618)
```tsx
// Before
disabled={!hasAllFields}

// After
disabled={isGenerating}
```

3. **Add AI generation function**
```tsx
const handleGenerateBio = async () => {
  if (!selectedPlatform || !selectedFormula) return;
  
  setIsGenerating(true);
  try {
    const { data, error } = await supabase.functions.invoke('generate-social-bio', {
      body: {
        projectId,
        platform: selectedPlatform,
        formulaId: selectedFormula,
        fieldData, // Any user-provided hints
        maxChars: platform?.maxChars || 150,
      }
    });
    
    if (error) throw error;
    
    // Set the generated content and switch to preview mode
    setFieldData(prev => ({
      ...prev,
      ...data.fieldData,  // Fill in any field values AI determined
      finalContent: data.bio,
    }));
    setIsGenerated(true);
  } catch (error) {
    toast.error("Failed to generate bio. Please try again.");
    console.error(error);
  } finally {
    setIsGenerating(false);
  }
};
```

4. **Update button click handler and appearance**
```tsx
<Button 
  onClick={handleGenerateBio} 
  disabled={isGenerating}
  className="w-full"
>
  {isGenerating ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Generating...
    </>
  ) : (
    <>
      <Sparkles className="w-4 h-4 mr-2" />
      Generate Bio
    </>
  )}
</Button>
```

5. **Add Loader2 import**
```tsx
import { ..., Loader2 } from "lucide-react";
```

---

## Part 3: Edge Function Implementation Details

**File:** `supabase/functions/generate-social-bio/index.ts`

### System Prompt Structure
```text
You are an expert at writing high-converting social media bios that 
capture attention and communicate value clearly.

Your task is to generate a social media bio using this formula:
[FORMULA: I help [who] [achieve result] using [method].]

The bio MUST:
1. Follow the formula structure exactly
2. Be no more than [MAX_CHARS] characters
3. Be specific and compelling, not generic
4. Sound natural and human, not salesy
5. Use the project context to make it relevant and specific

PROJECT CONTEXT:
- Niche: [niche]
- Target Audience: [target_audience]
- Main Pain Point: [primary_pain_point]
- Desired Outcome: [desired_outcome]
- Transformation Statement: [transformation_statement]
- Core Message: [core_message]
- Offer: [offer_title] - [offer_description]

USER HINTS (if provided):
[Any field values the user has already entered]

Return a JSON object:
{
  "bio": "The complete bio text",
  "fieldData": {
    "who": "value used for this field",
    "result": "value used for this field",
    ...
  }
}
```

---

## Files to Create/Update

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/generate-social-bio/index.ts` | Create | New edge function for AI bio generation |
| `src/components/SocialBioBuilder.tsx` | Update | Enable button always, add loading state, add AI generation call |

---

## UI Flow

### Before (Current)
1. User fills all formula fields manually
2. Button becomes enabled
3. Click generates bio from fields only

### After (New)
1. User can optionally fill some fields as hints
2. Button is always enabled
3. Click calls AI which:
   - Fetches full project context
   - Uses any user hints provided
   - Fills in remaining fields intelligently
   - Generates a complete bio following the formula
4. User sees preview with generated bio + filled field values

---

## Edge Cases

1. **No project context available**: AI generates best-effort bio from formula + any hints
2. **Rate limit hit (429)**: Show friendly error, allow retry
3. **Bio exceeds character limit**: AI is instructed to stay under limit; if it fails, user can edit in preview
4. **User provides partial hints**: AI uses them and fills in the rest from context

