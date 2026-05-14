import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass, CalendarDays, Megaphone, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHaptics } from "@/hooks/useHaptics";

type TabId = "launch" | "planner" | "marketing" | "me";

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Compass;
  to: string;
  // Path prefixes that should activate this tab when the user is anywhere
  // under that section's sub-pages.
  match: string[];
}

const TABS: Tab[] = [
  {
    id: "launch",
    label: "Launch",
    icon: Compass,
    to: "/app",
    match: ["/app", "/projects", "/dashboard", "/playbook"],
  },
  {
    id: "planner",
    label: "Planner",
    icon: CalendarDays,
    to: "/planner-hub",
    match: [
      "/planner-hub",
      "/planner",
      "/social-planner",
      "/goals",
      "/daily",
      "/weekly",
      "/habits",
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    to: "/marketing-hub",
    // AI Studio + Carousel Builder live under Marketing (matches the desktop
    // sidebar grouping) so this tab activates for any of their routes.
    match: ["/marketing-hub", "/app/ai-studio", "/carousel-builder"],
  },
  {
    id: "me",
    label: "Me",
    icon: User,
    to: "/me",
    // Activates whenever the user is in their account surface or one of the
    // hub's destinations. Assessments stay in the Launch tab match list.
    match: ["/me", "/settings", "/help", "/content-vault", "/check-ins"],
  },
];

const TERRACOTTA = "#C65A3E";
const INK_60 = "rgba(31,27,23,0.62)";
const HAIRLINE = "rgba(31,27,23,0.10)";

// Pages that intentionally render full-bleed without app chrome.
const CHROMELESS_PREFIXES = [
  "/auth",
  "/checkout",
  "/links",
  "/unsubscribe",
  "/onboarding",
  "/r/",
];

const isChromelessPath = (pathname: string): boolean =>
  CHROMELESS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p === "/r/" ? p : p + "/") || pathname === p
  );

const matchActiveTab = (pathname: string): Tab => {
  // Prefer the longest matching prefix so /app/ai-studio activates Studio,
  // not Launch (which would also match /app).
  let best: { tab: Tab; len: number } | null = null;
  for (const tab of TABS) {
    for (const prefix of tab.match) {
      if (
        (pathname === prefix || pathname.startsWith(prefix + "/")) &&
        (!best || prefix.length > best.len)
      ) {
        best = { tab, len: prefix.length };
      }
    }
  }
  return best?.tab ?? TABS[0];
};

export function MobileTabBar() {
  const location = useLocation();
  const { trigger: haptic } = useHaptics();
  const isMobile = useIsMobile();

  const chromeless = isChromelessPath(location.pathname);
  const shouldRender = isMobile && !chromeless;

  // Publish the tab bar's reserved height so page layouts (e.g. ProjectLayout)
  // can pad content out from underneath the fixed bar. Variable is unset on
  // desktop and chromeless routes, so consumers fall through to their default.
  useEffect(() => {
    if (!shouldRender) return;
    document.documentElement.style.setProperty(
      "--mobile-tabbar-h",
      "calc(60px + env(safe-area-inset-bottom))"
    );
    return () => {
      document.documentElement.style.removeProperty("--mobile-tabbar-h");
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  const active = matchActiveTab(location.pathname);

  return (
    <nav
      className="fixed left-0 right-0 bottom-0 z-40 pb-safe-b"
      style={{
        background: "rgba(251,247,241,0.92)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderTop: `0.5px solid ${HAIRLINE}`,
      }}
      aria-label="Primary navigation"
    >
      <div className="flex justify-around pt-1.5">
        {TABS.map((t) => {
          const isActive = active.id === t.id;
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              to={t.to}
              onClick={() => {
                if (!isActive) haptic("selection");
              }}
              className="flex flex-col items-center pt-1 pb-1.5 px-3 min-w-[56px]"
              style={{ color: isActive ? TERRACOTTA : INK_60, gap: 2 }}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={26} strokeWidth={isActive ? 2.2 : 1.7} />
              <span
                style={{
                  fontFamily:
                    '-apple-system, "SF Pro Text", system-ui, sans-serif',
                  fontSize: 10.5,
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: 0.05,
                }}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
