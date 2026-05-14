import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const handleClose = () => onOpenChange(false);

  const handleItemTap = async (n: AppNotification) => {
    if (!n.read_at) {
      try {
        await markAsRead(n.id);
      } catch {
        /* ignore */
      }
    }
    if (n.url) {
      handleClose();
      navigate(n.url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch {
      /* ignore */
    }
  };

  const body = (
    <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
      <div className="space-y-2">
        <p className="eyebrow">Notifications</p>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-medium text-foreground tracking-tight">
            {unreadCount > 0 ? `${unreadCount} new` : "All caught up"}
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck size={14} strokeWidth={2} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-2xl bg-card border border-[hsl(var(--border-hairline))] overflow-hidden">
          {notifications.map((n, i) => {
            const isUnread = !n.read_at;
            const when = formatDistanceToNow(parseISO(n.created_at), { addSuffix: true });
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleItemTap(n)}
                className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors active:bg-[hsl(var(--paper-100))]"
                style={{
                  borderTop: i === 0 ? 0 : `0.5px solid hsl(var(--border-hairline))`,
                  background: isUnread ? "hsl(var(--paper-50))" : "transparent",
                }}
              >
                <div
                  className="shrink-0 mt-1 rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: isUnread ? "hsl(var(--terracotta-500))" : "transparent",
                  }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-[15px] leading-snug tracking-tight">
                    {n.title}
                  </div>
                  {n.body && (
                    <div className="text-[13.5px] text-muted-foreground mt-1 leading-snug">
                      {n.body}
                    </div>
                  )}
                  <div className="text-[12px] text-muted-foreground/70 mt-1.5">{when}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}>
        <DrawerContent className="pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto w-full">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">{body}</DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <div className="card-soft p-8 text-center space-y-4">
      <div
        className="mx-auto inline-flex items-center justify-center rounded-2xl"
        style={{
          width: 56,
          height: 56,
          background: "rgba(198,90,62,0.10)",
        }}
      >
        <Bell size={24} color="hsl(var(--terracotta-500))" strokeWidth={1.8} />
      </div>
      <div className="space-y-2">
        <h3 className="font-serif text-lg text-foreground tracking-tight">No notifications yet</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We'll let you know when there's something worth seeing — reminders, milestones, and updates from your launches.
        </p>
      </div>
    </div>
  );
}
