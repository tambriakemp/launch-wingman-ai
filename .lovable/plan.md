

## Create "AI Twin Formula" Sales Page

### Overview
Recreate the uploaded HTML sales page as a React component at `/ai-twin-formula`, matching the exact layout, content, styling, and dark purple/pink theme.

### Files to Create/Modify

**1. `src/pages/AITwinFormula.tsx`** (new)
- A single large React component that replicates every section from the HTML:
  - Urgency bar (sticky gradient top bar)
  - Hero with gradient background, eyebrow badge, headline, subtitle, CTA buttons, stats
  - Pain section (6 cards with "Sound Familiar?" heading)
  - Story section (blockquote-style origin story with signature)
  - Meet Styl section (centered card with stats)
  - Solution Bridge (7-step numbered list)
  - Modules section (10 module cards + 1 bonus, with left border accent)
  - Who It's For (6 emoji cards)
  - Value Stack (value table with crossed-out prices, total row)
  - Social Proof (3 testimonial cards with star ratings)
  - Pricing section (pricing card with badge, includes list, guarantee box)
  - Guarantee section (shield card)
  - FAQ section (accordion with toggle)
  - Final CTA
  - Footer
- Use inline Tailwind where possible, but for the custom gradients, glass effects, and pseudo-elements, use a scoped CSS approach or inline styles
- FAQ accordion uses local React state
- All CTA links point to `#pricing` with smooth scroll
- External purchase link goes to `https://www.skool.com`

**2. `src/App.tsx`**
- Import `AITwinFormula` page
- Add route: `<Route path="/ai-twin-formula" element={<AITwinFormula />} />`
- Place it with the other public (non-protected) routes

### Design Notes
- This is a standalone page — no app header/sidebar, no `LandingHeader`/`LandingFooter` — it's a self-contained sales page with its own dark theme and footer
- Color scheme: dark navy (`#1A1A2E`), purple (`#7C3AED`), pink (`#D63384`), gold accents (`#B07D2A`)
- All content copied exactly from the HTML
- Fully responsive (mobile breakpoints preserved)

