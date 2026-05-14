import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Package,
  MessageSquare,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  CreditCard,
} from "lucide-react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useHaptics } from "@/hooks/useHaptics";
import { supabase } from "@/integrations/supabase/client";
import { TIER_DISPLAY_NAMES } from "@/lib/subscriptionTiers";
import { openExternalUrl } from "@/lib/nativeBridge";
import { toast } from "sonner";

interface NavItem {
  label: string;
  description: string;
  icon: typeof Package;
  href?: string;
  onClick?: () => void;
}

interface NavGroup {
  eyebrow: string;
  items: NavItem[];
}

const MeHub = () => {
  const { user, signOut, isSubscribed } = useAuth();
  const { tier } = useFeatureAccess();

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
  });

  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || user?.email || "Friend";
  // Prefer two-letter initials (TK) over a single letter — closer to native
  // iOS Settings + reads as identity rather than placeholder.
  const initials = (() => {
    const a = firstName?.[0]?.toUpperCase();
    const b = lastName?.[0]?.toUpperCase();
    if (a && b) return `${a}${b}`;
    if (a) return a;
    return user?.email?.[0]?.toUpperCase() || "Y";
  })();
  const tierLabel = TIER_DISPLAY_NAMES[tier] ?? "Free";

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        await openExternalUrl(data.url);
      }
    } catch (err) {
      console.error("Portal error:", err);
      toast.error("Couldn't open subscription management. Please try again.");
    }
  };

  const groups: NavGroup[] = [
    {
      eyebrow: "Resources",
      items: [
        {
          label: "Content Vault",
          description: "Templates, swipes, and saved drafts",
          icon: Package,
          href: "/content-vault",
        },
        {
          label: "Check-In Journal",
          description: "Past reflections, in your own words",
          icon: MessageSquare,
          href: "/check-ins",
        },
      ],
    },
    {
      eyebrow: "Account",
      items: [
        {
          label: "Settings",
          description: "Profile, integrations, preferences",
          icon: SettingsIcon,
          href: "/settings",
        },
        ...(isSubscribed
          ? [
              {
                label: "Manage Subscription",
                description: "Update payment, plan, or cancel",
                icon: CreditCard,
                onClick: handleManageSubscription,
              } as NavItem,
            ]
          : []),
        {
          label: "Help & Support",
          description: "Get unstuck, contact the team",
          icon: HelpCircle,
          href: "/help",
        },
      ],
    },
  ];

  return (
    <ProjectLayout>
      <div className="max-w-2xl mx-auto px-4 md:px-0 py-6 md:py-0 space-y-9">
        {/* Header — avatar + greeting + tier */}
        <header className="space-y-4">
          <p className="eyebrow">Account</p>
          <div className="flex items-start gap-4">
            <div
              className="shrink-0 inline-flex items-center justify-center rounded-full"
              style={{
                width: 64,
                height: 64,
                background: "hsl(var(--ink-900))",
                color: "hsl(var(--paper-100))",
                fontFamily: '"Fraunces", Georgia, serif',
                fontWeight: 500,
                fontSize: 24,
                letterSpacing: -0.5,
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <h1 className="font-serif text-2xl md:text-3xl font-medium text-foreground tracking-tight leading-snug truncate">
                {fullName}
              </h1>
              {user?.email && fullName !== user.email && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{user.email}</p>
              )}
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[hsl(var(--terracotta-500)/0.10)]">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: "hsl(var(--terracotta-500))" }}
                />
                <span className="text-xs font-medium text-[hsl(var(--terracotta-700))]">
                  {tierLabel} plan
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Grouped nav */}
        {groups.map((group) => (
          <NavGroupSection key={group.eyebrow} group={group} />
        ))}

        {/* Sign out — destructive, lives alone at the bottom */}
        <SignOutCard onSignOut={signOut} />
      </div>
    </ProjectLayout>
  );
};

const NavGroupSection = ({ group }: { group: NavGroup }) => {
  const { trigger: haptic } = useHaptics();
  return (
    <section className="space-y-3">
      <p className="eyebrow px-1">{group.eyebrow}</p>
      <div
        className="rounded-2xl bg-card overflow-hidden"
        style={{ boxShadow: "0 1px 2px rgba(31,27,23,0.04)" }}
      >
        {group.items.map((item, i) => {
          const Icon = item.icon;
          const sharedClass =
            "w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-[transform,background-color] duration-150 active:scale-[0.985] active:bg-[hsl(var(--paper-100))] hover:bg-[hsl(var(--paper-50))]";
          const sharedStyle = {
            borderTop: i === 0 ? 0 : `0.5px solid hsl(var(--border-hairline))`,
          };
          const inner = (
            <>
              <div
                className="shrink-0 inline-flex items-center justify-center rounded-xl"
                style={{
                  width: 38,
                  height: 38,
                  background: "rgba(198,90,62,0.10)",
                }}
              >
                <Icon size={18} strokeWidth={2} color="hsl(var(--terracotta-500))" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-[15px] leading-snug tracking-tight">
                  {item.label}
                </div>
                <div className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">
                  {item.description}
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-muted-foreground" />
            </>
          );

          return item.href ? (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => haptic("selection")}
              className={sharedClass}
              style={sharedStyle}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                haptic("selection");
                item.onClick?.();
              }}
              className={sharedClass}
              style={sharedStyle}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
};

const SignOutCard = ({ onSignOut }: { onSignOut: () => void }) => {
  const { trigger: haptic } = useHaptics();
  return (
    <section className="pt-2">
      <button
        type="button"
        onClick={() => {
          haptic("medium");
          onSignOut();
        }}
        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-card transition-[transform,background-color] duration-150 active:scale-[0.985] active:bg-[hsl(var(--paper-100))] hover:bg-[hsl(var(--paper-50))]"
        style={{ boxShadow: "0 1px 2px rgba(31,27,23,0.04)" }}
      >
        <div
          className="shrink-0 inline-flex items-center justify-center rounded-xl"
          style={{
            width: 38,
            height: 38,
            background: "hsl(var(--destructive)/0.10)",
          }}
        >
          <LogOut size={18} strokeWidth={2} color="hsl(var(--destructive))" />
        </div>
        <span className="flex-1 text-left font-medium text-[15px] text-[hsl(var(--destructive))] tracking-tight">
          Sign out
        </span>
      </button>
    </section>
  );
};

export default MeHub;
