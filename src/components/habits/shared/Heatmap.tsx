import type { HeatmapCell } from "@/lib/habits/heatmap";
import { HEAT_LEVELS } from "@/lib/habits/heatmap";

interface Props {
  cols: HeatmapCell[][];
  cellSize?: number;
  gap?: number;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function Heatmap({ cols, cellSize = 14, gap = 4 }: Props) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: 1 }}>
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            style={{
              fontSize: 10,
              color: "var(--hb-cream-deep)",
              height: cellSize,
              visibility: i % 2 === 0 ? "visible" : "hidden",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap }}>
        {cols.map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", gap }}>
            {col.map((cell, ri) => (
              <div
                key={ri}
                title={cell.date}
                className={HEAT_LEVELS[cell.level]}
                style={{ aspectRatio: "1", borderRadius: 3 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatLegend() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--hb-mute-soft)" }}>
      <span>Less</span>
      {HEAT_LEVELS.map((cls, i) => (
        <div key={i} className={cls} style={{ width: 12, height: 12, borderRadius: 2 }} />
      ))}
      <span>More</span>
    </div>
  );
}
