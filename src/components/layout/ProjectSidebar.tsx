import { Link, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  requiresStep?: string;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

const createNavSections = (projectId: string): NavSection[] => [
  {
    heading: "Plan",
    items: [
      { id: "offer", label: "Funnel Overview", icon: LayoutDashboard, href: `/projects/${projectId}/offer` },
      { id: "funnel-type", label: "Funnel Type", icon: Rocket, href: `/projects/${projectId}/funnel-type` },
      { id: "audience", label: "Audience", icon: Users, href: `/projects/${projectId}/audience`, requiresStep: "funnel-type" },
      { id: "transformation", label: "Transformation", icon: Sparkles, href: `/projects/${projectId}/transformation`, requiresStep: "audience" },
      { id: "offers", label: "Offer Stack", icon: Package, href: `/projects/${projectId}/offers`, requiresStep: "transformation" },
    ],
  },
  {
    heading: "Brand",
    items: [
      { id: "logos", label: "Logos", icon: Image, href: `/projects/${projectId}/logos` },
      { id: "colors", label: "Colors", icon: Palette, href: `/projects/${projectId}/colors` },
      { id: "fonts", label: "Fonts", icon: Type, href: `/projects/${projectId}/fonts` },
      { id: "photos", label: "Photos", icon: Camera, href: `/projects/${projectId}/photos` },
    ],
  },
  {
    heading: "Messaging",
    items: [
      { id: "sales-copy", label: "Sales Copy", icon: FileText, href: `/projects/${projectId}/sales-copy` },
      { id: "social-bio", label: "Social Bio", icon: AtSign, href: `/projects/${projectId}/social-bio` },
      { id: "emails", label: "Emails", icon: Mail, href: `/projects/${projectId}/emails` },
      { id: "deliverables", label: "Deliverables", icon: Package, href: `/projects/${projectId}/deliverables` },
    ],
  },
  {
    heading: "Execute",
    items: [
      { id: "board", label: "Project Board", icon: Kanban, href: `/projects/${projectId}/board` },
      { id: "content", label: "Content Planner", icon: Calendar, href: `/projects/${projectId}/content` },
    ],
  },
];

interface StepCompletion {
  "funnel-type": boolean;
  audience: boolean;
  transformation: boolean;
}

export const ProjectSidebar = () => {
  const location = useLocation();
  const { id: projectId } = useParams();

  // Fetch funnel data to determine step completion
  const { data: funnel } = useQuery({
    queryKey: ['funnel', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch project data for transformation statement
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('transformation_statement')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (!projectId) return null;

  const navSections = createNavSections(projectId);

  // Determine step completion status
  const stepCompletion: StepCompletion = {
    "funnel-type": !!funnel?.funnel_type,
    audience: !!(funnel?.niche && funnel?.target_audience),
    // Transformation is optional, so it's "complete" if audience is done
    transformation: !!(funnel?.niche && funnel?.target_audience),
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
      default:
        return "Complete previous step first";
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === `/projects/${projectId}` && location.pathname === `/projects/${projectId}`) {
      return true;
    }
    if (href !== `/projects/${projectId}` && location.pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

  return (
    <TooltipProvider>
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed left-0 top-0 h-screen w-56 bg-sidebar border-r border-sidebar-border flex flex-col z-50"
      >
        {/* Logo */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <span className="text-base font-semibold text-sidebar-accent-foreground">Coach Hub</span>
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
              <div className="mb-1.5 px-2">
                <span className="text-[11px] font-semibold text-sidebar-foreground uppercase tracking-wider">
                  {section.heading}
                </span>
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  const isAccessible = isStepAccessible(item.requiresStep);
                  const isLocked = !isAccessible;

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
                    <Link
                      key={item.id}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", isActive && "text-sidebar-primary")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </motion.aside>
    </TooltipProvider>
  );
};
