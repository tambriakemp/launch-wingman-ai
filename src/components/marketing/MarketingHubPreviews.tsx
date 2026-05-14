// Decorative preview components for the Marketing hub tiles. Each one is
// a small illustration that hints at the tool's contents. They're meant to
// be glanceable, not data-bearing (yet) — the eventual upgrade is to wire
// them to real state so a tile shows actual campaign counts, the user's
// scheduled posts this week, etc.

import { SERIF } from "./marketingHubTokens";

export const PreviewCampaigns = () => (
  // 3 concentric progress rings.
  <svg width="78" height="78" viewBox="0 0 78 78">
    {[
      { r: 30, dash: 0.72 },
      { r: 22, dash: 0.45 },
      { r: 14, dash: 0.88 },
    ].map((c, i) => (
      <g key={i} transform="translate(39 39)">
        <circle r={c.r} fill="none" stroke="rgba(31,27,23,0.10)" strokeWidth="3" />
        <circle
          r={c.r}
          fill="none"
          stroke="#C65A3E"
          strokeWidth="3"
          strokeDasharray={`${c.dash * 2 * Math.PI * c.r} ${2 * Math.PI * c.r}`}
          strokeLinecap="round"
          transform="rotate(-90)"
        />
      </g>
    ))}
  </svg>
);

export const PreviewAnalytics = () => (
  // Sparkline with gradient fill + ending pulse dot.
  <svg width="92" height="56" viewBox="0 0 92 56">
    <defs>
      <linearGradient id="mh-sl" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#C65A3E" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#C65A3E" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M2 42 L14 32 L26 38 L38 24 L50 28 L62 14 L74 18 L88 6 L88 56 L2 56 Z"
      fill="url(#mh-sl)"
    />
    <path
      d="M2 42 L14 32 L26 38 L38 24 L50 28 L62 14 L74 18 L88 6"
      fill="none"
      stroke="#C65A3E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="88" cy="6" r="3" fill="#C65A3E" />
    <circle cx="88" cy="6" r="6" fill="#C65A3E" fillOpacity="0.2" />
  </svg>
);

export const PreviewUTM = () => (
  // Stacked UTM-param chips, mono.
  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
    {[
      { l: "utm_source=ig", w: 78 },
      { l: "utm_medium=story", w: 92 },
      { l: "utm_campaign=may", w: 70 },
    ].map((c, i) => (
      <div
        key={i}
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          color: "#933A24",
          background: "#FAEDE7",
          padding: "3px 7px",
          borderRadius: 4,
          width: c.w,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {c.l}
      </div>
    ))}
  </div>
);

export const PreviewAvatar = () => (
  // Stylized portrait silhouette with sparkle.
  <svg width="64" height="64" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="30" fill="#1F1B17" />
    <circle cx="32" cy="24" r="9" fill="#C9AE8F" />
    <path d="M14 56 C14 42 22 36 32 36 C42 36 50 42 50 56 Z" fill="#C9AE8F" />
    <g transform="translate(48 14)">
      <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="#C65A3E" />
    </g>
  </svg>
);

export const PreviewSalesPage = () => (
  // Editorial page mockup.
  <div
    style={{
      width: 76,
      height: 60,
      background: "#fff",
      borderRadius: 6,
      border: "1px solid #E8D9C6",
      padding: "7px 8px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      boxShadow: "0 2px 6px rgba(31,27,23,0.06)",
    }}
  >
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 8,
        color: "#1F1B17",
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      Make something quiet.
    </div>
    <div style={{ height: 2, background: "#E8D9C6", width: "90%", borderRadius: 1 }} />
    <div style={{ height: 2, background: "#E8D9C6", width: "70%", borderRadius: 1 }} />
    <div style={{ height: 2, background: "#E8D9C6", width: "85%", borderRadius: 1 }} />
    <div
      style={{
        marginTop: "auto",
        alignSelf: "flex-start",
        width: 28,
        height: 8,
        background: "#C65A3E",
        borderRadius: 999,
      }}
    />
  </div>
);

export const PreviewEmail = () => (
  // Layered envelopes.
  <div style={{ position: "relative", width: 78, height: 60 }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          top: i * 6,
          left: i * 5,
          width: 62,
          height: 42,
          borderRadius: 5,
          background: "#fff",
          border: "1px solid #E8D9C6",
          boxShadow: "0 2px 4px rgba(31,27,23,0.06)",
        }}
      >
        <div
          style={{
            height: 2,
            width: "70%",
            background: "#C65A3E",
            margin: "8px 0 4px 8px",
            borderRadius: 1,
          }}
        />
        <div
          style={{
            height: 1.5,
            width: "55%",
            background: "#E8D9C6",
            margin: "0 0 3px 8px",
            borderRadius: 1,
          }}
        />
        <div
          style={{
            height: 1.5,
            width: "40%",
            background: "#E8D9C6",
            margin: "0 0 0 8px",
            borderRadius: 1,
          }}
        />
      </div>
    ))}
  </div>
);

export const PreviewSocial = () => (
  // Mini 2-week calendar grid with scheduled dots.
  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, width: 96 }}>
    {Array.from({ length: 14 }, (_, i) => {
      const today = i === 3;
      const has = [1, 3, 5, 8, 10, 12].includes(i);
      return (
        <div
          key={i}
          style={{
            aspectRatio: "1",
            borderRadius: 3,
            background: today ? "#1F1B17" : has ? "#FAEDE7" : "#F2E9DC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {has && (
            <div
              style={{
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "#C65A3E",
              }}
            />
          )}
        </div>
      );
    })}
  </div>
);

export const PreviewCarousel = () => (
  // Three stacked slides with a focused front card.
  <div style={{ position: "relative", width: 72, height: 60 }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          top: 8,
          left: 8 + i * 10,
          width: 40,
          height: 50,
          borderRadius: 6,
          background: i === 2 ? "#1F1B17" : "#fff",
          border: "1px solid #E8D9C6",
          boxShadow: "0 2px 6px rgba(31,27,23,0.08)",
        }}
      >
        {i === 2 && (
          <>
            <div
              style={{
                height: 2,
                width: "60%",
                background: "#C65A3E",
                margin: "8px auto 4px",
                borderRadius: 1,
              }}
            />
            <div
              style={{
                height: 1.5,
                width: "70%",
                background: "#C9AE8F",
                margin: "0 auto 3px",
                borderRadius: 1,
              }}
            />
            <div
              style={{
                height: 1.5,
                width: "50%",
                background: "#C9AE8F",
                margin: "0 auto",
                borderRadius: 1,
              }}
            />
          </>
        )}
      </div>
    ))}
    <div
      style={{
        position: "absolute",
        bottom: 2,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 3,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: i === 1 ? "#1F1B17" : "#C9AE8F",
          }}
        />
      ))}
    </div>
  </div>
);

export const PreviewContentVault = () => (
  // Stacked-folders / saved-templates feel.
  <svg width="72" height="60" viewBox="0 0 72 60">
    <rect x="4" y="14" width="56" height="42" rx="4" fill="#C9AE8F" />
    <rect x="8" y="10" width="56" height="42" rx="4" fill="#E8D9C6" />
    <rect x="12" y="6" width="56" height="42" rx="4" fill="#fff" stroke="#E8D9C6" strokeWidth="1" />
    <rect x="18" y="14" width="32" height="2.5" rx="1" fill="#C65A3E" />
    <rect x="18" y="22" width="40" height="2" rx="1" fill="#E8D9C6" />
    <rect x="18" y="28" width="36" height="2" rx="1" fill="#E8D9C6" />
    <rect x="18" y="34" width="22" height="2" rx="1" fill="#E8D9C6" />
  </svg>
);

export const PreviewHook = () => (
  // Dark pull-quote card.
  <div
    style={{
      background: "#1F1B17",
      color: "#FBF7F1",
      width: 88,
      height: 60,
      borderRadius: 8,
      padding: "8px 10px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}
  >
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: 11,
        lineHeight: 1.2,
        color: "#FBF7F1",
      }}
    >
      "What if you launched <span style={{ color: "#E08F72" }}>quietly</span>?"
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#C65A3E" }} />
      <div
        style={{
          fontSize: 7,
          color: "#C9AE8F",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        Hook #14
      </div>
    </div>
  </div>
);
