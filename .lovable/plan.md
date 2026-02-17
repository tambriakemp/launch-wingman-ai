
# Long-Form Sales Funnel Page for Launchely

## Overview
Create a dedicated long-form sales funnel page at `/go` (or similar short route) that can be pointed to via a subdomain. The page will be a high-converting, scroll-based sales page promoting free signup, using Launchely's existing black/yellow branding, app mockup components, and proven copywriting structure.

## Page Structure

The page follows classic long-form funnel structure with multiple CTA sections throughout:

### Section 1 -- Hero / Headline
- Bold problem-aware headline: "You Don't Need Another Course to Launch"
- Sub-headline addressing the pain point
- First CTA button: "Start Free Today" linking to `/auth?tab=signup`
- DashboardMockup below the CTA

### Section 2 -- Problem Agitation
- "Sound familiar?" section listing common frustrations coaches face
- Bought courses, watched hours of content, still stuck
- Emotional, relatable copy in a card-based layout

### Section 3 -- The Bridge / Solution Intro
- Introduce Launchely as the alternative
- "What if you could skip the course and go straight to launching?"
- FunnelBuilderMockup showing the planning interface

### Section 4 -- Feature Walkthrough (Visual + Copy)
- 4-5 key features, each with a mockup and persuasive copy:
  - AI-Powered Sales Copy (SalesCopyMockup)
  - Funnel Planning (FunnelBuilderMockup)
  - Task Management (TasksMockup)
  - Social Planner (SocialHubMockup)
  - Brand Kit (BrandingMockup)
- Alternating left/right layout for visual variety
- Mid-section CTA button

### Section 5 -- Old Way vs Launchely Way
- Side-by-side comparison (reuse existing pattern from Landing)
- Emphasize cost, time, and complexity savings

### Section 6 -- How It Works (3 Steps)
- Simple 3-step process with numbered cards
- CTA after steps

### Section 7 -- AI Features Highlight
- Grid of AI capabilities with icons
- Emphasize "no prompt engineering needed"

### Section 8 -- Social Proof / Trust
- "Built for Coaches, Course Creators, and Online Entrepreneurs"
- Bullet list of who this is for
- Trust badges/stats (AI-Powered, 8+ Funnel Types, All-in-One Platform)

### Section 9 -- FAQ Section
- 5-6 common objections answered
- Accordion-style using existing Radix accordion component

### Section 10 -- Final CTA
- Strong closing headline: "Your Next Launch Starts Here"
- Large CTA button
- "Free forever plan. No credit card required."
- LaunchelyLogo at the bottom

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/SalesFunnel.tsx` | The long-form sales funnel page |

### Files to Modify
| File | Change |
|------|--------|
| `src/App.tsx` | Add route `/go` for the sales funnel page |

### Key Implementation Details
- Uses existing components: `LandingHeader`, `LandingFooter`, `BrowserFrame`, all mockup components (Dashboard, FunnelBuilder, SalesCopy, Tasks, SocialHub, Branding)
- Uses `LaunchelyLogo` component
- All CTAs link to `/auth?tab=signup`
- Uses `framer-motion` for scroll-triggered animations (consistent with existing landing pages)
- Fully responsive with mobile-first approach
- Uses existing Tailwind theme colors (bg-primary, bg-accent, text-accent-foreground, etc.)
- No header navigation links to keep focus on conversion -- uses a minimal sticky header with logo + single CTA button
- FAQ uses Radix Accordion component already installed

### Route
- `/go` -- short, clean URL ideal for subdomain pointing (e.g., `go.launchely.com`)
- Public route (no auth required)

### Mockups Used
- DashboardMockup (hero)
- FunnelBuilderMockup (planning section)
- SalesCopyMockup (messaging section)
- TasksMockup (execute section)
- SocialHubMockup (social planner section)
- BrandingMockup (branding section)
- TransformationMockup (AI section)

### Copy Tone
- Direct, confident, coach-friendly language
- Problem-agitate-solve structure
- Short paragraphs, scannable
- Yellow accent highlights on key phrases
- No jargon -- speaks to coaches/creators, not developers
