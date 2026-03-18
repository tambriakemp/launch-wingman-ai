import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Activity,
  FileText,
  Bell,
  Settings,
  Headphones,
  Tag,
  Package,
  BookOpen,
  Video,
  Palette,
  ExternalLink,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { LaunchelyLogo } from "@/components/ui/LaunchelyLogo";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileSidebar } from "@/contexts/MobileSidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { ImageIcon } from "lucide-react";

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

const navSections: NavSection[] = [
  {
    heading: "Dashboard",
    items: [
      { id: "overview", label: "Overview", icon: BarChart3, href: "/admin" },
    ],
  },
  {
    heading: "Users & Activity",
    items: [
      { id: "users", label: "Users", icon: Users, href: "/admin/users" },
      { id: "activity", label: "Activity Logs", icon: FileText, href: "/admin/activity" },
    ],
  },
  {
    heading: "Analytics & Monitoring",
    items: [
      { id: "analytics", label: "Analytics", icon: Activity, href: "/admin/analytics" },
      { id: "monitoring", label: "Monitoring", icon: Bell, href: "/admin/monitoring" },
    ],
  },
  {
    heading: "Tools",
    items: [
      { id: "coupons", label: "Coupons", icon: Tag, href: "/admin/coupons" },
      { id: "support", label: "Support", icon: Headphones, href: "/admin/support" },
      { id: "config", label: "Config", icon: Settings, href: "/admin/config" },
    ],
  },
  {
    heading: "Content & Assets",
    items: [
      { id: "content-vault", label: "Content Vault", icon: Package, href: "/admin/content-vault" },
      { id: "assets", label: "Assets", icon: ImageIcon, href: "/admin/assets" },
      { id: "brand-kit", label: "Brand Kit", icon: Palette, href: "/admin/brand-kit" },
      { id: "link-in-bio", label: "Link-in-Bio", icon: ExternalLink, href: "/admin/link-in-bio" },
    ],
  },
  {
    heading: "Resources",
    items: [
      { id: "docs", label: "Training & Docs", icon: BookOpen, href: "/admin/docs" },
      { id: "video-instructions", label: "Video Instructions", icon: Video, href: "/admin/video-instructions" },
    ],
  },
];

const SidebarContent = ({
  isActiveRoute,
  onNavigate,
}: {
  isActiveRoute: (href: string) => boolean;
  onNavigate?: () => void;
}) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleNavClick = (href: string) => {
    onNavigate?.();
    navigate(href);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Logo + Admin badge */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Link to="/app" onClick={onNavigate}>
            <LaunchelyLogo size="md" textClassName="text-sidebar-accent-foreground text-base" />
          </Link>
          <Badge variant="outline" className="text-[10px] border-sidebar-border text-sidebar-foreground/70">
            Admin
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2 space-y-3">
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
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors w-full text-left",
                      isActive
                        ? "text-sidebar-accent-foreground font-medium"
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

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
        <button
          onClick={() => handleNavClick("/app")}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground w-full text-left"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export const AdminSidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isOpen, close } = useMobileSidebar();

  const isActiveRoute = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent
          side="left"
          className="w-[280px] p-0 bg-sidebar border-r border-sidebar-border"
        >
          <SidebarContent isActiveRoute={isActiveRoute} onNavigate={close} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-screen w-56 bg-sidebar border-r border-sidebar-border z-50 hidden md:flex"
    >
      <SidebarContent isActiveRoute={isActiveRoute} />
    </motion.aside>
  );
};
