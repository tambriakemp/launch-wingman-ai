import { Link } from "react-router-dom";
import { Settings, Shield, LogOut, Menu, ArrowLeftCircle, BookOpen, Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileSidebar } from "@/contexts/MobileSidebarContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CommandSearchPill } from "./CommandSearchPill";

export const TopBar = () => {
  const { user, signOut, isImpersonating, impersonatedUserEmail, stopImpersonation } = useAuth();
  const { hasAdminAccess } = useFeatureAccess();
  const isMobile = useIsMobile();
  const { toggle } = useMobileSidebar();

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

  const userInitial =
    profile?.first_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between gap-3 px-3 md:px-10 py-3 border-b border-[hsl(var(--hairline))] backdrop-blur-md"
      style={{ backgroundColor: "rgba(251, 247, 241, 0.85)" }}
    >
      {/* Left: hamburger (mobile) or date eyebrow (desktop) */}
      <div className="flex items-center gap-2 min-w-0">
        {isMobile ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={toggle}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : (
          <span
            className="text-[hsl(var(--fg-muted))] uppercase whitespace-nowrap"
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontSize: 11,
              letterSpacing: "0.14em",
              fontWeight: 600,
            }}
          >
            {format(new Date(), "EEE · MMMM d")}
          </span>
        )}
      </div>

      {/* Center: search pill */}
      <CommandSearchPill />

      {/* Right: actions */}
      <nav className="flex items-center gap-1 shrink-0">
        <Link
          to="/help"
          className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
          aria-label="Help"
        >
          <BookOpen className="w-4 h-4" />
        </Link>
        <button
          type="button"
          className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity"
              aria-label="Account menu"
            >
              <span
                className="text-[12px] font-semibold leading-none"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {userInitial}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
                  className="flex items-center gap-2 cursor-pointer text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                >
                  <ArrowLeftCircle className="w-4 h-4" />
                  Return to Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link to="/help" className="flex items-center gap-2 cursor-pointer">
                <HelpCircle className="w-4 h-4" />
                Help & Support
              </Link>
            </DropdownMenuItem>
            {hasAdminAccess && !isImpersonating && (
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="flex items-center gap-2 cursor-pointer text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
};
