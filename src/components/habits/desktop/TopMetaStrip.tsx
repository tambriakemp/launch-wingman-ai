import { Bell } from "lucide-react";
import { format } from "date-fns";

export function TopMetaStrip({ initial = "T" }: { initial?: string }) {
  return (
    <div
      style={{
        padding: "20px 56px 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div className="hb-eyebrow">{format(new Date(), "EEEE · MMM d, yyyy")}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--hb-mute)" }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 13,
            padding: "6px 12px", background: "var(--hb-paper)",
            border: "1px solid var(--hb-line)", borderRadius: 999,
          }}
        >
          <Bell className="w-[15px] h-[15px]" /> Quiet hours: 9pm — 7am
        </div>
        <div
          style={{
            width: 32, height: 32, borderRadius: "50%", background: "var(--hb-terracotta)",
            color: "var(--hb-cream)", display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "var(--hb-display)", fontStyle: "italic",
            fontWeight: 500, fontSize: 14,
          }}
        >
          {initial}
        </div>
      </div>
    </div>
  );
}
