

## SEO & Meta Tag Upgrades for Landing Page

Goal: improve search ranking, social previews, and AI/LLM crawlability for `/` (and a few other public pages) without touching app architecture or auth flows.

### What changes the user will see
- Richer Google search snippet (organization sitelinks, breadcrumbs, FAQ rich result eligibility).
- Better Twitter/LinkedIn/Facebook link previews with proper image, title, and description.
- Per-route `<title>` and `<meta description>` instead of the single hardcoded one in `index.html`.
- Faster discovery by AI crawlers (GPTBot, ClaudeBot, Perplexity) via expanded `robots.txt`.

### Implementation

**1. Add `<Helmet>` to `src/pages/Landing.tsx`** (uses already-installed `react-helmet-async` + `HelmetProvider` already in `main.tsx`):
- `<title>`: "Launchely — AI-Powered Launch Planning for Coaches & Digital Marketers"
- `<meta name="description">`: keyword-rich, ~155 chars, mentions funnels/AI/coaches.
- Open Graph: `og:title`, `og:description`, `og:image` (absolute URL), `og:url`, `og:type=website`, `og:site_name=Launchely`, `og:locale=en_US`.
- Twitter: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:site=@launchely`.
- `<link rel="canonical" href="https://launchely.com/">`.
- JSON-LD scripts (3 blocks):
  - **Organization** schema (name, url, logo, sameAs).
  - **WebSite** schema with `SearchAction` (enables Google sitelinks search box).
  - **FAQPage** schema generated from the existing FAQ accordion items already in `Landing.tsx` (rich-result eligible).
  - **SoftwareApplication** schema (category, offers/pricing, aggregateRating placeholder if appropriate — will omit ratings to avoid policy violations).

**2. Add `<Helmet>` blocks to other public pages** with unique titles/descriptions/canonicals + OG tags:
- `src/pages/HowItWorks.tsx`
- `src/pages/About.tsx` (if present)
- `src/pages/Pricing.tsx` (if present, otherwise it's a section on Landing)
- `src/pages/Contact.tsx`
- `src/pages/Blog.tsx` and individual blog post pages
- `src/pages/Privacy.tsx`, `src/pages/Terms.tsx`
- Each gets a `BreadcrumbList` JSON-LD pointing back to `/`.

**3. Clean up `index.html`**:
- Remove the now-redundant `<title>` and meta tags (Helmet will overwrite them at runtime, but keeping defaults as a fallback for crawlers without JS execution is fine — will keep generic defaults and let Helmet overwrite for JS-capable crawlers).
- Add `<meta name="robots" content="index,follow,max-image-preview:large">` for richer Google previews.
- Add `<meta name="theme-color">` for mobile browser chrome.
- Add `<link rel="alternate" hreflang="en" href="https://launchely.com/">`.

**4. Expand `public/robots.txt`**:
- Add explicit `Allow:` rules for marketing routes (/, /how-it-works, /pricing, /about, /blog, /go, /features/*).
- Add bot-specific blocks for `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` — set to `Allow: /` for marketing pages so the brand surfaces in AI answers.
- Keep existing disallows for `/app`, `/projects/`, `/admin`, etc.

**5. Verify `public/sitemap.xml`** — already exists and is good; will add `<lastmod>` dates to each URL and ensure all newly meta-tagged routes are present.

**6. Add `public/og-image.png` reference check** — the file is already referenced in `index.html` at `https://launchely.com/og-image.png`. Will verify it exists in `/public`; if missing, will note that the user needs to upload one (1200×630 PNG recommended).

### What stays the same
- No changes to `src/main.tsx`, `App.tsx`, routing, auth, or any `/app` route.
- No new dependencies — `react-helmet-async` is already installed and `HelmetProvider` is already wrapping the app.
- No build pipeline changes. No SSG. No hydration changes.

### Risks
- **Near zero.** Helmet writes to `<head>` after mount; even if it fails, `index.html` defaults remain. Worst case: meta tags don't update → no regression vs. today.
- Google may take 1–4 weeks to recrawl and surface improvements.

### Files to change
- `src/pages/Landing.tsx` (add `<Helmet>` block + 3 JSON-LD scripts)
- `src/pages/HowItWorks.tsx`, `About.tsx`, `Contact.tsx`, `Blog.tsx`, `Privacy.tsx`, `Terms.tsx`, plus `/features/*` pages (add `<Helmet>` per page)
- `index.html` (add robots/theme-color/hreflang meta; keep title/description as fallback)
- `public/robots.txt` (add AI bot allowances + marketing route allow rules)
- `public/sitemap.xml` (add `<lastmod>`)

### Deliverable
After approval, I'll apply the changes and include a copy of the exact JSON-LD blocks added so you can validate them in [Google's Rich Results Test](https://search.google.com/test/rich-results).

