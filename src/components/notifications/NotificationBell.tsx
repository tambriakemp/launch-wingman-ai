import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsSheet } from "./NotificationsSheet";

interface NotificationBellProps {
  /**
   * Toggles a subtle ink background bubble behind the icon. Use `true` for
   * dense surfaces (sticky headers, toolbars) and `false` for content-heavy
   * pages where chrome should sit lightly. Default `true`.
   */
  showBackground?: boolean;
  /** Icon size in px. Default 17 (iOS toolbar). */
  iconSize?: number;
  /** Optional extra Tailwind classes on the wrapper button. */
  className?: string;
}

/**
 * Reusable notification bell: subtle ink-tinted round button with a
 * terracotta unread dot. Opens the NotificationsSheet (Drawer on mobile,
 * Dialog on desktop). One component so badge + open state stay in sync no
 * matter how many surfaces show the bell.
 */
export function NotificationBell({
  showBackground = true,
  iconSize = 17,
  className,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const hasUnread = unreadCount > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          hasUnread ? `${unreadCount} unread notifications` : "Notifications"
        }
        className={className}
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          border: 0,
          background: showBackground ? "rgba(31,27,23,0.06)" : "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Bell size={iconSize} color="#1F1B17" strokeWidth={1.8} />
        {hasUnread && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 7,
              right: 8,
              minWidth: 8,
              height: 8,
              borderRadius: 999,
              background: "#C65A3E",
              border: "1.5px solid rgba(251,247,241,1)",
            }}
          />
        )}
      </button>
      <NotificationsSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
