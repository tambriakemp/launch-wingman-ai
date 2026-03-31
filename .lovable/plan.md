

## Move Pricing to Landing Page & Delete Pricing Page

### Summary
Move the pricing cards, comparison table, and pricing FAQs from `Pricing.tsx` into `Landing.tsx` — inserted after the "Built For You" section. Merge FAQs (deduplicating overlaps). Update all `/pricing` links to scroll anchors. Remove the Pricing route and page file.

### FAQ Merge Strategy
**Landing FAQs** (6): free to start, tech skills, vs course, branding, relaunched before, funnel software
**Pricing FAQs** (6): upgrade/downgrade, projects on downgrade, Content Vault, free trial, billing, refunds

No true duplicates — "free trial" and "free to start" overlap slightly. Keep the landing version ("Is Launchely really free to start?") and drop the pricing one ("Is there a free trial for Pro?"). All other pricing FAQs get added.

### Changes

**1. `src/pages/Landing.tsx`**
- Add `plans` array and comparison table data (from Pricing.tsx)
- Add `Package` to lucide imports
- Insert new sections between "Built For You" and "FAQ":
  - **Pricing header** — "Simple, Transparent Pricing" with subtext (white bg, not dark hero)
  - **Pricing cards** — 4-column grid (same markup as Pricing.tsx)
  - **Compare Plans table** — same comparison table (light gray bg)
- Merge pricing FAQs into the existing `faqs` array (drop the "free trial" one, add the other 5)
- Change the final CTA "View Pricing" button from `Link to="/pricing"` to an anchor scroll `href="#pricing"` or `onClick` scroll
- Add `id="pricing"` to the pricing section

**2. `src/components/landing/LandingHeader.tsx`**
- Change Pricing `<Link to="/pricing">` to a smooth-scroll anchor (same pattern as Features/How It Works)
- Update both desktop and mobile nav

**3. `src/components/landing/LandingFooter.tsx`**
- Change Pricing href from `/pricing` to `/#pricing`

**4. `src/pages/Checkout.tsx`**
- Change the back link from `/pricing` to `/#pricing`

**5. `src/pages/HowItWorks.tsx`**
- Change "View Pricing" link from `/pricing` to `/#pricing`

**6. `src/pages/project/SalesCopyTask.tsx`**
- Change navigate('/pricing') to navigate('/#pricing') or navigate('/', { ... }) with scroll

**7. `src/App.tsx`**
- Remove the `/pricing` route and the Pricing import

**8. Delete `src/pages/Pricing.tsx`**

### No database changes needed

