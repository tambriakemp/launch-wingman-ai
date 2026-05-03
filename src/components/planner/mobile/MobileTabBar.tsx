import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Sparkles, Folder, User } from "lucide-react";

const TABS = [
  { id: "home", label: "Today", icon: Home, to: "/dashboard" },
  { id: "plan", label: "Plan", icon: Calendar, to: "/planner" },
  { id: "craft", label: "Craft", icon: Sparkles, to: "/marketing-hub" },
  { id: "library", label: "Library", icon: Folder, to: "/content-vault" },
  { id: "me", label: "Me", icon: User, to: "/settings" },
];

const TERRACOTTA = "#C65A3E";
const INK_60 = "rgba(31,27,23,0.62)";
const HAIRLINE = "rgba(31,27,23,0.10)";

export const MobileTabBar = ({ active }: { active?: string }) => {
  const location = useLocation();
  const activeId =
    active ||
    TABS.find((t) => location.pathname.startsWith(t.to))?.id ||
    "plan";

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40 md:hidden"
      style={{
        background: "rgba(251,247,241,0.84)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderTop: `0.5px solid ${HAIRLINE}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex justify-around pt-1 pb-0">
        {TABS.map((t) => {
          const isActive = activeId === t.id;
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              to={t.to}
              className="flex flex-col items-center py-1 px-2.5"
              style={{ color: isActive ? TERRACOTTA : INK_60, gap: 1 }}
            >
              <Icon size={24} strokeWidth={isActive ? 2.2 : 1.7} />
              <span
                style={{
                  fontFamily:
                    '-apple-system, "SF Pro Text", system-ui, sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.05,
                }}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
