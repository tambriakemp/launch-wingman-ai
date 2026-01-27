
# Block Scheduling Until Requirements Are Met

## Overview

This change adds validation that prevents users from scheduling posts until all platform-specific requirements are fulfilled. Users can still save as drafts, but the Schedule and Post Now buttons will be disabled with clear messaging about what's missing.

---

## The Problem

Currently, users can click "Schedule" even when:
- Pinterest is selected but no board is chosen
- Instagram/Pinterest is selected but no media is uploaded
- TikTok is selected but no privacy level is set

The validation happens **after** they select a date/time in the ScheduleModal, causing frustration and missed scheduled posts.

---

## Solution

Validate requirements **before** allowing users to open the schedule modal or post:
1. Create a computed `getRequirementErrors()` function that returns missing requirements
2. Disable Schedule and Post Now buttons when requirements aren't met
3. Add tooltip feedback showing what's missing
4. Keep Draft button enabled (drafts don't need all requirements)

---

## What Will Change

| Current State | New State |
|--------------|-----------|
| Schedule button enabled with just platform selected | Schedule button disabled until requirements met |
| Post Now button enabled with just platform selected | Post Now button disabled until requirements met |
| Validation errors shown after clicking | Tooltip shows missing requirements before clicking |
| Warning banner shown but not enforced | Requirements enforced at button level |

---

## Implementation Details

### 1. Add Requirements Validation Logic

Create a new computed function that returns an array of missing requirements (without triggering toasts):

```typescript
// Returns array of missing requirement messages (empty = ready to schedule)
const getRequirementErrors = (): string[] => {
  const errors: string[] = [];
  
  if (!formData.scheduled_platforms.length) {
    errors.push("Select at least one platform");
    return errors; // Return early - no point checking platform-specific reqs
  }
  
  // Check each selected platform
  for (const platform of formData.scheduled_platforms) {
    // Content requirement (not for TikTok)
    const isTikTok = platform === "tiktok" || platform === "tiktok_sandbox";
    if (!isTikTok && !content?.trim()) {
      errors.push("Post content is required");
    }
    
    // Platform-specific
    if (platform === "pinterest") {
      if (!formData.media_url) errors.push("Pinterest: Image required");
      if (!formData.pinterest_board_id) errors.push("Pinterest: Board required");
    } else if (platform === "instagram") {
      if (!formData.media_url) errors.push("Instagram: Media required");
    } else if (platform === "tiktok" || platform === "tiktok_sandbox") {
      const hasMedia = formData.tiktok_photo_urls.length > 0 || !!formData.media_url;
      if (!hasMedia) errors.push("TikTok: Media required");
      if (!formData.tiktok_privacy_level) errors.push("TikTok: Privacy level required");
      // Commercial disclosure validation
      if (formData.tiktok_disclose_content && 
          !formData.tiktok_brand_organic && 
          !formData.tiktok_brand_content) {
        errors.push("TikTok: Select disclosure option");
      }
    }
  }
  
  // Remove duplicates (e.g., "Post content is required" might appear multiple times)
  return [...new Set(errors)];
};
```

### 2. Create Computed Values

Add computed values derived from the requirements check:

```typescript
const requirementErrors = getRequirementErrors();
const canSchedule = requirementErrors.length === 0;
const canPostNow = requirementErrors.length === 0;
```

### 3. Update Schedule Button

Update the Schedule button to be disabled and show a tooltip when requirements aren't met:

```tsx
{/* Schedule button with requirements validation */}
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-block"> {/* Wrapper for disabled button tooltip */}
        <Button
          variant="outline"
          onClick={() => {
            setIsDraftScheduleMode(false);
            setShowScheduleModal(true);
          }}
          disabled={!canSchedule}
          className="rounded-r-none border-r-0"
        >
          <Clock className="w-4 h-4 mr-2" />
          {isAlreadyScheduled && !isDraftContent ? "Reschedule" : "Schedule"}
        </Button>
      </span>
    </TooltipTrigger>
    {!canSchedule && requirementErrors.length > 0 && (
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium mb-1">Missing requirements:</p>
        <ul className="text-xs list-disc pl-3">
          {requirementErrors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      </TooltipContent>
    )}
  </Tooltip>
</TooltipProvider>
```

### 4. Update Post Now Button

Apply the same validation to the Post Now button:

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-block">
        <Button
          onClick={handlePostNow}
          disabled={isPosting || !canPostNow}
          className="bg-rose-500 hover:bg-rose-600 flex-1 md:flex-initial"
        >
          {isPosting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          <span className="hidden sm:inline">Post Now</span>
          <span className="sm:hidden">Post</span>
        </Button>
      </span>
    </TooltipTrigger>
    {!canPostNow && requirementErrors.length > 0 && (
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium mb-1">Missing requirements:</p>
        <ul className="text-xs list-disc pl-3">
          {requirementErrors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      </TooltipContent>
    )}
  </Tooltip>
</TooltipProvider>
```

### 5. Add Tooltip Imports

Add the Tooltip components to the imports:

```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
```

---

## Visual Appearance

When requirements aren't met:

```text
┌──────────────────────────────────────────────────────────────────┐
│  Footer                                                          │
│                                                                  │
│  [Draft]     [Post Now (disabled)]  [Schedule (disabled)] [▼]   │
│                      │                     │                     │
│                      ▼                     ▼                     │
│              ┌─────────────────────────────────────┐             │
│              │ Missing requirements:               │             │
│              │ • Pinterest: Board required         │             │
│              │ • Pinterest: Image required         │             │
│              └─────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

When requirements are met:

```text
┌──────────────────────────────────────────────────────────────────┐
│  Footer                                                          │
│                                                                  │
│  [Draft]     [Post Now]              [Schedule]          [▼]    │
│               (enabled)               (enabled)                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Behavior Summary

| Button | When Disabled | When Enabled |
|--------|---------------|--------------|
| Draft | Only when content is empty | Always (requirements not needed for drafts) |
| Post Now | When any requirement is missing OR posting | When all requirements met AND not posting |
| Schedule | When any requirement is missing | When all requirements met |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/content/PostEditorSheet.tsx` | Add `getRequirementErrors()`, add tooltip imports, update button disabled states and add tooltips |

---

## Technical Notes

- Draft functionality remains unchanged - users can save drafts without meeting all requirements
- The existing `validatePostRequirements()` function in `handleSchedule` serves as a backup validation
- Tooltips use the existing shadcn/ui Tooltip component
- Requirements are checked for all selected platforms (not just the first one)
- Duplicate error messages are filtered out using `Set`
