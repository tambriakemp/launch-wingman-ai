// Decorative preview components for the Planner hub tiles. Sister to
// MarketingHubPreviews — same vocabulary, planner-specific imagery.

import { SERIF } from "@/components/marketing/marketingHubTokens";

interface DayWithEvents {
  letter: string;
  num: number;
  isToday: boolean;
  eventCount: number;
}

// Calendar week strip. When `days` is passed, renders the real current week
// with the actual event-count dots; falls back to a static preview otherwise.
export const PreviewCalendar = ({ days }: { days?: DayWithEvents[] }) => {
  const fallback: DayWithEvents[] = [
    { letter: "M", num: 11, isToday: false, eventCount: 0 },
    { letter: "T", num: 12, isToday: false, eventCount: 0 },
    { letter: "W", num: 13, isToday: false, eventCount: 1 },
    { letter: "T", num: 14, isToday: true, eventCount: 2 },
    { letter: "F", num: 15, isToday: false, eventCount: 0 },
    { letter: "S", num: 16, isToday: false, eventCount: 1 },
    { letter: "S", num: 17, isToday: false, eventCount: 0 },
  ];
  const data = days ?? fallback;

  return (
    <div style={{ display: "flex", gap: 4, width: "100%", justifyContent: "space-between" }}>
      {data.map((day, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            padding: "6px 0",
            borderRadius: 8,
            background: day.isToday ? "#1F1B17" : "transparent",
            color: day.isToday ? "#FBF7F1" : "#1F1B17",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: day.isToday ? "#C9AE8F" : "#8F857B",
            }}
          >
            {day.letter}
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 500, marginTop: 2 }}>
            {day.num}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              marginTop: 3,
              height: 3,
            }}
          >
            {Array.from({ length: Math.min(day.eventCount, 3) }, (_, j) => (
              <div
                key={j}
                style={{ width: 3, height: 3, borderRadius: "50%", background: "#C65A3E" }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Paper-journal mockup with date corner ribbon.
export const PreviewDailyPage = ({ dateLabel = "May 14" }: { dateLabel?: string }) => (
  <div
    style={{
      width: 96,
      height: 64,
      background: "#FFFDF8",
      borderRadius: 6,
      border: "1px solid #E8D9C6",
      padding: "8px 10px",
      boxShadow: "0 2px 6px rgba(31,27,23,0.06)",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      position: "relative",
    }}
  >
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 9,
        color: "#C65A3E",
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      {dateLabel}
    </div>
    <div style={{ height: 1.5, background: "#E8D9C6", width: "85%", borderRadius: 1 }} />
    <div style={{ height: 1.5, background: "#E8D9C6", width: "70%", borderRadius: 1 }} />
    <div style={{ height: 1.5, background: "#E8D9C6", width: "60%", borderRadius: 1 }} />
    <div style={{ height: 1.5, background: "#E8D9C6", width: "78%", borderRadius: 1 }} />
    <div
      style={{
        position: "absolute",
        top: -2,
        right: 8,
        width: 6,
        height: 16,
        background: "#C65A3E",
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)",
      }}
    />
  </div>
);

// Three concentric habit rings with center count.
export const PreviewHabits = ({ done = 0, total = 6 }: { done?: number; total?: number }) => {
  const pct = total > 0 ? done / total : 0;
  return (
    <svg width="74" height="74" viewBox="0 0 74 74">
      {[
        { r: 28, dash: pct, c: "#C65A3E" },
        { r: 20, dash: pct, c: "#4F6B52" },
        { r: 12, dash: pct, c: "#6B3A5C" },
      ].map((c, i) => (
        <g key={i} transform="translate(37 37)">
          <circle r={c.r} fill="none" stroke="rgba(31,27,23,0.10)" strokeWidth="4" />
          <circle
            r={c.r}
            fill="none"
            stroke={c.c}
            strokeWidth="4"
            strokeDasharray={`${c.dash * 2 * Math.PI * c.r} ${2 * Math.PI * c.r}`}
            strokeLinecap="round"
            transform="rotate(-90)"
          />
        </g>
      ))}
      <text
        x="37"
        y="42"
        textAnchor="middle"
        fontFamily="'Fraunces', serif"
        fontSize="14"
        fontWeight="500"
        fill="#1F1B17"
      >
        {done}/{total}
      </text>
    </svg>
  );
};

// Bullseye + scattered goal markers.
export const PreviewGoals = () => (
  <svg width="76" height="76" viewBox="0 0 76 76">
    <circle cx="38" cy="38" r="32" fill="#FAEDE7" />
    <circle cx="38" cy="38" r="22" fill="#F3D4C7" />
    <circle cx="38" cy="38" r="12" fill="#E08F72" />
    <circle cx="38" cy="38" r="4" fill="#1F1B17" />
    <circle cx="20" cy="22" r="3" fill="#C65A3E" />
    <circle cx="58" cy="48" r="3" fill="#4F6B52" />
    <circle cx="50" cy="18" r="3" fill="#6B3A5C" />
  </svg>
);

// Small bar chart with today highlighted.
export const PreviewReview = () => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
    {[40, 55, 30, 70, 48, 80, 62].map((h, i) => {
      const isToday = i === 6;
      return (
        <div
          key={i}
          style={{
            width: 8,
            height: `${h}%`,
            borderRadius: 2,
            background: isToday ? "#C65A3E" : i === 5 ? "#E08F72" : "#C9AE8F",
          }}
        />
      );
    })}
  </div>
);
