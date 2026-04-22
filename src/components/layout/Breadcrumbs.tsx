import { useLocation, useParams, Link } from "react-router-dom";
import { useMemo } from "react";

// Maps a route prefix to a "Section / Page" pair.
// Order matters — most specific first.
type Crumb = { section: string; page: string; sectionHref?: string };

const matchCrumb = (pathname: string, projectId?: string): Crumb => {
  const p = pathname;

  // Project-scoped routes
  if (projectId) {
    const base = `/projects/${projectId}`;
    if (p === `${base}/dashboard`) return { section: "Launch", page: "Dashboard" };
    if (p.startsWith(`${base}/tasks`)) return { section: "Launch", page: "Launch Tasks" };
    if (p.startsWith(`${base}/offer`)) return { section: "Launch", page: "Offer" };
    if (p.startsWith(`${base}/summary`)) return { section: "Launch", page: "Launch Brief" };
    if (p.startsWith(`${base}/content`)) return { section: "Marketing", page: "Social Planner" };
    if (p === base) return { section: "Launch", page: "Offer" };
  }

  // Marketing
  if (p.startsWith("/marketing-hub/campaigns")) return { section: "Marketing", page: "Campaigns" };
  if (p.startsWith("/app/ai-studio/hooks")) return { section: "Marketing", page: "Hook Generator" };
  if (p.startsWith("/app/ai-studio/sales-page")) return { section: "Marketing", page: "Sales Page Writer" };
  if (p.startsWith("/app/ai-studio/email-sequence")) return { section: "Marketing", page: "Email Sequence" };
  if (p.startsWith("/app/ai-studio/outfit-swap")) return { section: "Marketing", page: "Outfit Swap" };
  if (p.startsWith("/app/ai-studio/environments")) return { section: "Marketing", page: "Environments" };
  if (p.startsWith("/app/ai-studio")) return { section: "Marketing", page: "AI Avatar Studio" };
  if (p.startsWith("/carousel-builder")) return { section: "Marketing", page: "Carousel Builder" };
  
  if (p.startsWith("/social-planner")) return { section: "Marketing", page: "Social Planner" };

  // Planner
  if (p.startsWith("/planner-hub")) return { section: "Planner", page: "My Planner" };
  if (p.startsWith("/planner")) return { section: "Planner", page: "Calendar" };
  if (p.startsWith("/daily")) return { section: "Planner", page: "Daily Page" };
  if (p.startsWith("/habits")) return { section: "Planner", page: "Habits" };
  if (p.startsWith("/goals")) return { section: "Planner", page: "Goals" };
  if (p.startsWith("/brain-dump")) return { section: "Planner", page: "Brain Dump" };
  if (p.startsWith("/weekly")) return { section: "Planner", page: "Weekly Review" };

  // Resources
  if (p.startsWith("/content-vault")) return { section: "Resources", page: "Content Vault" };
  if (p.startsWith("/assessments")) return { section: "Resources", page: "Assessments" };
  if (p.startsWith("/playbook")) return { section: "Launch", page: "Playbook" };

  // Misc
  if (p.startsWith("/settings")) return { section: "Account", page: "Settings" };
  if (p.startsWith("/help")) return { section: "Account", page: "Help & Support" };
  if (p.startsWith("/admin")) return { section: "Admin", page: "Dashboard" };
  if (p.startsWith("/app")) return { section: "Launch", page: "Projects" };

  return { section: "Launch", page: "Dashboard" };
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const { id: projectId } = useParams();

  const crumb = useMemo(
    () => matchCrumb(location.pathname, projectId),
    [location.pathname, projectId]
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[13px] font-sans text-muted-foreground min-w-0"
    >
      <span className="truncate">{crumb.section}</span>
      <span className="text-muted-foreground/50">/</span>
      <span className="truncate font-medium text-foreground">{crumb.page}</span>
    </nav>
  );
};
