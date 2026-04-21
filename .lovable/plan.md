

## Restyle Sidebar, Topbar & Project Dashboard — Editorial Cream + Terracotta

Bring the signed-in app (`/projects/:id/dashboard`, all other ProjectLayout pages) onto the same Editorial Cream + Terracotta design system used by the landing page. All current navigation items, routes, and functionality stay exactly the same — only the look/feel changes.

### Theme rollout

Promote the cream + terracotta palette from a landing-only scope to an opt-in **app theme**:

- Move the palette tokens out of `.landing-theme` into a new `.app-cream` class so both the landing page and the signed-in app can opt in (landing page keeps using it; the new ProjectLayout wraps everything in `.app-cream`).
- Add **sidebar token overrides** inside the same scope so the existing dark `--sidebar-*` variables become cream/ink for the rail and flyout:
  - `--sidebar-background: 38 60% 98%` (paper-50, slightly warmer than canvas)
  - `--sidebar-foreground: 30 9% 33%` (muted ink)
  - `--sidebar-primary: 13 56% 51%` (terracotta — active indicator)
  - `--sidebar-accent: 35 35% 92%` (cream hover)
  - `--sidebar-accent-foreground: 30 9% 10%` (ink)
  - `--sidebar-border: 35 28% 87%` (hairline)
- Keep the dark theme tokens untouched in `:root` so any non-app pages we haven't restyled stay safe.

### Topbar (new — matches uploaded HTML exactly)

Rebuild `TopBar.tsx`:

- Layout: `flex justify-between items-center`, padding `12px 40px` (responsive `px-3 md:px-10`), height auto, `border-b border-hairline`, sticky top-0, **translucent cream background** `rgba(251,247,241,0.85)` with `backdrop-blur(12px)`.
- **Left — Breadcrumbs**: small Plus Jakarta Sans 13px, muted ink. Format: `Section / Page` where the active page is rendered in `--ink-900` 500 weight. Derived from the current route (e.g. `Launch / Dashboard`, `Marketing / Campaigns`, `Planner / Goals`). On mobile, replaced by the existing hamburger.
- **Center — Search pill**: cream `--paper-200` background, `1px hairline` border, `rounded-full`, `padding 6px 14px`, magnifier glyph + placeholder "Search tasks, content…" + spacer + `⌘K` kbd chip (white bg, hairline border, mono font, 10px). Min-width 260, max-width 420, flex-1, margin-x 20px. Opens the existing global command palette on click or `⌘K`/`Ctrl+K`.
- **Right — Actions**: ghost icon buttons (28px, `rounded-lg`, hover `bg-ink/5`):
  1. Help (`BookOpen` icon) → `/help`
  2. Notifications (`Bell` icon)
  3. Avatar — 28×28 circle, `bg-ink-900` background, paper-100 text, Playfair Display 12px 600, single initial. Click opens the existing dropdown (Profile/Settings/Admin/Sign out) — preserves Impersonation banner state and admin link.
- All current behavior preserved: mobile menu trigger, impersonation banner offset, admin dropdown items, sign-out.

### Sidebar (restyle, no functional changes)

Keep the **72px Icon Rail + flyout** architecture and all section/item definitions as-is. Restyle to cream:

- Rail: `bg-sidebar-background` (paper-50 cream), right border `hairline`, no shadow.
- Logo mark: replace yellow primary tile with an ink-900 square containing serif "L" (Playfair 600) — matches the landing wordmark.
- Section icons: muted ink at rest, ink-900 + cream-accent tile when active. Replace yellow rail indicator with **terracotta** vertical bar.
- Section labels (10px under each icon): muted ink → ink-900 when active.
- Bottom Help/Settings: same restyling.
- Flyout panel (`w-52`): `bg-sidebar-background`, hairline right border, soft shadow `0 8px 24px -12px rgba(31,27,23,.12)`.
- Flyout section header: small uppercase tracked Plus Jakarta, muted ink (drop the bold-XL look).
- Flyout items: `text-sm` ink, hover `bg-sidebar-accent` cream, **active = cream pill bg + terracotta left-border accent + ink-900 text**.
- Crown lock icons stay terracotta.
- Mobile sheet: same cream palette, accordion sections preserved.

### Project Dashboard body (`FunnelOverviewContent`)

Restructure visual treatment only — all data, queries, sections, banners, and routes preserved. The existing `<main>` already inherits the new tokens via ProjectLayout, so most cards just update visually. Specific touch-ups:

- Page background: cream canvas (inherits).
- **GreetingHeader**: serif `Good morning, {name}` with `{name}` italic terracotta; project line in body; "View Project Summary" link in terracotta with hairline underline; project state badge → cream pill with hairline border + ink text.
- **Cards** (NextBestTask, Today metrics, LaunchSnapshot, UpcomingContent, MemoryReviewBanner, CheckInBanner): white `--card`, 1px hairline border, `rounded-xl`, soft shadow `0 1px 1px rgba(31,27,23,.04), 0 8px 24px -8px rgba(31,27,23,.06)`. Drop heavy shadows.
- **Section eyebrows** (e.g. "TODAY"): replace bold uppercase muted with the landing `eyebrow` style (terracotta uppercase tracked).
- **Today metrics tiles**: numerals in Playfair Display 32px 500, label in Plus Jakarta 11px muted, the "View →" / "Planner →" links in terracotta.
- **NextBestTaskCard** (hero): white card, terracotta "NEXT" eyebrow, serif title (Playfair 24px 500) with optional italic accent on a key word, ink body, primary CTA = ink-900 pill button with paper text "Start →"; secondary actions inherit ghost styling.
- **LaunchTimelineInline**: phase pills become cream chips with hairline border; active phase = terracotta border + terracotta text + warm-cream fill; complete = muted-ink check + cream fill; locked = paper-200 + muted-ink.
- **PhaseCelebrationCard**: cream-200 (`--clay-200`) background, no border, serif headline, terracotta confetti icon, ink-900 dismiss link.
- **"Feeling stuck?" link**: muted ink, terracotta on hover.
- Loaders: terracotta spinner.

No prop or data-shape changes. Components like `LaunchSnapshotCard`, `UpcomingContentCard`, `LaunchTimelineInline`, `MemoryReviewBanner`, `CheckInBanner`, `NextBestTaskCard`, `PhaseCelebrationCard`, `GreetingHeader` get class-only edits to swap hardcoded yellow/blue/dark-grey to the cream/ink/terracotta tokens.

### Mockup of theme application

```text
┌───────────────────────────────────────────────────────────────────┐
│ Launch / Dashboard           [⌕ Search tasks, content…  ⌘K]   ? 🔔 T │  ← topbar (cream blur)
├──────┬────────────────────────────────────────────────────────────┤
│ ▌L  │                                                            │
│ ▌◇  │    Good morning, Tania.                                    │
│  L  │    You're building: Lead Magnet Launch  [Draft]            │
│  ◆  │    ↪ View Project Summary                                  │
│  ★  │                                                            │
│  ▢  │    ─── NEXT ───                                            │
│  ⚙  │    Write your hero headline                                │
│     │    Why it matters · Estimated 15-20 min      [ Start → ]   │
│     │                                                            │
│     │    ─── TODAY ───                                           │
│     │    [Due Today  3]   [Content This Week  5]                 │
└──────┴────────────────────────────────────────────────────────────┘
```

### Files to change

- `src/components/landing/landing-theme.css` — rename root scope to `.app-cream` (keep `.landing-theme` as alias), add sidebar token overrides.
- `src/index.css` — no token changes (defaults preserved for non-themed pages).
- `src/components/layout/ProjectLayout.tsx` — wrap in `<div className="app-cream font-sans">`, swap `bg-muted/30` → cream canvas.
- `src/components/layout/AdminLayout.tsx` — same wrapper so admin pages inherit cream.
- `src/components/layout/TopBar.tsx` — full rebuild per spec above (breadcrumbs from route + central search pill + 3 right actions).
- `src/components/layout/ProjectSidebar.tsx` — class-only edits (rail/flyout colors, indicator color, logo mark, active states, mobile sheet).
- `src/pages/project/plan/FunnelOverviewContent.tsx` — restyle classes on cards/eyebrows/links only.
- `src/components/dashboard/GreetingHeader.tsx` — serif headline with terracotta italic accent.
- `src/components/dashboard/NextBestTaskCard.tsx`, `LaunchSnapshotCard.tsx`, `UpcomingContentCard.tsx`, `LaunchTimelineInline.tsx`, `PhaseCelebrationCard.tsx`, `MemoryReviewBanner.tsx`, `CheckInBanner.tsx`, `ProgressSnapshotCard.tsx` — class-only restyles.
- New helper: `src/components/layout/Breadcrumbs.tsx` — derives `Section / Page` from `useLocation` + the same section map used by ProjectSidebar.
- New helper: `src/components/layout/CommandSearchPill.tsx` — the cream search pill (opens existing command palette / dispatches `⌘K`).

### Out of scope

- Other public pages (Auth, About, Contact, Pricing, Blog) keep current look.
- Internal feature pages (Tasks board, Planner views, Content Vault, AI Studio workspaces) inherit the cream tokens automatically via ProjectLayout but their bespoke layouts will not be re-architected — only the surrounding chrome (sidebar, topbar) and the project dashboard body change visually in this pass. We can roll the same restyle to those pages as a follow-up.

