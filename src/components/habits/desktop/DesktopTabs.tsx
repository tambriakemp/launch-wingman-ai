import { TABS } from "./tabs";

interface Props {
  active: typeof TABS[number];
  onChange: (t: typeof TABS[number]) => void;
}

export function DesktopTabs({ active, onChange }: Props) {
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
    </div>
  );
}
