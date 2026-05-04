// Shared visual primitives for assessment surfaces (desktop + native).

import { ReactNode } from "react";
import { Check } from "lucide-react";
import {
  A_HAIR,
  A_INK,
  A_INK_40,
  A_INK_60,
  A_MOSS,
  A_PAPER,
  A_PAPER2,
  A_TERRA,
  FONT_DISPLAY,
  FONT_MONO,
} from "./tokens";

// ─── PageHeader (desktop) ──────────────────────────────────────────────
export const PageHeader = ({
  eyebrow,
  title,
  italicWord,
  lede,
}: {
  eyebrow?: string;
  title: ReactNode;
  italicWord?: string;
  lede?: string;
}) => (
  <header
    style={{
      paddingBottom: 28,
      borderBottom: `1px solid ${A_HAIR}`,
      marginBottom: 28,
    }}
  >
    {eyebrow && (
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: A_TERRA,
          fontWeight: 600,
        }}
      >
        {eyebrow}
      </div>
    )}
    <h1
      style={{
        fontFamily: FONT_DISPLAY,
        fontWeight: 400,
        fontSize: 44,
        letterSpacing: "-0.02em",
        color: A_INK,
        margin: "6px 0 10px",
        lineHeight: 1.05,
      }}
    >
      {italicWord ? (
        <>
          {String(title).split(italicWord)[0]}
          <em style={{ color: A_TERRA, fontStyle: "italic", fontWeight: 400 }}>{italicWord}</em>
          {String(title).split(italicWord)[1]}
        </>
      ) : (
        title
      )}
    </h1>
    {lede && (
      <p
        style={{
          fontFamily: FONT_DISPLAY,
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 19,
          lineHeight: 1.5,
          color: A_INK_60,
          letterSpacing: "-0.005em",
          margin: 0,
          maxWidth: 680,
        }}
      >
        {lede}
      </p>
    )}
  </header>
);

// ─── LargeMobileTitle ──────────────────────────────────────────────────
export const LargeMobileTitle = ({
  eyebrow,
  title,
  italicWord,
  lede,
}: {
  eyebrow?: string;
  title: string;
  italicWord?: string;
  lede?: string;
}) => {
  const parts = italicWord ? title.split(italicWord) : [title];
  return (
    <div style={{ padding: "4px 22px 16px" }}>
      {eyebrow && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: A_TERRA,
          }}
        >
          {eyebrow}
        </div>
      )}
      <h1
        style={{
          margin: "6px 0 8px",
          fontFamily: FONT_DISPLAY,
          fontWeight: 400,
          fontSize: 36,
          lineHeight: 1.05,
          letterSpacing: -1,
          color: A_INK,
        }}
      >
        {parts[0]}
        {italicWord && (
          <em style={{ color: A_TERRA, fontStyle: "italic", fontWeight: 400 }}>{italicWord}</em>
        )}
        {parts[1]}
      </h1>
      {lede && (
        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.5,
            color: A_INK_60,
            margin: "8px 0 0",
            letterSpacing: -0.2,
          }}
        >
          {lede}
        </p>
      )}
    </div>
  );
};

// ─── PrimaryButton ─────────────────────────────────────────────────────
export const PrimaryButton = ({
  children,
  onClick,
  disabled,
  fullWidth,
  variant = "ink",
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: "ink" | "ghost" | "terra";
  size?: "sm" | "md" | "lg";
}) => {
  const palette =
    variant === "terra"
      ? { bg: A_TERRA, fg: A_PAPER }
      : variant === "ghost"
      ? { bg: "transparent", fg: A_INK, border: `1px solid ${A_HAIR}` }
      : { bg: A_INK, fg: A_PAPER };
  const sizing =
    size === "lg" ? { py: 15, fz: 16 } : size === "sm" ? { py: 9, fz: 13 } : { py: 12, fz: 14.5 };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: palette.bg,
        color: palette.fg,
        border: (palette as any).border ?? 0,
        borderRadius: 999,
        padding: `${sizing.py}px 22px`,
        fontWeight: 600,
        fontSize: sizing.fz,
        letterSpacing: -0.2,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        width: fullWidth ? "100%" : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: variant === "ink" ? "0 6px 16px -8px rgba(31,27,23,0.4)" : undefined,
        transition: "all 160ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {children}
    </button>
  );
};

// ─── ProgressStrip ─────────────────────────────────────────────────────
export const ProgressStrip = ({
  step,
  total,
  section,
}: {
  step: number;
  total: number;
  section?: string;
}) => {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <div style={{ marginBottom: 36 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
          fontSize: 12,
          color: A_INK_60,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: FONT_MONO,
              letterSpacing: "0.04em",
              color: A_INK,
              fontWeight: 500,
            }}
          >
            Step {step + 1} of {total}
          </span>
          {section && (
            <>
              <span>·</span>
              <span
                style={{
                  fontStyle: "italic",
                  fontFamily: FONT_DISPLAY,
                  color: A_INK_60,
                  fontSize: 14,
                }}
              >
                {section}
              </span>
            </>
          )}
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11 }}>{pct}% complete</span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 999,
          background: A_PAPER2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: A_TERRA,
            transition: "width 240ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
    </div>
  );
};

// ─── OptionButton (single-select) ──────────────────────────────────────
export const OptionButton = ({
  letter,
  text,
  selected,
  onClick,
  variant = "desktop",
}: {
  letter: string;
  text: string;
  selected: boolean;
  onClick: () => void;
  variant?: "desktop" | "mobile";
}) => {
  const radius = variant === "mobile" ? 18 : 12;
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? A_INK : "#fff",
        color: selected ? A_PAPER : A_INK,
        border: variant === "mobile" ? 0 : selected ? `1px solid ${A_INK}` : `1px solid ${A_HAIR}`,
        borderRadius: radius,
        padding: variant === "mobile" ? "14px 16px" : "16px 18px",
        cursor: "pointer",
        textAlign: "left" as const,
        width: "100%",
        fontSize: 14.5,
        lineHeight: 1.4,
        display: "grid",
        gridTemplateColumns: "32px 1fr 22px",
        gap: 12,
        alignItems: "center",
        boxShadow: selected
          ? "0 6px 20px -8px rgba(31,27,23,0.4)"
          : "0 1px 2px rgba(31,27,23,0.04)",
        transition: "all 160ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: selected ? A_TERRA : A_PAPER2,
          color: selected ? "#fff" : A_INK,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_MONO,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {letter}
      </span>
      <span style={{ letterSpacing: -0.15 }}>{text}</span>
      <span style={{ opacity: selected ? 1 : 0, transition: "opacity 160ms" }}>
        <Check size={16} strokeWidth={3} color={selected ? A_TERRA : A_INK_60} />
      </span>
    </button>
  );
};

// ─── ClayHero (intro hero card) ────────────────────────────────────────
export const ClayHero = ({
  eyebrow,
  title,
  lede,
  pills,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  pills?: { icon?: ReactNode; text: string }[];
}) => (
  <section
    style={{
      background:
        "linear-gradient(155deg, #EFE4D3 0%, #E8D9C6 60%, #DFCCB1 100%)",
      borderRadius: 24,
      padding: "28px 30px",
      position: "relative",
      overflow: "hidden",
      marginBottom: 18,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: -50,
        right: -50,
        width: 220,
        height: 220,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(198,90,62,0.22), transparent 70%)",
        pointerEvents: "none",
      }}
    />
    {eyebrow && (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "4px 10px",
          background: "rgba(31,27,23,0.08)",
          borderRadius: 999,
          position: "relative",
        }}
      >
        <span
          style={{ width: 6, height: 6, borderRadius: 999, background: A_TERRA }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: A_INK,
          }}
        >
          {eyebrow}
        </span>
      </div>
    )}
    <h2
      style={{
        margin: "14px 0 8px",
        fontFamily: FONT_DISPLAY,
        fontWeight: 500,
        fontSize: 28,
        letterSpacing: -0.7,
        lineHeight: 1.1,
        color: A_INK,
        position: "relative",
      }}
    >
      {title}
    </h2>
    {lede && (
      <p
        style={{
          fontSize: 14.5,
          lineHeight: 1.45,
          color: "rgba(31,27,23,0.78)",
          margin: 0,
          letterSpacing: -0.2,
          position: "relative",
        }}
      >
        {lede}
      </p>
    )}
    {pills && pills.length > 0 && (
      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          position: "relative",
        }}
      >
        {pills.map((p, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 11px",
              background: "rgba(255,255,255,0.6)",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              color: A_INK,
              letterSpacing: -0.1,
            }}
          >
            {p.icon}
            {p.text}
          </span>
        ))}
      </div>
    )}
  </section>
);

// ─── Inset card list (sections) ────────────────────────────────────────
export const InsetSectionsList = ({
  items,
  trailing,
}: {
  items: { n: number; title: string }[];
  trailing?: (item: { n: number; title: string }) => ReactNode;
}) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "0 1px 2px rgba(31,27,23,0.04)",
    }}
  >
    {items.map((s, i) => (
      <div
        key={s.n}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 16px",
          borderTop: i === 0 ? 0 : `0.5px solid ${A_HAIR}`,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: A_PAPER2,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontFamily: FONT_MONO,
            fontSize: 12,
            fontWeight: 600,
            color: A_INK,
          }}
        >
          {s.n}
        </div>
        <div
          style={{
            flex: 1,
            fontFamily: FONT_DISPLAY,
            fontWeight: 500,
            fontSize: 15.5,
            letterSpacing: -0.2,
            color: A_INK,
          }}
        >
          {s.title}
        </div>
        {trailing && trailing(s)}
      </div>
    ))}
  </div>
);

// ─── Status chips ──────────────────────────────────────────────────────
export const StatusChip = ({
  status,
}: {
  status: "ready" | "in-progress" | "completed";
}) => {
  if (status === "completed")
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "3px 10px",
          borderRadius: 999,
          background: "rgba(220,229,220,0.7)",
          fontSize: 11,
          color: A_MOSS,
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        <Check size={11} strokeWidth={2.5} /> Completed
      </span>
    );
  if (status === "in-progress")
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "3px 10px",
          borderRadius: 999,
          background: "rgba(243,212,199,0.55)",
          fontSize: 11,
          color: "#8F3F2A",
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: A_TERRA,
          }}
        />
        In progress
      </span>
    );
  return null;
};

export const Eyebrow = ({ children, color }: { children: ReactNode; color?: string }) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: color ?? A_INK_60,
    }}
  >
    {children}
  </div>
);

export { A_PAPER, A_INK, A_TERRA, A_MOSS };
