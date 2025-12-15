import { Link, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { motion } from "framer-motion";
import {
  Sparkles,
  LogOut,
  Settings,
  Shield,
  LayoutDashboard,
  Gift,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

const createNavSections = (projectId: string): NavSection[] => [
  {
    heading: "Plan",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: `/projects/${projectId}` },
      { id: "offer", label: "Offer Builder", icon: Gift, href: `/projects/${projectId}/offer` },
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

export const ProjectSidebar = () => {
  const location = useLocation();
  const { id: projectId } = useParams();
  const { signOut, user } = useAuth();
  const { isAdmin } = useAdmin();

  if (!projectId) return null;

  const navSections = createNavSections(projectId);

  const isActiveRoute = (href: string) => {
    // Exact match for dashboard
    if (href === `/projects/${projectId}` && location.pathname === `/projects/${projectId}`) {
      return true;
    }
    // Prefix match for other routes
    if (href !== `/projects/${projectId}` && location.pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-screen w-56 bg-sidebar border-r border-sidebar-border flex flex-col z-50"
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">Coach Hub</span>
        </Link>
      </div>

      {/* Project Selector */}
      <div className="p-3 border-b border-sidebar-border">
        <ProjectSelector currentProjectId={projectId} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {navSections.map((section, sectionIndex) => (
          <div key={section.heading}>
            {sectionIndex > 0 && <Separator className="mb-4" />}
            <div className="mb-2 px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.heading}
              </span>
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - Settings, Admin, Sign Out */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200",
            location.pathname === "/settings"
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>

        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200",
              location.pathname === "/admin"
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </Link>
        )}

        {user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-2.5 px-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </motion.aside>
  );
};
