import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SubscriptionTier } from "@/lib/subscriptionTiers";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Rocket,
  Kanban,
  Lock,
  FolderOpen,
  Crown,
  ClipboardCheck,
  BookOpen,
  MessageSquareText,
  Lightbulb,
  Package,
  Settings,
  HelpCircle,
  Megaphone,
  Link2,
  BarChart3,
  ChevronDown,
  Target,
  Cog,
  FlaskConical,
  Zap,
  Plug,
  Library,
  PenTool,
  ShoppingBag,
} from "lucide-react";
import { ProjectSelector } from "@/components/ProjectSelector";
import { LaunchelyLogo } from "@/components/ui/LaunchelyLogo";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileSidebar } from "@/contexts/MobileSidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeDialog } from "@/components/UpgradeDialog";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  requiresStep?: string;
  isProOnly?: boolean;
  isContentVaultOrPro?: boolean;
  requiresProject?: boolean;
}

interface NavSection {
  heading: string;
  items: NavItem[];
  isProOnly?: boolean;
}

const createNavSections = (projectId?: string): NavSection[] => [
  {
    heading: "Assessments",
    items: [
      { id: "assessments", label: "All Assessments", icon: ClipboardCheck, href: "/assessments" },
    ],
  },
  {
    heading: "Plan",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: projectId ? `/projects/${projectId}/dashboard` : "#", requiresProject: !projectId },
      { id: "tasks", label: "Tasks", icon: Kanban, href: projectId ? `/projects/${projectId}/tasks` : "#", requiresProject: !projectId },
      { id: "content", label: "Social Planner", icon: MessageSquareText, href: projectId ? `/projects/${projectId}/content` : "#", isProOnly: true, requiresProject: !projectId },
      { id: "playbook", label: "Playbook", icon: BookOpen, href: `/playbook` },
      { id: "insights", label: "Insights", icon: Lightbulb, href: projectId ? `/projects/${projectId}/insights` : "#", isProOnly: true, requiresProject: !projectId },
      { id: "library", label: "Library", icon: FolderOpen, href: projectId ? `/projects/${projectId}/library` : "#", requiresProject: !projectId },
    ],
  },
  {
    heading: "Resources",
    items: [
      { id: "content-vault", label: "Content Vault", icon: Package, href: "/content-vault", isContentVaultOrPro: true },
    ],
  },
];

interface StepCompletion {
  offers: boolean;
}

const SidebarContent = ({ 
  projectId, 
  navSections, 
  stepCompletion, 
  isStepAccessible, 
  getLockedMessage, 
  isActiveRoute,
  onNavigate,
  tier,
  onUpgradeClick
}: {
  projectId?: string;
  navSections: NavSection[];
  stepCompletion: StepCompletion;
  isStepAccessible: (requiresStep?: string) => boolean;
  getLockedMessage: (requiresStep?: string) => string;
  isActiveRoute: (href: string) => boolean;
  onNavigate?: () => void;
  tier: SubscriptionTier;
  onUpgradeClick: (feature: string) => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine access levels based on tier
  const isPro = tier === 'pro' || tier === 'admin';
  const isContentVaultOrProAccess = tier === 'content_vault' || tier === 'pro' || tier === 'admin';

  const handleNavClick = (href: string) => {
    onNavigate?.();
    navigate(href);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <Link to="/app" onClick={onNavigate}>
          <LaunchelyLogo size="md" textClassName="text-sidebar-accent-foreground text-base" />
        </Link>
      </div>

      {/* Project Selector */}
      <div className="px-3 py-2 border-b border-sidebar-border">
        <ProjectSelector currentProjectId={projectId} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {navSections.map((section, sectionIndex) => (
          <div key={section.heading}>
            {sectionIndex > 0 && <Separator className="mb-3 bg-sidebar-border" />}
            <div className="mb-1.5 px-2 flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-sidebar-foreground uppercase tracking-wider">
                {section.heading}
              </span>
              {section.isProOnly && !isPro && (
                <Crown className="w-3 h-3 text-primary" />
              )}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = isActiveRoute(item.href);
                const isAccessible = isStepAccessible(item.requiresStep);
                const isLocked = !isAccessible;
                const isProLocked = item.isProOnly && !isPro;
                const isVaultLocked = item.isContentVaultOrPro && !isContentVaultOrProAccess;
                const isFeatureLocked = isProLocked || isVaultLocked;
                const requiresProject = item.requiresProject;

                // Requires project selection
                if (requiresProject) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-not-allowed",
                            "text-sidebar-foreground/40"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Select a project first</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                // Feature-locked items (Pro or Content Vault tier required)
                if (isFeatureLocked) {
                  const upgradeMessage = isProLocked 
                    ? "Pro feature - Upgrade to access" 
                    : "Content Vault feature - Upgrade to access";
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onUpgradeClick(item.label)}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm w-full text-left",
                            "text-sidebar-foreground/40 hover:bg-sidebar-accent/30 cursor-pointer"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="flex-1">{item.label}</span>
                          <Crown className="w-3 h-3 text-yellow-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{upgradeMessage}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                // Step-locked items
                if (isLocked) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-not-allowed",
                            "text-sidebar-foreground/40"
                          )}
                        >
                          <Lock className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{getLockedMessage(item.requiresStep)}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors w-full text-left",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive && "text-sidebar-primary")} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Marketing Hub section - Admin only */}
        {isPro && (() => {
          const marketingItems: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; disabled?: boolean }[] = [
            { label: "Campaigns", href: "/marketing-hub/campaigns", icon: Target },
            { label: "Content Engine", href: "#", icon: PenTool, disabled: true },
            { label: "Funnels & Offers", href: "#", icon: ShoppingBag, disabled: true },
            { label: "Analytics", href: "/marketing-hub/analytics", icon: BarChart3 },
            { label: "Experiments", href: "#", icon: FlaskConical, disabled: true },
            { label: "Automations", href: "#", icon: Zap, disabled: true },
            { label: "Integrations", href: "#", icon: Plug, disabled: true },
            { label: "Library", href: "#", icon: Library, disabled: true },
          ];
          return (
            <div>
              <Separator className="mb-3 bg-sidebar-border" />
              <div className="mb-1.5 px-2">
                <span className="text-[11px] font-semibold text-sidebar-foreground uppercase tracking-wider">Marketing Hub</span>
              </div>
              <div className="space-y-0.5">
                {marketingItems.map((item) => {
                  if (item.disabled) {
                    return (
                      <Tooltip key={item.label}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground/40 cursor-not-allowed w-full">
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>Coming soon</p></TooltipContent>
                      </Tooltip>
                    );
                  }
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href);
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleNavClick(item.href)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors w-full text-left",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", isActive && "text-sidebar-primary")} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </nav>
      {/* Sticky footer links */}
      <div className="mt-auto px-3 py-3 border-t border-sidebar-border space-y-0.5">
        <button
          onClick={() => handleNavClick("/help")}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors w-full text-left",
            isActiveRoute("/help")
              ? "text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <HelpCircle className={cn("w-4 h-4", isActiveRoute("/help") && "text-sidebar-primary")} />
          <span>Help & Support</span>
        </button>
        <button
          onClick={() => handleNavClick("/settings")}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors w-full text-left",
            isActiveRoute("/settings")
              ? "text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className={cn("w-4 h-4", isActiveRoute("/settings") && "text-sidebar-primary")} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export const ProjectSidebar = () => {
  const location = useLocation();
  const { id: projectId } = useParams();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const isMobile = useIsMobile();
  const { isOpen, close } = useMobileSidebar();
  const { hasAdminAccess, tier } = useFeatureAccess();

  // Use the projectId from params, or try to get from localStorage for global pages
  const [storedProjectId, setStoredProjectId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    const stored = localStorage.getItem("lastProjectInfo");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStoredProjectId(parsed.id);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Use URL projectId if available, otherwise fall back to stored projectId
  const effectiveProjectId = projectId || storedProjectId;

  // Fetch offers data to determine offers step completion
  const { data: offers } = useQuery({
    queryKey: ['offers', effectiveProjectId],
    queryFn: async () => {
      if (!effectiveProjectId) return [];
      const { data, error } = await supabase
        .from('offers')
        .select('title')
        .eq('project_id', effectiveProjectId);
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveProjectId,
  });

  // Fetch project data for saving to localStorage
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Save current project to localStorage when on a project page
  useEffect(() => {
    if (projectId && project?.name) {
      const projectInfo = { id: projectId, name: project.name };
      localStorage.setItem("lastProjectInfo", JSON.stringify(projectInfo));
      setStoredProjectId(projectId);
    }
  }, [projectId, project?.name]);

  // Always create nav sections, passing effectiveProjectId to determine which items need project
  const navSections = createNavSections(effectiveProjectId);

  // Determine step completion status
  const stepCompletion: StepCompletion = {
    offers: (offers && offers.length > 0) ?? false,
  };

  const isStepAccessible = (requiresStep?: string): boolean => {
    if (!requiresStep) return true;
    return stepCompletion[requiresStep as keyof StepCompletion] ?? false;
  };

  const getLockedMessage = (requiresStep?: string): string => {
    switch (requiresStep) {
      case "offers":
        return "Complete Offer Stack first";
      default:
        return "Complete previous step first";
    }
  };

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  const handleUpgradeClick = (feature: string) => {
    setUpgradeFeature(feature);
    setShowUpgradeDialog(true);
  };

  const sidebarContentProps = {
    projectId: effectiveProjectId,
    navSections,
    stepCompletion,
    isStepAccessible,
    getLockedMessage,
    tier,
    isActiveRoute,
    onUpgradeClick: handleUpgradeClick,
  };

  // Mobile: render as Sheet
  if (isMobile) {
    return (
      <TooltipProvider>
        <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
          <SheetContent 
            side="left" 
            className="w-[280px] p-0 bg-sidebar border-r border-sidebar-border"
          >
            <SidebarContent {...sidebarContentProps} onNavigate={close} />
          </SheetContent>
        </Sheet>
        <UpgradeDialog 
          open={showUpgradeDialog} 
          onOpenChange={setShowUpgradeDialog} 
          feature={upgradeFeature}
        />
      </TooltipProvider>
    );
  }

  // Desktop: render as fixed sidebar
  return (
    <TooltipProvider>
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed left-0 top-0 h-screen w-56 bg-sidebar border-r border-sidebar-border z-50 hidden md:flex"
      >
        <SidebarContent {...sidebarContentProps} />
      </motion.aside>
      <UpgradeDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog} 
        feature={upgradeFeature}
      />
    </TooltipProvider>
  );
};
