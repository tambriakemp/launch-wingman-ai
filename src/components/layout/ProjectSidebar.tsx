import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Rocket,
  Kanban,
  Crown,
  ClipboardCheck,
  BookOpen,
  BookMarked,
  MessageSquareText,
  Lightbulb,
  Package,
  Settings,
  HelpCircle,
  Megaphone,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Target,
  Wand2,
  CalendarCheck,
  Flame,
  Brain,
  BarChart2,
  Zap,
  FileText,
  Mail,
  Layers,
  MoreHorizontal,
  LogOut,
  Shield,
  ArrowLeftCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileSidebar } from "@/contexts/MobileSidebarContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { ProjectSelector } from "@/components/ProjectSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ──
interface SectionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isProOnly?: boolean;
  isAdvancedOnly?: boolean;
  requiresProject?: boolean;
}

interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SectionItem[];
}

const createSections = (projectId?: string): Section[] => [
  {
    id: "launch",
    label: "Launch",
    icon: Rocket,
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: projectId ? `/projects/${projectId}/dashboard` : "#", requiresProject: !projectId },
      { id: "tasks", label: "Launch Tasks", icon: Kanban, href: projectId ? `/projects/${projectId}/tasks` : "#", requiresProject: !projectId },
      { id: "offer", label: "Offer", icon: ShoppingBag, href: projectId ? `/projects/${projectId}/offer` : "#", requiresProject: !projectId },
      { id: "summary", label: "Launch Brief", icon: BookMarked, href: projectId ? `/projects/${projectId}/summary` : "#", requiresProject: !projectId },
      { id: "playbook", label: "Playbook", icon: BookOpen, href: "/playbook" },
      { id: "assessments", label: "Assessments", icon: ClipboardCheck, href: "/assessments" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    items: [
      { id: "campaigns", label: "Campaigns", icon: Target, href: "/marketing-hub/campaigns", isAdvancedOnly: true },
      { id: "ai-studio", label: "AI Avatar Studio", icon: Wand2, href: "/app/ai-studio", isAdvancedOnly: true },
      { id: "social-planner", label: "Social Planner", icon: MessageSquareText, href: projectId ? `/projects/${projectId}/content` : "/social-planner", isAdvancedOnly: true },
      { id: "carousel-builder", label: "Carousel Builder", icon: Layers, href: "/carousel-builder", isAdvancedOnly: true },
      { id: "hooks", label: "Hook Generator", icon: Zap, href: "/app/ai-studio/hooks", isAdvancedOnly: true },
      { id: "ideas", label: "Ideas Bank", icon: Lightbulb, href: "/ideas", isAdvancedOnly: true },
      { id: "sales-page", label: "Sales Page Writer", icon: FileText, href: "/app/ai-studio/sales-page", isAdvancedOnly: true },
      { id: "email-sequence", label: "Email Sequence", icon: Mail, href: "/app/ai-studio/email-sequence", isAdvancedOnly: true },
      { id: "content-vault", label: "Content Vault", icon: Package, href: "/content-vault" },
    ],
  },
  {
    id: "planner",
    label: "Planner",
    icon: CalendarCheck,
    items: [
      { id: "planner-hub", label: "My Planner", icon: LayoutDashboard, href: "/planner-hub" },
      { id: "calendar", label: "Calendar", icon: CalendarCheck, href: "/planner", isProOnly: true },
      { id: "daily", label: "Daily Page", icon: BookOpen, href: "/daily", isProOnly: true },
      { id: "habits", label: "Habits", icon: Flame, href: "/habits", isProOnly: true },
      { id: "goals", label: "Goals", icon: Target, href: "/goals", isProOnly: true },
      { id: "brain-dump", label: "Brain Dump", icon: Brain, href: "/brain-dump", isProOnly: true },
      { id: "weekly", label: "Weekly Review", icon: BarChart2, href: "/weekly", isProOnly: true },
    ],
  },
];

// ── Wordmark ──
const Wordmark = ({ size = 20 }: { size?: number }) => (
  <span
    className="leading-none"
    style={{
      fontFamily: '"Playfair Display", Georgia, serif',
      fontStyle: "italic",
      fontWeight: 500,
      fontSize: size,
      letterSpacing: "-0.02em",
      color: "hsl(var(--ink-900))",
    }}
  >
    Launchely<span style={{ color: "hsl(var(--terracotta-500))" }}>.</span>
  </span>
);

// ── Nav Row ──
interface NavRowProps {
  item: SectionItem;
  isActive: boolean;
  isPro: boolean;
  isAdvanced: boolean;
  hasAdminAccess: boolean;
  collapsed: boolean;
  onNavigate: (href: string) => void;
  onUpgradeClick: (feature: string, targetTier?: "pro" | "advanced") => void;
}

const NavRow = ({
  item,
  isActive,
  isPro,
  isAdvanced,
  hasAdminAccess,
  collapsed,
  onNavigate,
  onUpgradeClick,
}: NavRowProps) => {
  const isProLocked = item.isProOnly && !isPro && !isAdvanced && !hasAdminAccess;
  const isAdvancedLocked = item.isAdvancedOnly && !isAdvanced && !hasAdminAccess;
  const locked = isProLocked || isAdvancedLocked;
  const disabled = item.requiresProject;

  const handleClick = () => {
    if (disabled) return;
    if (locked) {
      onUpgradeClick(item.label, isAdvancedLocked ? "advanced" : "pro");
      return;
    }
    onNavigate(item.href);
  };

  const Icon = item.icon;

  const button = (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group relative flex items-center gap-2.5 w-full rounded-lg text-left transition-colors",
        collapsed ? "justify-center px-0 py-2 h-9" : "px-3 py-[7px]",
        isActive
          ? "bg-[hsl(var(--clay-200))] text-[hsl(var(--ink-900))]"
          : "text-[hsl(var(--ink-800))] hover:bg-[hsl(var(--ink-900)/0.04)]",
        disabled && "opacity-40 cursor-not-allowed"
      )}
      style={{ fontFamily: 'var(--font-body, "Plus Jakarta Sans", system-ui, sans-serif)' }}
    >
      <Icon
        className={cn(
          "w-4 h-4 shrink-0",
          isActive ? "text-[hsl(var(--terracotta-500))]" : "text-[hsl(var(--fg-muted))]"
        )}
      />
      {!collapsed && (
        <>
          <span
            className="flex-1 truncate"
            style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 500 }}
          >
            {item.label}
          </span>
          {locked && <Crown className="w-3 h-3 text-[hsl(var(--terracotta-500))]" />}
        </>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <span className="text-xs">
            {item.label}
            {disabled && " (select project)"}
            {locked && " (upgrade)"}
          </span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
};

// ── Section Block ──
const SectionBlock = ({
  section,
  collapsed,
  isActiveRoute,
  isPro,
  isAdvanced,
  hasAdminAccess,
  onNavigate,
  onUpgradeClick,
}: {
  section: Section;
  collapsed: boolean;
  isActiveRoute: (href: string) => boolean;
  isPro: boolean;
  isAdvanced: boolean;
  hasAdminAccess: boolean;
  onNavigate: (href: string) => void;
  onUpgradeClick: (feature: string, targetTier?: "pro" | "advanced") => void;
}) => {
  const SectionIcon = section.icon;
  return (
    <div className={cn("mb-4", collapsed && "mb-3")}>
      {!collapsed && (
        <div
          className="flex items-center gap-2 px-3 pt-1 pb-2 text-[hsl(var(--fg-muted))]"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontFamily: 'var(--font-body, "Plus Jakarta Sans", system-ui, sans-serif)',
          }}
        >
          <SectionIcon className="w-3 h-3" />
          {section.label}
        </div>
      )}
      {collapsed && (
        <div className="h-px mx-3 my-2 bg-[hsl(var(--border-hairline))]" />
      )}
      <div className="grid gap-0.5 px-2">
        {section.items.map((item) => (
          <NavRow
            key={item.id}
            item={item}
            isActive={isActiveRoute(item.href)}
            isPro={isPro}
            isAdvanced={isAdvanced}
            hasAdminAccess={hasAdminAccess}
            collapsed={collapsed}
            onNavigate={onNavigate}
            onUpgradeClick={onUpgradeClick}
          />
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════
export const ProjectSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const [upgradeTargetTier, setUpgradeTargetTier] = useState<"pro" | "advanced">("pro");
  const isMobile = useIsMobile();
  const { isOpen, close } = useMobileSidebar();
  const { hasAdminAccess, tier } = useFeatureAccess();
  const { collapsed, toggle } = useSidebarCollapsed();
  const { user, signOut, isImpersonating, impersonatedUserEmail, stopImpersonation } = useAuth();

  const isPro = tier === "pro" || tier === "advanced" || tier === "admin";
  const isAdvanced = tier === "advanced" || tier === "admin";

  // ── Stored project id ──
  const [storedProjectId, setStoredProjectId] = useState<string | undefined>();
  useEffect(() => {
    const stored = localStorage.getItem("lastProjectInfo");
    if (stored) {
      try {
        setStoredProjectId(JSON.parse(stored).id);
      } catch {
        /* ignore */
      }
    }
  }, []);
  const effectiveProjectId = projectId || storedProjectId;

  // ── Project query ──
  const { data: project } = useQuery({
    queryKey: ["project-sidebar", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (projectId && project?.name) {
      localStorage.setItem(
        "lastProjectInfo",
        JSON.stringify({ id: projectId, name: project.name })
      );
      setStoredProjectId(projectId);
    }
  }, [projectId, project?.name]);

  // ── Profile ──
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const sections = createSections(effectiveProjectId);

  const isActiveRoute = useCallback(
    (href: string) => {
      if (href === "#") return false;
      if (location.pathname === href) return true;
      if (location.pathname.startsWith(href + "/")) {
        const allHrefs = sections
          .flatMap((s) => s.items.map((i) => i.href))
          .filter((h) => h !== "#");
        const hasBetter = allHrefs.some(
          (other) =>
            other !== href &&
            other.length > href.length &&
            (location.pathname === other ||
              location.pathname.startsWith(other + "/"))
        );
        return !hasBetter;
      }
      return false;
    },
    [location.pathname, sections]
  );

  const handleUpgradeClick = useCallback(
    (feature: string, targetTier?: "pro" | "advanced") => {
      setUpgradeFeature(feature);
      setUpgradeTargetTier(targetTier || "pro");
      setShowUpgradeDialog(true);
    },
    []
  );

  const handleNavigate = useCallback(
    (href: string) => {
      if (href === "#") return;
      if (isMobile) close();
      navigate(href);
    },
    [navigate, isMobile, close]
  );

  const tierLabel =
    tier === "advanced"
      ? "Advanced plan"
      : tier === "pro"
      ? "Pro plan"
      : tier === "admin"
      ? "Admin"
      : tier === "content_vault"
      ? "Vault plan"
      : "Free";

  const displayName = profile?.first_name || user?.email?.split("@")[0] || "You";
  const userInitial = (profile?.first_name?.[0] || user?.email?.[0] || "U").toUpperCase();

  // ── Sidebar inner content (used by both desktop + mobile) ──
  const renderSidebarBody = (effectiveCollapsed: boolean) => (
    <div
      className="h-full flex flex-col"
      style={{
        background: "hsl(var(--paper-100))",
        borderRight: "1px solid hsl(var(--border-hairline))",
      }}
    >
      {/* Top: wordmark + collapse toggle */}
      <div
        className={cn(
          "flex items-center justify-between",
          effectiveCollapsed ? "px-2 pt-5 pb-3" : "px-4 pt-5 pb-3"
        )}
      >
        <Link to="/app" className={cn(effectiveCollapsed && "mx-auto")}>
          {effectiveCollapsed ? (
            <span
              className="text-[hsl(var(--ink-900))] leading-none"
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: "-0.02em",
              }}
            >
              L<span style={{ color: "hsl(var(--terracotta-500))" }}>.</span>
            </span>
          ) : (
            <Wordmark size={20} />
          )}
        </Link>
        {!isMobile && !effectiveCollapsed && (
          <button
            onClick={toggle}
            className="h-7 w-7 rounded-md flex items-center justify-center text-[hsl(var(--fg-muted))] hover:bg-[hsl(var(--ink-900)/0.05)] transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Project switcher */}
      <div className={cn(effectiveCollapsed ? "px-2 mb-3" : "px-3 mb-3")}>
        {effectiveCollapsed ? (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={toggle}
                className="w-full h-9 rounded-lg bg-white border border-[hsl(var(--border-hairline))] flex items-center justify-center hover:bg-[hsl(var(--ink-900)/0.03)] transition-colors"
                aria-label="Expand sidebar"
              >
                <span
                  className="w-6 h-6 rounded-full bg-[hsl(var(--terracotta-500))] text-white inline-flex items-center justify-center"
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {(project?.name?.[0] || "L").toUpperCase()}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <span className="text-xs">{project?.name || "Expand sidebar"}</span>
            </TooltipContent>
          </Tooltip>
        ) : (
          <ProjectSwitcherPill
            currentProjectId={effectiveProjectId}
            projectName={project?.name || "Select project"}
          />
        )}
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide pb-2">
        {sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            collapsed={effectiveCollapsed}
            isActiveRoute={isActiveRoute}
            isPro={isPro}
            isAdvanced={isAdvanced}
            hasAdminAccess={hasAdminAccess}
            onNavigate={handleNavigate}
            onUpgradeClick={handleUpgradeClick}
          />
        ))}

        {/* Help & Settings cluster */}
        <div className={cn("mt-2 pt-2 border-t border-[hsl(var(--border-hairline))]", effectiveCollapsed ? "mx-2" : "mx-3")}>
          <NavRow
            item={{ id: "help", label: "Help & Support", icon: HelpCircle, href: "/help" }}
            isActive={isActiveRoute("/help")}
            isPro={isPro}
            isAdvanced={isAdvanced}
            hasAdminAccess={hasAdminAccess}
            collapsed={effectiveCollapsed}
            onNavigate={handleNavigate}
            onUpgradeClick={handleUpgradeClick}
          />
          <NavRow
            item={{ id: "settings", label: "Settings", icon: Settings, href: "/settings" }}
            isActive={isActiveRoute("/settings")}
            isPro={isPro}
            isAdvanced={isAdvanced}
            hasAdminAccess={hasAdminAccess}
            collapsed={effectiveCollapsed}
            onNavigate={handleNavigate}
            onUpgradeClick={handleUpgradeClick}
          />
        </div>
      </nav>

      {/* Footer: user */}
      <div
        className={cn(
          "border-t border-[hsl(var(--border-hairline))]",
          effectiveCollapsed ? "px-2 py-3" : "px-3 py-3"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-2.5 rounded-lg hover:bg-[hsl(var(--ink-900)/0.04)] transition-colors",
                effectiveCollapsed ? "justify-center p-1.5" : "p-2"
              )}
            >
              <span
                className="w-7 h-7 rounded-full shrink-0 inline-flex items-center justify-center text-white text-xs font-semibold"
                style={{
                  background: "linear-gradient(135deg, #E8D9C6, #C65A3E)",
                  fontFamily: '"Playfair Display", Georgia, serif',
                }}
              >
                {userInitial}
              </span>
              {!effectiveCollapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <div
                      className="truncate text-[hsl(var(--ink-900))]"
                      style={{ fontSize: 13, fontWeight: 600 }}
                    >
                      {displayName}
                    </div>
                    <div
                      className="text-[hsl(var(--fg-muted))]"
                      style={{ fontSize: 11 }}
                    >
                      {tierLabel}
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-[hsl(var(--fg-muted))]" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            {user && (
              <>
                {isImpersonating ? (
                  <div className="px-2 py-1.5 bg-amber-500/10 border-b border-amber-500/20">
                    <p className="text-xs text-amber-600 font-medium">Viewing as:</p>
                    <p className="text-sm text-amber-700 truncate">{impersonatedUserEmail}</p>
                  </div>
                ) : (
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            {isImpersonating && (
              <>
                <DropdownMenuItem
                  onClick={stopImpersonation}
                  className="flex items-center gap-2 cursor-pointer text-amber-600"
                >
                  <ArrowLeftCircle className="w-4 h-4" />
                  Return to Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4" /> Settings
              </Link>
            </DropdownMenuItem>
            {hasAdminAccess && !isImpersonating && (
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="w-4 h-4" /> Admin
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="flex items-center gap-2 cursor-pointer text-destructive"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collapsed: show expand button below user */}
        {!isMobile && effectiveCollapsed && (
          <button
            onClick={toggle}
            className="mt-2 w-full h-7 rounded-md flex items-center justify-center text-[hsl(var(--fg-muted))] hover:bg-[hsl(var(--ink-900)/0.05)] transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  // ══════════ MOBILE ══════════
  if (isMobile) {
    return (
      <TooltipProvider>
        <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
          <SheetContent side="left" className="w-[260px] p-0 border-0">
            {renderSidebarBody(false)}
          </SheetContent>
        </Sheet>
        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          feature={upgradeFeature}
          targetTier={upgradeTargetTier}
        />
      </TooltipProvider>
    );
  }

  // ══════════ DESKTOP ══════════
  return (
    <TooltipProvider>
      <aside
        className={cn(
          "hidden md:block shrink-0 sticky top-0 h-dvh transition-[width] duration-200 ease-out z-40",
          collapsed ? "w-[64px]" : "w-[240px]"
        )}
      >
        {renderSidebarBody(collapsed)}
      </aside>
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature={upgradeFeature}
        targetTier={upgradeTargetTier}
      />
    </TooltipProvider>
  );
};

// ── Project Switcher Pill (wraps the existing ProjectSelector logic in a styled trigger) ──
// Editorial styling: paper-100 trigger, ink-900 hairline border, square-ish corners,
// matches the spec's project-switcher chip in the sidebar.
const ProjectSwitcherPill = ({
  currentProjectId,
  projectName,
}: {
  currentProjectId?: string;
  projectName: string;
}) => {
  // Re-use the existing ProjectSelector entirely so creation flow + tier gating stays intact.
  return (
    <div
      className={[
        "[&_button]:!bg-white",
        "[&_button]:!border",
        "[&_button]:!border-[hsl(var(--border-hairline))]",
        "[&_button]:!text-[hsl(var(--ink-900))]",
        "[&_button]:!h-auto",
        "[&_button]:!py-2.5",
        "[&_button]:!px-3",
        "[&_button]:!rounded-[10px]",
        "[&_button]:!shadow-none",
        "[&_button:hover]:!bg-[hsl(var(--paper-200))]",
        "[&_button:hover]:!border-[hsl(var(--ink-900))]",
        "[&_button]:transition-colors",
      ].join(" ")}
    >
      <ProjectSelector currentProjectId={currentProjectId} />
    </div>
  );
};
