import { Link } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useHaptics } from "@/hooks/useHaptics";
import {
  PreviewCampaigns,
  PreviewAnalytics,
  PreviewUTM,
  PreviewAvatar,
  PreviewSalesPage,
  PreviewEmail,
  PreviewSocial,
  PreviewCarousel,
  PreviewContentVault,
  PreviewHook,
} from "@/components/marketing/MarketingHubPreviews";
import { SF, SERIF, COLORS, TILE_BG } from "@/components/marketing/marketingHubTokens";

interface Tool {
  name: string;
  status: string;
  href: string;
  Preview: () => JSX.Element;
  bg: string;
  // 'flex-start' tilts the preview canvas left-aligned with padding (used for
  // wider previews like UTM chips); default 'center' centers it.
  previewAlign?: "center" | "flex-start";
  fullWidth?: boolean;
}

interface ToolGroup {
  eyebrow: string;
  hint: string;
  tools: Tool[];
}

const GROUPS: ToolGroup[] = [
  {
    eyebrow: "Grow",
    hint: "What's working",
    tools: [
      {
        name: "Campaigns",
        status: "3 active · 1 launching today",
        href: "/marketing-hub/campaigns",
        Preview: PreviewCampaigns,
        bg: TILE_BG.cream,
      },
      {
        name: "Analytics",
        status: "Up 18% week-over-week",
        href: "/marketing-hub/analytics",
        Preview: PreviewAnalytics,
        bg: TILE_BG.blush,
      },
      {
        name: "UTM Builder",
        status: "14 links tracked this month",
        href: "/marketing-hub/utm-builder",
        Preview: PreviewUTM,
        bg: TILE_BG.oat,
        previewAlign: "flex-start",
        fullWidth: true,
      },
    ],
  },
  {
    eyebrow: "Create",
    hint: "Drafts in your voice",
    tools: [
      {
        name: "AI Avatar Studio",
        status: "New: voice cloning",
        href: "/app/ai-studio",
        Preview: PreviewAvatar,
        bg: TILE_BG.ink,
      },
      {
        name: "Sales Page Writer",
        status: "Draft saved 2h ago",
        href: "/app/ai-studio/sales-page",
        Preview: PreviewSalesPage,
        bg: TILE_BG.blush,
      },
      {
        name: "Email Sequence",
        status: "5-part welcome ready",
        href: "/app/ai-studio/email-sequence",
        Preview: PreviewEmail,
        bg: TILE_BG.cream,
      },
      {
        name: "Hook Generator",
        status: "14 fresh angles",
        href: "/app/ai-studio/hooks",
        Preview: PreviewHook,
        bg: TILE_BG.oat,
      },
    ],
  },
  {
    eyebrow: "Distribute",
    hint: "Out into the world",
    tools: [
      {
        name: "Social Planner",
        status: "6 posts queued this week",
        href: "/social-planner",
        Preview: PreviewSocial,
        bg: TILE_BG.oat,
      },
      {
        name: "Carousel Builder",
        status: "2 drafts · 1 scheduled",
        href: "/carousel-builder",
        Preview: PreviewCarousel,
        bg: TILE_BG.blush,
      },
      {
        name: "Content Vault",
        status: "48 templates · 12 swipes saved",
        href: "/content-vault",
        Preview: PreviewContentVault,
        bg: TILE_BG.cream,
        previewAlign: "flex-start",
        fullWidth: true,
      },
    ],
  },
];

const MarketingHub = () => {
  return (
    <ProjectLayout>
      <div className="max-w-2xl mx-auto pb-12">
        {/* Title block */}
        <header style={{ padding: "4px 22px 18px" }}>
          <div className="eyebrow">Marketing</div>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: 32,
              color: COLORS.ink,
              letterSpacing: -0.6,
              lineHeight: 1.05,
              marginTop: 8,
            }}
          >
            Your marketing{" "}
            <em style={{ color: COLORS.terracotta, fontWeight: 400 }}>suite.</em>
          </h1>
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 15,
              color: COLORS.inkMid,
              marginTop: 8,
              lineHeight: 1.4,
              maxWidth: 320,
            }}
          >
            Campaigns, content, AI tools — pick where to put your attention today.
          </p>
        </header>

        {/* Hero: pick up where you left off */}
        <HeroCard />

        {/* Grouped graphical tiles */}
        {GROUPS.map((g) => (
          <ToolGroupSection key={g.eyebrow} group={g} />
        ))}

        {/* Editorial closer */}
        <Closer />
      </div>
    </ProjectLayout>
  );
};

// ─────────────────────────────────────────────────────────────
// HERO — featured campaign / continue card. Currently uses placeholder
// content; wiring real "most-recent-active-campaign" data is a follow-up
// once the campaigns query exposes it.
// ─────────────────────────────────────────────────────────────
const HeroCard = () => (
  <div
    style={{
      margin: "0 16px 24px",
      borderRadius: 22,
      overflow: "hidden",
      background: COLORS.ink,
      color: COLORS.paper,
      position: "relative",
      boxShadow: "0 14px 32px -16px rgba(31,27,23,0.4)",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: -40,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(198,90,62,0.35), transparent 70%)",
        pointerEvents: "none",
      }}
    />
    <div style={{ position: "relative", padding: "18px 18px 16px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.terracotta }} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: COLORS.terracottaSoft,
          }}
        >
          Pick up where you left off
        </span>
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: 26,
          letterSpacing: -0.6,
          lineHeight: 1.15,
          marginTop: 10,
        }}
      >
        Your <em style={{ color: COLORS.terracottaSoft }}>May launch</em>
        <br />
        campaign — 3 of 8 sent.
      </div>

      <div
        style={{
          display: "flex",
          gap: 0,
          marginTop: 16,
          background: "rgba(251,247,241,0.06)",
          borderRadius: 12,
          padding: "10px 14px",
          border: "1px solid rgba(251,247,241,0.08)",
        }}
      >
        {[
          { v: "37%", l: "Open rate" },
          { v: "12.4k", l: "Reached" },
          { v: "+186", l: "New signups" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              paddingLeft: i ? 12 : 0,
              borderLeft: i ? "1px solid rgba(251,247,241,0.12)" : "none",
            }}
          >
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 18,
                fontWeight: 500,
                color: COLORS.paper,
                letterSpacing: -0.3,
              }}
            >
              {s.v}
            </div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: COLORS.tan,
                marginTop: 2,
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <Link
          to="/marketing-hub/campaigns"
          style={{
            padding: "9px 14px",
            background: COLORS.terracotta,
            color: COLORS.paper,
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            fontFamily: SF,
          }}
        >
          Continue
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
        <Link
          to="/marketing-hub/campaigns"
          style={{
            padding: "9px 14px",
            color: COLORS.tan,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
            fontFamily: SF,
          }}
        >
          See campaign
        </Link>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// SECTION HEADER — terracotta eyebrow + italic hint
// ─────────────────────────────────────────────────────────────
const SectionHeader = ({ label, hint }: { label: string; hint: string }) => (
  <div
    style={{
      padding: "0 22px",
      marginBottom: 10,
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
    }}
  >
    <div className="eyebrow">{label}</div>
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 12,
        color: COLORS.inkSoft,
      }}
    >
      {hint}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// TILE — preview canvas + name + status + chevron
// ─────────────────────────────────────────────────────────────
const ToolTile = ({ tool }: { tool: Tool }) => {
  const { trigger: haptic } = useHaptics();
  const align = tool.previewAlign ?? "center";
  return (
    <Link
      to={tool.href}
      onClick={() => haptic("selection")}
      className="transition-transform duration-150 active:scale-[0.985] no-underline"
      style={{
        background: "#FFFFFF",
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 18,
        padding: 14,
        height: 168,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 2px rgba(31,27,23,0.04)",
        position: "relative",
        overflow: "hidden",
        color: COLORS.ink,
        textDecoration: "none",
        fontFamily: SF,
      }}
    >
      <div
        style={{
          height: 76,
          background: tool.bg,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: align,
          padding: align === "flex-start" ? "8px 10px" : 0,
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        <tool.Preview />
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: 15,
          color: COLORS.ink,
          letterSpacing: -0.2,
          marginBottom: 2,
        }}
      >
        {tool.name}
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 12,
          color: COLORS.inkMid,
          lineHeight: 1.35,
        }}
      >
        {tool.status}
      </div>
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "rgba(251,247,241,0.92)",
          border: `1px solid ${COLORS.hairline}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.inkMid,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
};

const ToolGroupSection = ({ group }: { group: ToolGroup }) => (
  <>
    <SectionHeader label={group.eyebrow} hint={group.hint} />
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        padding: "0 16px 24px",
      }}
    >
      {group.tools.map((t) => (
        <div key={t.name} style={t.fullWidth ? { gridColumn: "1 / -1" } : undefined}>
          <ToolTile tool={t} />
        </div>
      ))}
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────
// EDITORIAL CLOSER
// ─────────────────────────────────────────────────────────────
const Closer = () => (
  <div style={{ padding: "8px 32px 36px", textAlign: "center" }}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
      }}
    >
      <div style={{ width: 32, height: 1, background: "rgba(31,27,23,0.25)" }} />
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.terracotta }} />
      <div style={{ width: 32, height: 1, background: "rgba(31,27,23,0.25)" }} />
    </div>
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 14,
        color: COLORS.inkSoft,
        lineHeight: 1.5,
      }}
    >
      New marketing tool ideas?
      <br />
      <Link
        to="/help"
        style={{
          color: COLORS.terracotta,
          textDecoration: "underline",
          textDecorationColor: "rgba(198,90,62,0.4)",
          textUnderlineOffset: 3,
        }}
      >
        Tell us what you need
      </Link>
    </div>
  </div>
);

export default MarketingHub;
