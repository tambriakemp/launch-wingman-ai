import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { icon: FolderKanban, label: "Projects", href: "/app" },
  { icon: ClipboardCheck, label: "Assessments", href: "/assessments" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export const DashboardSidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin } = useAdmin();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/app" className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-foreground">Coach Hub</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/app" && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        
        {/* Admin Link - only shown to admins */}
        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              location.pathname === "/admin"
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <Shield className={cn("w-5 h-5", location.pathname === "/admin" && "text-primary")} />
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* User & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {!collapsed && user && (
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn("w-full justify-start gap-3", collapsed && "justify-center px-0")}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </motion.aside>
  );
};

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        sidebarCollapsed ? "ml-20" : "ml-64"
      )}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
