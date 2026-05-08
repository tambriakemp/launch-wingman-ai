interface Props {
  eyebrow?: string;
  body: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  variant?: "light" | "dark";
}

export function AINudgeCard({
  eyebrow = "Pattern noticed",
  body,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  variant = "light",
}: Props) {
  const dark = variant === "dark";
  return (
    <div
      style={{
        background: dark ? "var(--hb-ink)" : "var(--hb-terracotta-bg)",
        border: dark ? "none" : "1px solid var(--hb-terracotta-border)",
        borderRadius: 14,
        padding: 18,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "var(--hb-terracotta)",
          color: "var(--hb-cream)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--hb-display)", fontStyle: "italic",
          fontWeight: 500, fontSize: 16, flexShrink: 0,
        }}
      >
        L
      </div>
      <div style={{ flex: 1 }}>
        <div className="hb-eyebrow" style={{ color: dark ? "var(--hb-terracotta-glow)" : "#933A24", marginBottom: 6 }}>
          {eyebrow}
        </div>
        <div
          className="hb-italic"
          style={{
            fontSize: 16,
            color: dark ? "var(--hb-cream)" : "var(--hb-terracotta-deep)",
            lineHeight: 1.4,
          }}
        >
          {body}
        </div>
        {(primaryLabel || secondaryLabel) && (
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {primaryLabel && (
              <button
                onClick={onPrimary}
                style={{
                  fontSize: 13, fontWeight: 500, color: "var(--hb-cream)",
                  background: "var(--hb-ink)", padding: "8px 16px",
                  borderRadius: 999, border: "none", cursor: "pointer",
                }}
              >
                {primaryLabel}
              </button>
            )}
            {secondaryLabel && (
              <button
                onClick={onSecondary}
                style={{
                  fontSize: 13, fontWeight: 500, color: dark ? "var(--hb-cream-deep)" : "var(--hb-terracotta-deep)",
                  background: "transparent", padding: "8px 12px", border: "none", cursor: "pointer",
                }}
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
