import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SubscriptionTier } from "@/lib/subscriptionTiers";
import { useEffect, useState, useRef, useCallback } from "react";
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
  BarChart3,
  ChevronRight,
  Target,
  Wand2,
  CalendarCheck,
  Flame,
  Brain,
  BarChart2,
  FolderOpen,
  Zap,
  FileText,
  Mail,
  Layers,
  Shirt,
} from "lucide-react";
import { ProjectSelector } from "@/components/ProjectSelector";
import { LaunchelyLogo } from "@/components/ui/LaunchelyLogo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileSidebar } from "@/contexts/MobileSidebarContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeDialog } from "@/components/UpgradeDialog";

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
  showProjectSelector?: boolean;
  items: SectionItem[];
}

// ── Section factory ──

const createSections = (projectId?: string): Section[] => [
  {
    id: "launch",
    label: "Launch",
    icon: Rocket,
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: projectId ? `/projects/${projectId}/dashboard` : "#", requiresProject: !projectId },
      { id: "tasks", label: "Tasks", icon: Kanban, href: projectId ? `/projects/${projectId}/tasks` : "#", requiresProject: !projectId },
      { id: "offer", label: "Offer", icon: ShoppingBag, href: projectId ? `/projects/${projectId}/offer` : "#", requiresProject: !projectId },
      { id: "summary", label: "Launch Brief", icon: BookMarked, href: projectId ? `/projects/${projectId}/summary` : "#", requiresProject: !projectId },
      { id: "playbook", label: "Playbook", icon: BookOpen, href: "/playbook" },
      
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    items: [
      { id: "campaigns", label: "Campaigns", icon: Target, href: "/marketing-hub/campaigns", isAdvancedOnly: true },
      { id: "ai-studio", label: "AI Studio", icon: Wand2, href: "/app/ai-studio", isAdvancedOnly: true },
      { id: "carousel-builder", label: "Carousel Builder", icon: Layers, href: "/carousel-builder", isAdvancedOnly: true },
      { id: "hooks", label: "Hook Generator", icon: Zap, href: "/app/ai-studio/hooks", isAdvancedOnly: true },
      { id: "social-planner", label: "Social Planner", icon: MessageSquareText, href: projectId ? `/projects/${projectId}/content` : "/social-planner", isAdvancedOnly: true },
      { id: "ideas", label: "Ideas Bank", icon: Lightbulb, href: "/ideas", isAdvancedOnly: true },
      { id: "sales-page", label: "Sales Page Writer", icon: FileText, href: "/app/ai-studio/sales-page", isAdvancedOnly: true },
      { id: "email-sequence", label: "Email Sequence", icon: Mail, href: "/app/ai-studio/email-sequence", isAdvancedOnly: true },
      
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
  {
    id: "resources",
    label: "Resources",
    icon: Package,
    items: [
      { id: "content-vault", label: "Content Vault", icon: Package, href: "/content-vault" },
      { id: "library", label: "Library", icon: FolderOpen, href: projectId ? `/projects/${projectId}/library` : "#", requiresProject: !projectId },
      { id: "assessments", label: "Assessments", icon: ClipboardCheck, href: "/assessments" },
    ],
  },
];

// ── Helper: find which section owns a path ──

function findActiveSection(sections: Section[], pathname: string): string | null {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.href === "#") continue;
      if (pathname === item.href || pathname.startsWith(item.href + "/")) return section.id;
    }
  }
  return null;
}

// ── Flyout nav item renderer ──

interface FlyoutItemProps {
  item: SectionItem;
  isActive: boolean;
  isPro: boolean;
  isAdvanced: boolean;
  hasAdminAccess: boolean;
  onNavigate: (href: string) => void;
  onUpgradeClick: (feature: string, targetTier?: 'pro' | 'advanced') => void;
}

const FlyoutNavItem = ({ item, isActive, isPro, isAdvanced, hasAdminAccess, onNavigate, onUpgradeClick }: FlyoutItemProps) => {
  const isProLocked = item.isProOnly && !isPro && !isAdvanced && !hasAdminAccess;
  const isAdvancedLocked = item.isAdvancedOnly && !isAdvanced && !hasAdminAccess;

  if (item.requiresProject) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground/40 cursor-not-allowed">
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right"><p>Select a project first</p></TooltipContent>
      </Tooltip>
    );
  }

  if (isAdvancedLocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onUpgradeClick(item.label, 'advanced')}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm w-full text-left text-sidebar-foreground/40 hover:bg-sidebar-accent/30 cursor-pointer"
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1">{item.label}</span>
            <Crown className="w-3 h-3 text-primary" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right"><p>Advanced feature — Upgrade to access</p></TooltipContent>
      </Tooltip>
    );
  }

  if (isProLocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onUpgradeClick(item.label, 'pro')}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm w-full text-left text-sidebar-foreground/40 hover:bg-sidebar-accent/30 cursor-pointer"
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1">{item.label}</span>
            <Crown className="w-3 h-3 text-primary" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right"><p>Pro feature – Upgrade to access</p></TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      onClick={() => onNavigate(item.href)}
      className={cn(
        "flex items-center gap-2 px-2 rounded-md text-sm transition-colors w-full text-left py-[14px]",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className={cn("w-4 h-4", isActive && "text-sidebar-primary")} />
      <span>{item.label}</span>
    </button>
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
  const isMobile = useIsMobile();
  const { isOpen, close } = useMobileSidebar();
  const { hasAdminAccess, tier } = useFeatureAccess();
  const isPro = tier === "pro" || tier === "advanced" || tier === "admin";
  const isAdvanced = tier === "advanced" || tier === "admin";

  // ── Stored project id ──
  const [storedProjectId, setStoredProjectId] = useState<string | undefined>();
  useEffect(() => {
    const stored = localStorage.getItem("lastProjectInfo");
    if (stored) {
      try { setStoredProjectId(JSON.parse(stored).id); } catch { /* ignore */ }
    }
  }, []);
  const effectiveProjectId = projectId || storedProjectId;

  // ── Project queries ──
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase.from("projects").select("name").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (projectId && project?.name) {
      localStorage.setItem("lastProjectInfo", JSON.stringify({ id: projectId, name: project.name }));
      setStoredProjectId(projectId);
    }
  }, [projectId, project?.name]);

  // ── Sections ──
  const sections = createSections(effectiveProjectId);

  // ── Open section state (desktop flyout) ──
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Auto-open section based on route
  useEffect(() => {
    const active = findActiveSection(sections, location.pathname);
    setOpenSection(active);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const [upgradeTargetTier, setUpgradeTargetTier] = useState<'pro' | 'advanced'>('pro');

  const handleUpgradeClick = useCallback((feature: string, targetTier?: 'pro' | 'advanced') => {
    setUpgradeFeature(feature);
    setUpgradeTargetTier(targetTier || 'pro');
    setShowUpgradeDialog(true);
  }, []);

  const isActiveRoute = useCallback((href: string) => {
    if (href === "#") return false;
    if (href === "/app") return location.pathname === href;
    // Exact match always wins
    if (location.pathname === href) return true;
    // For prefix matching, only match if no sibling route is a more specific match
    if (location.pathname.startsWith(href + "/")) {
      // Check if any other known route is a better (longer) prefix match
      const allHrefs = sections.flatMap(s => s.items.map(i => i.href)).filter(h => h !== "#");
      const hasBetterMatch = allHrefs.some(
        other => other !== href && other.length > href.length &&
          (location.pathname === other || location.pathname.startsWith(other + "/"))
      );
      return !hasBetterMatch;
    }
    return false;
  }, [location.pathname]);

  // ── Outside-click handling for desktop flyout ──
  const railRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  // Outside-click removed — flyout closes on nav or rail toggle

  const handleDesktopNav = (href: string) => {
    setOpenSection(null);
    navigate(href);
  };

  // ── Mobile accordion state ──
  const [mobileOpenSection, setMobileOpenSection] = useState<string | null>(() =>
    findActiveSection(sections, location.pathname)
  );

  const handleMobileNav = (href: string) => {
    close();
    navigate(href);
  };

  // ══════════ MOBILE ══════════
  if (isMobile) {
    return (
      <TooltipProvider>
        <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
          <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-r border-sidebar-border">
            <div className="h-full flex flex-col">
              {/* Logo */}
              <div className="px-4 py-3 border-b border-sidebar-border">
                <Link to="/app" onClick={close}>
                  <LaunchelyLogo size="md" textClassName="text-sidebar-accent-foreground text-base" />
                </Link>
              </div>

              {/* Accordion sections */}
              <nav className="flex-1 overflow-y-auto scrollbar-hide px-2 py-2 space-y-1">
                {sections.map((section) => {
                  const isExpanded = mobileOpenSection === section.id;
                  return (
                    <div key={section.id}>
                      <button
                        onClick={() => setMobileOpenSection(isExpanded ? null : section.id)}
                        className="flex items-center gap-2.5 w-full px-2 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                      >
                        <section.icon className="w-4 h-4 text-sidebar-foreground/70" />
                        <span className="flex-1 text-left">{section.label}</span>
                        <ChevronRight className={cn("w-4 h-4 text-sidebar-foreground/40 transition-transform duration-200", isExpanded && "rotate-90")} />
                      </button>

                      {isExpanded && (
                        <div className="pl-6 space-y-0.5 mt-0.5 mb-1">
                          {section.showProjectSelector && (
                            <div className="px-1 py-1.5">
                              <ProjectSelector currentProjectId={effectiveProjectId} />
                            </div>
                          )}
                          {section.items.map((item) => (
                            <FlyoutNavItem
                              key={item.id}
                              item={item}
                              isActive={isActiveRoute(item.href)}
                              isPro={isPro}
                              isAdvanced={isAdvanced}
                              hasAdminAccess={hasAdminAccess}
                              onNavigate={handleMobileNav}
                              onUpgradeClick={handleUpgradeClick}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
                <button onClick={() => handleMobileNav("/help")} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 w-full text-left">
                  <HelpCircle className="w-4 h-4" /> Help & Support
                </button>
                <button onClick={() => handleMobileNav("/settings")} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 w-full text-left">
                  <Settings className="w-4 h-4" /> Settings
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <UpgradeDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} feature={upgradeFeature} targetTier={upgradeTargetTier} />
      </TooltipProvider>
    );
  }

  // ══════════ DESKTOP ══════════
  const activeSection = sections.find((s) => s.id === openSection);

  return (
    <TooltipProvider>
      {/* Spacer div — participates in flex flow to push content */}
      <div className={cn("hidden md:block shrink-0 transition-all duration-200", activeSection ? "w-[280px]" : "w-[72px]")}>
        {/* Icon Rail */}
        <motion.div
          ref={railRef}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed left-0 top-0 h-dvh w-[72px] bg-sidebar border-r border-sidebar-border z-50 flex flex-col items-center py-3"
        >
          {/* Logo mark */}
          <Link to="/app" className="mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
          </Link>

          {/* Section icons */}
          <div className="flex-1 flex flex-col items-center gap-1">
            {sections.map((section) => {
              const isOpen = openSection === section.id;
              const isActive = openSection
                ? isOpen
                : findActiveSection([section], location.pathname) === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                  className={cn("relative w-full flex flex-col items-center justify-center py-2 gap-1")}
                >
                  {isActive && (
                    <motion.div
                      layoutId="rail-indicator"
                      className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}>
                    <section.icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className={cn(
                    "text-[10px] leading-tight transition-colors",
                    isActive ? "text-sidebar-foreground font-medium" : "text-sidebar-foreground/60"
                  )}>
                    {section.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom icons */}
          <div className="flex flex-col items-center gap-1 mt-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => navigate("/help")} className={cn("h-9 w-9 rounded-lg flex items-center justify-center transition-colors", isActiveRoute("/help") ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
                  <HelpCircle className="w-[18px] h-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Help & Support</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => navigate("/settings")} className={cn("h-9 w-9 rounded-lg flex items-center justify-center transition-colors", isActiveRoute("/settings") ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
                  <Settings className="w-[18px] h-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Settings</TooltipContent>
            </Tooltip>
          </div>
        </motion.div>

        {/* Flyout Panel */}
        <AnimatePresence>
          {activeSection && (
            <motion.div
              ref={flyoutRef}
              key={activeSection.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed left-[72px] top-0 h-dvh w-52 bg-sidebar border-r border-sidebar-border z-40 flex flex-col shadow-xl"
            >
              {/* Project selector — always visible */}
              <div className="px-3 py-2 border-b border-sidebar-border">
                <ProjectSelector currentProjectId={effectiveProjectId} />
              </div>

              {/* Section header */}
              <div className="px-4 border-b border-sidebar-border mx-0 py-[20px] my-0">
                <span className="font-bold uppercase tracking-widest text-sidebar-foreground/70 text-sm">
                  {activeSection.label}
                </span>
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3 space-y-1">
                {activeSection.items.map((item) => (
                  <FlyoutNavItem
                    key={item.id}
                    item={item}
                    isActive={isActiveRoute(item.href)}
                    isPro={isPro}
                    isAdvanced={isAdvanced}
                    hasAdminAccess={hasAdminAccess}
                    onNavigate={handleDesktopNav}
                    onUpgradeClick={handleUpgradeClick}
                  />
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UpgradeDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} feature={upgradeFeature} targetTier={upgradeTargetTier} />
    </TooltipProvider>
  );
};
