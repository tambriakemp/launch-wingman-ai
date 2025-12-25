import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Sparkles,
  LayoutDashboard,
  Rocket,
  Image,
  Palette,
  Type,
  Camera,
  FileText,
  AtSign,
  Mail,
  Package,
  Kanban,
  Calendar,
  Users,
  Lock,
  ArrowLeft,
  FolderOpen,
  Crown,
  Server,
  ClipboardCheck,
} from "lucide-react";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileSidebar } from "@/contexts/MobileSidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradeDialog } from "@/components/UpgradeDialog";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  requiresStep?: string;
  isProOnly?: boolean;
}

interface NavSection {
  heading: string;
  items: NavItem[];
  isProOnly?: boolean;
}

const createNavSections = (projectId: string): NavSection[] => [
  {
    heading: "Assessments",
    items: [
      { id: "assessments", label: "All Assessments", icon: ClipboardCheck, href: "/assessments" },
    ],
  },
  {
    heading: "Plan",
    items: [
      { id: "offer", label: "Dashboard", icon: LayoutDashboard, href: `/projects/${projectId}/offer` },
      { id: "board", label: "Project Board", icon: Kanban, href: `/projects/${projectId}/board` },
      { id: "content-planner", label: "Content Planner", icon: Calendar, href: `/projects/${projectId}/social`, isProOnly: true },
      { id: "funnel-type", label: "Funnel Type", icon: Rocket, href: `/projects/${projectId}/funnel-type` },
      { id: "audience", label: "Audience", icon: Users, href: `/projects/${projectId}/audience`, requiresStep: "funnel-type" },
      { id: "transformation", label: "Transformation", icon: Sparkles, href: `/projects/${projectId}/transformation`, requiresStep: "audience" },
      { id: "offers", label: "Offer Stack", icon: Package, href: `/projects/${projectId}/offers`, requiresStep: "transformation" },
      { id: "tech-stack", label: "Tech Stack", icon: Server, href: `/projects/${projectId}/tech-stack`, requiresStep: "offers" },
    ],
  },
  {
    heading: "Funnel Branding",
    isProOnly: true,
    items: [
      { id: "logos", label: "Logos", icon: Image, href: `/projects/${projectId}/logos`, isProOnly: true },
      { id: "colors", label: "Colors", icon: Palette, href: `/projects/${projectId}/colors`, isProOnly: true },
      { id: "fonts", label: "Fonts", icon: Type, href: `/projects/${projectId}/fonts`, isProOnly: true },
      { id: "photos", label: "Photos", icon: Camera, href: `/projects/${projectId}/photos`, isProOnly: true },
    ],
  },
  {
    heading: "Messaging",
    isProOnly: true,
    items: [
      { id: "sales-copy", label: "Sales Copy", icon: FileText, href: `/projects/${projectId}/sales-copy`, isProOnly: true },
      { id: "social-bio", label: "Social Bio", icon: AtSign, href: `/projects/${projectId}/social-bio`, isProOnly: true },
      { id: "emails", label: "Emails", icon: Mail, href: `/projects/${projectId}/emails`, isProOnly: true },
      { id: "deliverables", label: "Deliverables", icon: Package, href: `/projects/${projectId}/deliverables`, isProOnly: true },
    ],
  },
];

interface StepCompletion {
  "funnel-type": boolean;
  audience: boolean;
  transformation: boolean;
  offers: boolean;
  "tech-stack": boolean;
}

interface LastProjectInfo {
  id: string;
  name: string;
}

const SidebarContent = ({ 
  projectId, 
  navSections, 
  stepCompletion, 
  isStepAccessible, 
  getLockedMessage, 
  isActiveRoute,
  lastProject,
  onNavigate,
  isSubscribed,
  onUpgradeClick
}: {
  projectId?: string;
  navSections: NavSection[];
  stepCompletion: StepCompletion;
  isStepAccessible: (requiresStep?: string) => boolean;
  getLockedMessage: (requiresStep?: string) => string;
  isActiveRoute: (href: string) => boolean;
  lastProject: LastProjectInfo | null;
  onNavigate?: () => void;
  isSubscribed: boolean;
  onUpgradeClick: (feature: string) => void;
}) => {
  const navigate = useNavigate();

  const handleNavClick = (href: string) => {
    onNavigate?.();
    navigate(href);
  };

  if (!projectId) {
    return (
      <>
        {/* Logo */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <Link to="/app" className="flex items-center gap-2" onClick={onNavigate}>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-base font-semibold text-sidebar-accent-foreground">Launchely</span>
          </Link>
        </div>

        {/* Back to Project Navigation */}
        <div className="px-3 py-3 border-b border-sidebar-border space-y-2">
          {lastProject ? (
            <button
              onClick={() => handleNavClick(`/projects/${lastProject.id}/offer`)}
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full text-left"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="truncate">Back to {lastProject.name}</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavClick("/app")}
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full text-left"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Go to Projects</span>
            </button>
          )}
        </div>

        {/* Navigation - Show Assessments section even without project */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Assessments Section */}
          <div>
            <div className="mb-1.5 px-2">
              <span className="text-[11px] font-semibold text-sidebar-foreground uppercase tracking-wider">
                Assessments
              </span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNavClick("/assessments")}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors w-full text-left",
                  isActiveRoute("/assessments")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <ClipboardCheck className={cn("w-4 h-4", isActiveRoute("/assessments") && "text-sidebar-primary")} />
                <span>All Assessments</span>
              </button>
            </div>
          </div>
          
          <Separator className="bg-sidebar-border" />
          
          <p className="px-2 py-2 text-xs text-sidebar-foreground/60">
            Select a project to see more options.
          </p>
        </nav>
      </>
    );
  }

  return (
    <>
      {/* Logo */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <Link to="/app" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Rocket className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="text-base font-semibold text-sidebar-accent-foreground">Launchely</span>
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
              {section.isProOnly && !isSubscribed && (
                <Crown className="w-3 h-3 text-primary" />
              )}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = isActiveRoute(item.href);
                const isAccessible = isStepAccessible(item.requiresStep);
                const isLocked = !isAccessible;
                const isProLocked = item.isProOnly && !isSubscribed;

                // Pro-locked items
                if (isProLocked) {
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
                          <Crown className="w-3 h-3 text-primary" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Pro feature - Click to upgrade</p>
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
      </nav>
    </>
  );
};

export const ProjectSidebar = () => {
  const location = useLocation();
  const { id: projectId } = useParams();
  const [lastProject, setLastProject] = useState<LastProjectInfo | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const isMobile = useIsMobile();
  const { isOpen, close } = useMobileSidebar();
  const { isSubscribed } = useAuth();

  // Determine if we're on an assessment page
  const isOnAssessmentPage = location.pathname.startsWith('/assessments');

  // Load last project from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("lastProjectInfo");
    if (stored) {
      try {
        setLastProject(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Use lastProject.id when on assessment pages to show full navigation
  const effectiveProjectId = projectId || (isOnAssessmentPage ? lastProject?.id : undefined);

  // Fetch funnel data to determine step completion
  const { data: funnel } = useQuery({
    queryKey: ['funnel', effectiveProjectId],
    queryFn: async () => {
      if (!effectiveProjectId) return null;
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('project_id', effectiveProjectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveProjectId,
  });

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

  // Fetch project data for transformation statement and name
  const { data: project } = useQuery({
    queryKey: ['project', effectiveProjectId],
    queryFn: async () => {
      if (!effectiveProjectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('transformation_statement, name')
        .eq('id', effectiveProjectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveProjectId,
  });

  // Save current project to localStorage when on a project page (not assessment pages)
  useEffect(() => {
    if (projectId && project?.name) {
      const projectInfo: LastProjectInfo = { id: projectId, name: project.name };
      localStorage.setItem("lastProjectInfo", JSON.stringify(projectInfo));
      setLastProject(projectInfo);
    }
  }, [projectId, project?.name]);

  const navSections = effectiveProjectId ? createNavSections(effectiveProjectId) : [];

  // Determine step completion status
  const stepCompletion: StepCompletion = {
    "funnel-type": !!funnel?.funnel_type,
    audience: !!(funnel?.niche && funnel?.target_audience && funnel?.primary_pain_point && funnel?.desired_outcome),
    transformation: !!project?.transformation_statement,
    offers: (offers && offers.length > 0) ?? false,
    "tech-stack": !!(funnel?.funnel_platform || funnel?.email_platform || funnel?.community_platform),
  };

  const isStepAccessible = (requiresStep?: string): boolean => {
    if (!requiresStep) return true;
    return stepCompletion[requiresStep as keyof StepCompletion] ?? false;
  };

  const getLockedMessage = (requiresStep?: string): string => {
    switch (requiresStep) {
      case "funnel-type":
        return "Complete Funnel Type first";
      case "audience":
        return "Complete Audience first";
      case "transformation":
        return "Complete Audience first";
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
    isActiveRoute,
    lastProject,
    isSubscribed,
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
            <div className="h-full flex flex-col">
              <SidebarContent {...sidebarContentProps} onNavigate={close} />
            </div>
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
        className="fixed left-0 top-0 h-screen w-56 bg-sidebar border-r border-sidebar-border flex-col z-50 hidden md:flex"
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
