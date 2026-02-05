

# Create Multi-Step Onboarding Flow

## Overview

This plan implements a 7-screen onboarding experience that displays once after registration, helping new users understand Launchely's value proposition, workflow, and features before creating their first project. The design follows the CoSchedule-style reference: clean, centered layouts with minimal illustrations, professional SaaS aesthetic, and clear navigation.

---

## Architecture

### Data Model

Add an `onboarding_completed_at` column to the `profiles` table to track whether a user has completed onboarding:

```sql
ALTER TABLE profiles 
ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
```

### Flow Logic

```text
User signs up / signs in
         |
         v
  Check profiles.onboarding_completed_at
         |
    +----+----+
    |         |
  NULL     Not NULL
    |         |
    v         v
  Show      Go to
Onboarding   /app
```

---

## Implementation Plan

### 1. Database Migration

Add `onboarding_completed_at` column to `profiles` table to track completion status.

### 2. Create Onboarding Components

**New Files:**

| File | Purpose |
|------|---------|
| `src/pages/Onboarding.tsx` | Main onboarding page with step navigation |
| `src/components/onboarding/OnboardingStep.tsx` | Reusable step wrapper component |
| `src/components/onboarding/WelcomeStep.tsx` | Step 1: Hero introduction |
| `src/components/onboarding/PhasesStep.tsx` | Step 2: Phase-based workflow |
| `src/components/onboarding/TasksStep.tsx` | Step 3: Task guidance |
| `src/components/onboarding/AIStep.tsx` | Step 4: AI assistance |
| `src/components/onboarding/ResourcesStep.tsx` | Step 5: Content Vault resources |
| `src/components/onboarding/CommunityStep.tsx` | Step 6: Skool community |
| `src/components/onboarding/ReadyStep.tsx` | Step 7: Final CTA |

### 3. Onboarding Page Layout

Inspired by the CoSchedule screenshots:

```text
+-----------------------------------------------+
|                                               |
|              [Launchely Logo]                 |
|                                               |
|   +---------------------------------------+   |
|   |                                       |   |
|   |           [Headline]                  |   |
|   |           [Subtext]                   |   |
|   |                                       |   |
|   |    [Visual/Illustration/Timeline]     |   |
|   |                                       |   |
|   +---------------------------------------+   |
|                                               |
|      [Back]             [Step Dots]   [Next]  |
|                                               |
+-----------------------------------------------+
```

### 4. Step Content Details

**Step 1: Welcome**
- Headline: "Stop buying courses. Start launching."
- Subtext: "Launchely helps you plan, build, and launch a real offer using guided steps and AI support - without overwhelm."
- Primary Button: "Get started"
- Secondary Link: "See how it works" (opens /how-it-works in new tab)
- Visual: Simple illustration with checkmarks

**Step 2: Phases**
- Headline: "Everything is organized into phases"
- Subtext: "Each project walks you through Planning, Messaging, Build, and Launch - so you always know what to do next."
- Visual: Horizontal phase timeline with icons (Planning -> Messaging -> Build -> Content -> Launch)

**Step 3: Tasks**
- Headline: "No guessing. Just next steps."
- Subtext: "Each phase is broken into small, focused tasks with time estimates, guidance, and optional AI help."
- Visual: Checklist-style bullets showing example tasks

**Step 4: AI Support**
- Headline: "AI support, when you need it"
- Subtext: "Use AI to clarify, simplify, or get unstuck - without replacing your voice or decisions."
- Visual: Feature callout cards (Listen to explanation, Generate examples, Simplify responses)

**Step 5: Resources**
- Headline: "Launch faster with built-in resources"
- Subtext: "Pro users get access to templates, planners, Canva assets, and workbooks - so you don't start from scratch."
- Note: "Free users can still launch with their own content."
- Visual: Grid of resource type icons

**Step 6: Community**
- Headline: "Support when you get stuck"
- Subtext: "Join the Skool community to ask questions, get feedback, and launch alongside others using Launchely."
- CTA Button: "Join the community" (external link to Skool)
- Visual: Community/users illustration

**Step 7: Ready**
- Headline: "Ready to launch something real?"
- Subtext: "Create your first project and start with the Planning phase. One step at a time."
- Primary Button: "Create my first project"
- Visual: Rocket or launch illustration

### 5. Navigation Logic

- Step indicators (dots) showing progress
- "Back" button (hidden on step 1)
- "Next" button advances through steps
- On final step, "Create my first project" marks onboarding complete and redirects to `/app`
- Skip option available via keyboard shortcut or subtle link

### 6. Update Auth Flow

Modify `AuthContext.tsx` to check onboarding status after login/signup:

```typescript
// After successful sign in
const { data: profile } = await supabase
  .from('profiles')
  .select('onboarding_completed_at')
  .eq('user_id', user.id)
  .single();

if (!profile?.onboarding_completed_at) {
  navigate('/onboarding');
} else {
  navigate('/app');
}
```

### 7. Add Route

Update `App.tsx` to include the onboarding route:

```typescript
<Route
  path="/onboarding"
  element={
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  }
/>
```

---

## Visual Design Specifications

| Element | Style |
|---------|-------|
| Background | Light neutral (`bg-background`) |
| Card/Container | White with subtle shadow, max-width 800px |
| Headlines | text-2xl or text-3xl, font-bold, text-foreground |
| Subtext | text-muted-foreground, max-width for readability |
| Primary Button | Solid black (`bg-primary`), lg size |
| Secondary/Skip | Ghost or link variant |
| Step Dots | Small circles, filled for current/completed |
| Icons | Lucide icons, consistent sizing |
| Animations | Subtle framer-motion fade/slide transitions |

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database Migration | Create | Add `onboarding_completed_at` column |
| `src/pages/Onboarding.tsx` | Create | Main onboarding flow container |
| `src/components/onboarding/OnboardingStep.tsx` | Create | Reusable step wrapper |
| `src/components/onboarding/WelcomeStep.tsx` | Create | Step 1 content |
| `src/components/onboarding/PhasesStep.tsx` | Create | Step 2 content |
| `src/components/onboarding/TasksStep.tsx` | Create | Step 3 content |
| `src/components/onboarding/AIStep.tsx` | Create | Step 4 content |
| `src/components/onboarding/ResourcesStep.tsx` | Create | Step 5 content |
| `src/components/onboarding/CommunityStep.tsx` | Create | Step 6 content |
| `src/components/onboarding/ReadyStep.tsx` | Create | Step 7 content |
| `src/App.tsx` | Modify | Add `/onboarding` route |
| `src/contexts/AuthContext.tsx` | Modify | Check onboarding status after auth |
| `src/pages/AppRedirect.tsx` | Modify | Redirect new users to onboarding |

---

## Mobile Responsiveness

- Stack layouts vertically on mobile
- Full-width buttons
- Reduce padding/margins for smaller screens
- Timeline becomes vertical on mobile
- Touch-friendly step navigation

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User refreshes during onboarding | Resume at current step (stored in state/URL) |
| User directly navigates to /app | Check onboarding status, redirect if incomplete |
| User skips onboarding | Allow skip, mark as completed |
| Existing users (before feature) | Treat as completed (migration sets default) |

---

## Future Enhancements

- Personalization based on assessment results
- Video tutorials embedded in steps
- A/B testing different onboarding flows
- Analytics tracking for step completion rates

