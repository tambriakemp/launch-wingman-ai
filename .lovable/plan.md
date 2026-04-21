

## Rebuild Sidebar + Dashboard to match the uploaded design exactly

Goal: the signed-in app's sidebar and project dashboard match the four uploaded JSX mockups (Sidebar, Dashboard, Header, Primitives) pixel-for-pixel — single 240px sidebar (collapsible to icon rail), editorial dashboard with hero "Next step", phase timeline cards, and a 1.55fr/1fr two-column body. All current navigation items, routes, queries, gating, and functionality stay identical.

---

### 1. Sidebar — single 240px bar, collapsible to icon rail

Replace the current 72px-rail-plus-flyout architecture in `ProjectSidebar.tsx` with one always-visible 240px sidebar that holds every section and item. The sidebar collapses to a 64px icon-only rail (with tooltips) when toggled.

**Structure (top to bottom)**
- Wordmark "Launchely." (Playfair italic, terracotta period) at top — replaces the ink "L" tile.
- Project switcher pill: white card, hairline border, terracotta circle with first letter, `PROJECT` eyebrow + project name + chevron. Opens the existing `<ProjectSelector>` dropdown.
- Sections in order: Launch, Marketing, Planner, Resources. Each section has:
  - Section header row: small section icon + uppercase tracked label (10.5px, 0.14em letter-spacing, muted ink).
  - Item rows: 16px icon (muted ink, terracotta when active) + label (13.5px Plus Jakarta, 500/600 weight). Active row = `clay-200` background pill, ink-900 text. Hover = `rgba(31,27,23,0.04)`. Padding `7px 10px 7px 12px`, 8px radius.
  - Crown icon stays for tier-locked items.
- Footer: avatar circle + name + plan tier ("Pro plan" / "Free" / etc.) + `more` icon → opens existing user dropdown (Profile / Settings / Admin / Sign out).
- Collapse toggle: small chevron button at top-right of sidebar. State persisted in `localStorage` (`launchely.sidebar.collapsed`). Collapsed = 64px wide, icon-only, item labels hidden, section labels hidden, tooltips on hover.
- Mobile: same expanded sidebar inside the existing `Sheet` slide-out (already wired via `MobileSidebarContext`).

**All current navigation items kept** — Dashboard, Launch Tasks, Offer, Launch Brief, Playbook, Campaigns, AI Avatar Studio, Social Planner, Carousel Builder, Hook Generator, Ideas Bank, Sales Page Writer, Email Sequence, My Planner, Calendar, Daily Page, Habits, Goals, Brain Dump, Weekly Review, Content Vault, Library, Assessments. Bottom Help & Settings move into a small footer cluster above the user row (or stay in user dropdown — see Q below).

---

### 2. Topbar — minimal change

The cream sticky topbar already matches the design system. Two small tweaks:
- Remove the breadcrumb left-side (the new sidebar already shows the active section). Replace with a thin "today" line: `Mon · April 20` style date eyebrow (small uppercase tracked).
- Keep the centered ⌘K search pill, Help/Bell/Avatar trio on the right.

---

### 3. Dashboard body — exact match to `Dashboard_Launchely_Design_System.jsx`

Rewrite `FunnelOverviewContent.tsx` (and refactor child components) so the layout, spacing, and colors match the mockup. All data sources, queries, gating, and routes preserved.

**A. Header block** (`GreetingHeader` rebuild)
- Eyebrow: `Mon · April 20` (live date, formatted).
- Title: `Good evening, {name}.` — Playfair Display 48px, weight 400, with `{name}` rendered as `<em>` italic in terracotta-500.
- Subtitle row: "You're building **{Project Name}** · `[In progress]` moss-green pill · "View project summary" link with hairline underline.
- Right-side actions: ghost "Share update" pill button + solid terracotta "+ New piece" pill button. (Wires: Share update → existing share flow if present, else hidden; + New piece → new task dialog.)
- Bottom border: hairline divider.

**B. Launch Timeline section** (`LaunchTimelineInline` rebuild)
- Eyebrow row (terracotta): `LAUNCH TIMELINE` left, body title `Halfway through {ActivePhase}.` (Playfair 22px), right-side meta: `6–7 weeks total · ends {launchDate}`.
- Phase cards in a CSS grid `repeat(N, 1fr)`, gap 8px, where N = number of visible phases (currently 6: Planning, Messaging, Build, Content, Pre-Launch, Launch).
- Each phase card:
  - Done: white bg, hairline border, mono week label muted, ink phase name, **moss-500 solid bar** at bottom + small green check top-right.
  - Active: **ink-900 bg**, paper-100 text, terracotta dot top-right, terracotta mono week label, semi-transparent bar with terracotta progress fill (uses real `pct` from phase progress).
  - Upcoming: white bg, hairline border, muted text, paper-200 empty bar.
- Card shape: `rounded-xl`, padding `12px 12px 14px`.

**C. Two-column body** — CSS grid `1.55fr / 1fr`, gap 28px.

**Primary column (left):**
1. **Hero "Next step" card** (`NextBestTaskCard` rebuild)
   - Background: linear-gradient `clay-200 → #EFE4D3`, large `rounded-2xl`, padding 36px.
   - Decorative radial-gradient blob top-right.
   - Top row: pill chip with terracotta dot + `NEXT STEP · {Phase} · {n} OF {total}` + small "What's this?" link.
   - Title: Playfair 36px, ink-900, max 560px (e.g. `{nextTask.title}`).
   - Body: 15.5px ink-800 description (uses task description / why it matters).
   - Action row: ink-900 pill button "Start this step →" (navigates to task) + meta cluster (`calendar` icon + estimate, `sparkles` icon + "AI will help" if applicable, "Skip for now" link).

2. **Two small cards row** (grid 1fr/1fr):
   - **"Planning complete" card**: moss-100 pill with check + `{previousPhase} complete` eyebrow, Playfair 20px headline ("You've laid the foundation."), short narrative copy. (Pulled from a small phase-narrative map keyed by completed phase.)
   - **"Your launch" summary card**: `YOUR LAUNCH` eyebrow, project name (Playfair 22px), then key/value rows (Offer, Funnel, Launch date) — values pulled from project data; launch date in terracotta.

3. **Upcoming content card** (`UpcomingContentCard` restyle)
   - Card chrome: white, hairline border, `rounded-2xl`, padding 24px.
   - Header: `UPCOMING CONTENT` terracotta eyebrow + `This week's rhythm.` Playfair title; right link `View content plan →` (terracotta, → arrow).
   - Rows grid `110px 1fr auto`: mono date (`Tomorrow · Apr 21`), title (Playfair 15) + kind subtitle, right-side `clay-200` tag pill (e.g., "Instagram", "Email").
   - Hairline dividers between rows.

**Secondary column (right):**
1. **Check-in banner** (`CheckInBanner` restyle)
   - Background: linear-gradient `#F8E9C5 → #F2D9A8` (warm amber), `rounded-xl`, padding 18/20.
   - Left: Playfair 16 "Want to do a quick check-in?" + 12px subtitle "Three questions. Keeps momentum honest."
   - Right: ink-900 pill button "Start check-in".

2. **"Today" stats card**
   - White bg, hairline border, `rounded-2xl`, padding 20.
   - `TODAY` terracotta eyebrow.
   - Two rows separated by hairline:
     - "Due today" + small subtitle + huge Playfair 34 numeric (count from real tasks query).
     - "Content this week" + "Go to Planner →" terracotta link + Playfair 34 numeric (count from content query).

3. **AI nudge card** (replaces existing AI tip / can subsume `MemoryReviewBanner` if there's a relevant nudge)
   - Background: ink-900, paper-100 text, `rounded-2xl`, padding 22.
   - Eyebrow row: terracotta `sparkles` icon + `FROM YOUR AI TEAM` eyebrow in terracotta.
   - Body: Playfair italic 18px, 1.4 line-height — pulls from existing AI nudge / coach copy. Falls back to a static "keep going" line if none.
   - Action row: ghost outlined pill "Show me an example" + ghost text "Dismiss".

**D. "Stuck" footer** (replaces "Feeling stuck?" link)
- Centered Playfair italic 16px muted: `Feeling stuck?` + terracotta underlined `Get help with this step →`. Opens existing `StuckHelpDialog`.

**E. Banners that already exist** (`MemoryReviewBanner`, `PhaseCelebrationCard`, completed/paused/launched views)
- Keep them; restyle classes only to use `clay-200` / `terracotta-500` / hairline borders / Playfair headlines so they sit naturally above the dashboard. No data changes.

---

### Mockup

```text
┌────────────┬─────────────────────────────────────────────────────────────┐
│ Launchely. │ Mon · April 20                                              │
│ ─────────  │ Good evening, Tambra.                                       │
│ 🅛 Project │ You're building AI Skool · [In progress] · View summary     │
│  Launchely │ ─────────────────────────────────────────────────────────── │
│            │ LAUNCH TIMELINE   Halfway through Messaging.   6–7w · May28 │
│ LAUNCH     │ [Plan✓][Messaging●][Build ][Content][Pre-Lch][Launch]       │
│  ▢ Dashbd  │                                                             │
│  ▢ Tasks   │ ┌──────────────── 1.55fr ──────────┬──── 1fr ──────────┐   │
│  ▢ Offer   │ │ ╭ NEXT STEP · Messaging · 1/6 ╮  │ Quick check-in     │   │
│  ▢ Brief   │ │ Clarify your core message.      │ ─────────────────  │   │
│  ▢ Playbk  │ │ [Start this step →]  ⏱ 10–20m   │ TODAY              │   │
│            │ │                                  │ Due today      0   │   │
│ MARKETING  │ │ [✓ Planning ][YOUR LAUNCH info] │ Content week   7   │   │
│  ▢ ...     │ │                                  │ ─────────────────  │   │
│            │ │ UPCOMING CONTENT — This week's   │ ✦ FROM YOUR AI TEAM│   │
│ PLANNER    │ │ Tomorrow · Apr 21  Blog · Gen.. │ "Your last titles…"│   │
│  ▢ ...     │ │ Wed · Apr 22       Email · Nurt │                    │   │
│            │ └──────────────────────────────────┴────────────────────┘   │
│ RESOURCES  │                Feeling stuck? Get help →                    │
│  ▢ ...     │                                                             │
│ ────────── │                                                             │
│ ◐ Tambra   │                                                             │
│   Pro plan │                                                             │
└────────────┴─────────────────────────────────────────────────────────────┘
```

---

### Files to change

- `src/components/layout/ProjectSidebar.tsx` — full rewrite to single 240px / 64px collapsible sidebar (keep all sections + items + gating + mobile sheet).
- `src/components/layout/TopBar.tsx` — replace breadcrumbs with date eyebrow.
- `src/components/layout/ProjectLayout.tsx` — adjust left offset (240px expanded / 64px collapsed) and remove the old 72px rail spacer logic.
- `src/components/layout/AdminLayout.tsx` — same offset adjustment.
- `src/pages/project/plan/FunnelOverviewContent.tsx` — restructure to match the mockup grid and sections.
- `src/components/dashboard/GreetingHeader.tsx` — rebuild per spec.
- `src/components/dashboard/NextBestTaskCard.tsx` — rebuild as the gradient hero.
- `src/components/dashboard/UpcomingContentCard.tsx` — restyle to match.
- `src/components/dashboard/LaunchSnapshotCard.tsx` — restyle to "Your launch" card; new "Planning complete" sibling card may be added inline in `FunnelOverviewContent`.
- `src/components/check-in/CheckInBanner.tsx` — amber gradient restyle.
- `src/components/dashboard/PhaseCelebrationCard.tsx` — clay restyle (kept for full-phase celebrations).
- `src/components/relaunch/MemoryReviewBanner.tsx` — light restyle to fit cream theme.
- New (small): `src/components/dashboard/AINudgeCard.tsx` — ink-900 italic nudge card (right column).
- `src/components/landing/landing-theme.css` — verify all referenced tokens exist (`--clay-200`, `--moss-100/500/700`, `--terracotta-50/500/700`, `--paper-100/200`, `--ink-100/300/700/800/900`, `--border-hairline`, `--font-display`, `--font-mono`); add any missing ones.
- `src/hooks/useSidebarCollapsed.ts` — new tiny hook for collapse state + localStorage persistence.

### Out of scope

- Other pages (Tasks, Planner, Vault, Marketing tools, Auth, public pages) — they inherit the new sidebar/topbar chrome automatically but their own bodies are not redesigned in this pass.
- No data-shape, query, RLS, or route changes.

