

## Convert Landing Page to One-Page Long-Scroll Sales Page

### Summary
Replace the current multi-page `Landing.tsx` with a single long-scroll sales page. Predominantly white backgrounds with bold typography. Feature sections organized into four pillars: **Launch**, **Marketing**, **Resources**, and **Planning** — each with compelling copy about what it includes. Remove links to individual feature pages from the header nav.

### Design Direction
- **Mostly white/light** backgrounds with dark (primary) text
- Dark (primary) sections used sparingly for contrast (hero, final CTA)
- Accent (yellow) for highlights, badges, and CTAs
- Large bold headings, generous padding, clean whitespace
- Existing mockup components reused throughout

### Page Structure (top to bottom)

**1. Hero Section** (dark bg — keeps brand impact)
- Bold headline: "Stop Buying Courses. Start Launching."
- Subtitle about AI-powered launch platform
- CTA buttons (Start Free Today + scroll anchor to features)
- DashboardMockup below

**2. Marquee Strip** (accent bg — keep as-is)

**3. Pain Points / "Sound Familiar?"** (white bg)
- Emoji cards showing common frustrations
- Bold heading, clean grid layout

**4. Old Way vs Launchely Way** (white bg)
- Side-by-side comparison cards
- Red X vs green check styling on white

**5. Feature Pillar: LAUNCH** (white bg, left-right layout)
- Subtitle badge: "Launch"
- Heading: "Build Your Funnel. Define Your Offer. Go Live."
- Copy covering: Funnel Builder (8+ types), Offer Stack, Assessments, Launch Readiness
- FunnelBuilderMockup

**6. Feature Pillar: MARKETING** (light gray bg)
- Subtitle badge: "Marketing"
- Heading: "Write Copy That Converts. Content That Connects."
- Copy covering: AI Sales Copy, Transformation Statements, Social Planner, Email Sequences, Hook Generator, Carousel Builder
- SalesCopyMockup + SocialHubMockup

**7. Feature Pillar: RESOURCES** (white bg)
- Subtitle badge: "Resources"
- Heading: "Templates, Presets, and Done-For-You Assets."
- Copy covering: Content Vault, Brand Kit, AI Studio
- BrandingMockup + ContentVaultMockup

**8. Feature Pillar: PLANNING** (light gray bg)
- Subtitle badge: "Planning"
- Heading: "Stay Organized. Stay On Track. Stay Accountable."
- Copy covering: Task Board, Goals, Calendar, Habits, Daily Page, Weekly Review, Brain Dump, Insights
- TasksMockup

**9. AI Section** (dark bg for contrast)
- "Your AI Launch Team" — grid of AI capabilities
- TransformationMockup

**10. How It Works** (white bg)
- 3 steps: Assessment → Follow Plan → Launch
- Numbered cards

**11. Built For** (white bg)
- Audience pills (coaches, creators, etc.)
- Stats row

**12. FAQ** (white bg)
- Accordion-style questions

**13. Final CTA** (dark bg)
- Bold closing headline + CTA button

**14. Footer** (dark bg — keep existing LandingFooter)

### Files Changed

**1. `src/pages/Landing.tsx`** — Full rewrite
- Remove feature card grid linking to sub-pages
- Add the 4 pillar sections with rich copy
- Use white/light-gray alternating backgrounds
- Import additional mockups (SalesCopyMockup, SocialHubMockup, BrandingMockup, ContentVaultMockup)
- Add pain points section
- Add FAQ accordion
- Add "Built For" audience section

**2. `src/components/landing/LandingHeader.tsx`** — Simplify nav
- Remove Features dropdown (no more sub-pages)
- Keep: Pricing, Sign In, Get Started
- Add smooth-scroll anchor links: "Features", "How It Works" (scroll to sections on the page)
- Change header bg to white with dark text when not at top (scroll-aware), or keep dark

**3. No other files deleted** — Feature sub-pages stay in the codebase (accessible via direct URL) but are no longer linked from the main nav

### Technical Notes
- Smooth scroll via `id` anchors on sections + `scroll-behavior: smooth`
- All existing mockup components reused as-is
- LandingFooter stays unchanged
- SalesFunnel.tsx (`/go`) remains untouched — it's a separate campaign page

