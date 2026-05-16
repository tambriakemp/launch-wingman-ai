import { Plus } from "lucide-react";
import { TABS } from "./tabs";

interface Props {
  active: typeof TABS[number];
  onChange: (t: typeof TABS[number]) => void;
  /** Open the editorial Add Habit slide-out panel. */
  onAddHabit?: () => void;
}

export function DesktopTabs({ active, onChange, onAddHabit }: Props) {
  return (
    <div
      style={{
        padding: "20px 56px 0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--hb-line)",
      }}
    >
      <div style={{ display: "flex", gap: 4 }}>
        {TABS.map((t) => {
          const isActive = t === active;
          return (
            <button
              key={t}
              onClick={() => onChange(t)}
              style={{
                padding: "12px 18px",
                fontFamily: isActive ? "var(--hb-display)" : "var(--hb-body)",
                fontSize: isActive ? 18 : 14,
                fontStyle: isActive ? "italic" : "normal",
                fontWeight: 500,
                color: isActive ? "var(--hb-ink)" : "var(--hb-mute)",
                borderBottom: isActive ? "2px solid var(--hb-terracotta)" : "2px solid transparent",
                marginBottom: -1,
                background: "transparent",
                cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
                whiteSpace: "nowrap",
                letterSpacing: isActive ? "-0.01em" : 0,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Add habit pill — opens the editorial slide-out panel (no more "Add habit" tab). */}
      {onAddHabit && (
        <button
          onClick={onAddHabit}
          style={{
            marginBottom: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 999,
            background: "var(--hb-ink)",
            color: "var(--hb-cream)",
            border: 0,
            fontFamily: "var(--hb-body)",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(31,27,23,0.10)",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add habit
        </button>
      )}
    </div>
  );
}
