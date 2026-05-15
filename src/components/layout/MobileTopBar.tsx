import type { ReactNode } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface MobileTopBarProps {
  /**
   * Optional left-side content. The dashboard uses this for an animated
   * "Today" title that fades in on scroll; hubs leave it empty.
   */
  left?: ReactNode;
}

/**
 * Universal mobile top row. One source of truth for the bell's position
 * on every bottom-tab page (Launch / Planner / Marketing / Me) so they
 * line up exactly. 22px horizontal gutter aligns with the content body;
 * `pt-3` matches the editorial breathing gap below the safe-area inset.
 *
 * Hidden on md+ — the desktop TopBar handles those widths. For pages
 * that need a sticky/blurred bar on scroll (currently just the
 * dashboard), wrap this in an absolute-positioned container; this
 * component is intentionally a plain inline row.
 */
export function MobileTopBar({ left }: MobileTopBarProps) {
  return (
    <div
      className="md:hidden flex items-center justify-between px-[22px] pt-3"
      style={{ minHeight: 36 }}
    >
      <div className="flex-1 min-w-0">{left}</div>
      <NotificationBell />
    </div>
  );
}
