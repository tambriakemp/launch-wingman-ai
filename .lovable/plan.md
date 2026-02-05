

# Remove "See how it works" Link from Welcome Step

## Overview

Remove the secondary "See how it works" link from the first onboarding screen to simplify the welcome step and focus users on the primary "Get started" action.

---

## Current State

The WelcomeStep component currently displays:
- Primary button: "Get started"
- Secondary link: "See how it works" (links to /how-it-works)

---

## Change Required

**File to modify:** `src/components/onboarding/WelcomeStep.tsx`

Remove the anchor element containing the "See how it works" link and the `ExternalLink` icon import since it will no longer be needed.

**Before:**
```tsx
<div className="flex flex-col items-center gap-3">
  <Button size="lg" onClick={onNext} className="min-w-48">
    Get started
    <ArrowRight className="w-4 h-4 ml-2" />
  </Button>
  <a
    href="/how-it-works"
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
  >
    See how it works
    <ExternalLink className="w-3 h-3" />
  </a>
</div>
```

**After:**
```tsx
<Button size="lg" onClick={onNext} className="min-w-48">
  Get started
  <ArrowRight className="w-4 h-4 ml-2" />
</Button>
```

---

## Summary

| File | Change |
|------|--------|
| `src/components/onboarding/WelcomeStep.tsx` | Remove "See how it works" link and ExternalLink import |

