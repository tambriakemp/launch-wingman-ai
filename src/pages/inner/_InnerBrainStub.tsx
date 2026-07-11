import { useNavigate } from "react-router-dom";

/**
 * Placeholder shell used by every Inner Brain route until each
 * screen's design ships from Claude Design and gets implemented
 * through the `cre8-design-import` skill.
 *
 * Uses the Cre8 Brain palette + Georgia/Arial fonts. Bree can click
 * the nav around and land on branded "coming soon" pages instead of
 * a 404. Do NOT expand these into styled MVPs — the skill's Rule 1
 * requires design-first, and stubs give Bree room to design without
 * feeling behind.
 */

const C = {
  ink: "#1B1915",
  warm: "#F9F6F1",
  bronze: "#B5985A",
  goldD: "#C8A86A",
  taupe: "#A39E97",
  cream: "#F4EFE9",
  sub: "#6E6456",
};

const SERIF = `Georgia, "Times New Roman", serif`;
const SANS = `Arial, Helvetica, sans-serif`;
const MONO = `"DM Mono", ui-monospace, "SF Mono", Menlo, monospace`;

const BrainMark = ({ size = 22, color = C.bronze }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block" }}>
    <circle cx="7" cy="8" r="2.4" stroke={color} strokeWidth="1.5" />
    <circle cx="16.5" cy="6.5" r="2.1" stroke={color} strokeWidth="1.5" />
    <circle cx="15" cy="16" r="2.4" stroke={color} strokeWidth="1.5" />
    <circle cx="6" cy="16.5" r="1.7" stroke={color} strokeWidth="1.5" />
    <path d="M9.2 8.8 14.4 6.9M9 9.6 13 14.6M8.6 14.9 12.7 16M6.2 14.8 6.8 10.3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

interface Props {
  /** Big serif title shown centred — the eventual page name. */
  title: string;
  /** Short subtitle under the title. */
  subtitle?: string;
  /** Design file this stub is waiting on (project-relative path). */
  waitingOn: string;
}

export const InnerBrainStub = ({ title, subtitle, waitingOn }: Props) => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "40px 24px calc(40px + env(safe-area-inset-bottom))",
        background: C.ink,
        color: C.warm,
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <BrainMark size={20} color={C.goldD} />
        <span
          style={{
            fontFamily: SERIF,
            fontSize: 15,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.warm,
          }}
        >
          Cre8 Brain · Inner
        </span>
      </div>

      <span style={{ width: 26, height: 1, background: C.goldD, opacity: 0.7 }} />

      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: "clamp(36px, 6vw, 56px)",
          margin: 0,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: C.warm,
          maxWidth: 640,
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 17,
            color: "rgba(237,229,214,0.7)",
            margin: 0,
            maxWidth: 480,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      )}

      <p
        style={{
          fontFamily: SANS,
          fontSize: 13,
          color: C.taupe,
          margin: 0,
          maxWidth: 440,
          lineHeight: 1.55,
        }}
      >
        Designing this screen in Claude Design. The <code style={{ fontFamily: MONO, fontSize: 12 }}>cre8-design-import</code> skill will pick it up automatically once it's ready.
      </p>

      <p
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: "rgba(163,158,151,0.7)",
          margin: 0,
          letterSpacing: "0.06em",
        }}
      >
        waiting on <span style={{ color: C.goldD }}>{waitingOn}</span>
      </p>

      <button
        onClick={() => navigate("/dashboard")}
        style={{
          marginTop: 12,
          background: "transparent",
          color: C.warm,
          border: "1px solid rgba(200,168,106,0.4)",
          borderRadius: 999,
          padding: "10px 22px",
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.02em",
          cursor: "pointer",
        }}
      >
        Back to Cre8 Brain
      </button>
    </div>
  );
};

export default InnerBrainStub;
