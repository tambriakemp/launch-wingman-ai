import { Capacitor } from "@capacitor/core";

export interface ReminderHabit {
  id: string;
  name: string;
  reminder_time: string | null; // "HH:mm:ss" or "HH:mm"
}

function notifIdFor(habitId: string): number {
  // Stable 31-bit hash from uuid for use as a notification id
  let h = 0;
  for (let i = 0; i < habitId.length; i++) {
    h = (h * 31 + habitId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2147483647;
}

export async function syncHabitReminders(habits: ReminderHabit[]) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const perms = await LocalNotifications.checkPermissions();
    if (perms.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== "granted") return;
    }
    // Cancel existing
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    }
    const toSchedule = habits
      .filter(h => h.reminder_time)
      .map(h => {
        const [hh, mm] = (h.reminder_time as string).split(":").map(Number);
        return {
          id: notifIdFor(h.id),
          title: h.name,
          body: "A small promise to keep.",
          schedule: { on: { hour: hh, minute: mm }, allowWhileIdle: true, repeats: true },
        };
      });
    if (toSchedule.length) {
      await LocalNotifications.schedule({ notifications: toSchedule });
    }
  } catch (e) {
    console.warn("[habits] reminder sync failed", e);
  }
}

export async function lightHaptic() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

export async function successHaptic() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {}
}
