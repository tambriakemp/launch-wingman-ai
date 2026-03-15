import { useState, FormEvent } from "react";
import {
  Instagram, Music2, Youtube, Facebook, Mail, Link2, 
  Lock, ExternalLink
} from "lucide-react";

const SOCIAL_LINKS = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Music2, href: "#", label: "TikTok" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Mail, href: "#", label: "Email" },
  { icon: Link2, href: "#", label: "Website" },
  { icon: ExternalLink, href: "#", label: "Pinterest" },
];

interface CardProps {
  image: string;
  badge: { text: string; bg: string };
  title: string;
  description: string;
  priceLine?: React.ReactNode;
  cta: { text: string; href?: string; };
  highlight?: boolean;
  children?: React.ReactNode;
}

function LinkCard({ image, badge, title, description, priceLine, cta, highlight, children }: CardProps) {
  return (
    <div
      className="rounded-[16px] overflow-hidden"
      style={{
        background: "#F0EBE0",
        border: "1px solid #E5DDD4",
        borderLeft: highlight ? "4px solid #C9A96E" : "1px solid #E5DDD4",
      }}
    >
      {/* Image */}
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
          style={{ borderRadius: "16px 16px 0 0" }}
          loading="lazy"
        />
        <span
          className="absolute top-3 left-3 text-white font-bold uppercase"
          style={{
            fontSize: 11,
            background: badge.bg,
            padding: "4px 10px",
            borderRadius: 20,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          {badge.text}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3
          className="font-bold"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 18,
            color: "#1A1A1A",
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: "#6B6560",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
        {priceLine}
        {children}
        {!children && (
          <a
            href={cta.href || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center font-bold text-white transition-transform duration-150 hover:scale-[0.98] active:scale-[0.96]"
            style={{
              background: "#1A1A1A",
              height: 44,
              lineHeight: "44px",
              borderRadius: 8,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
            }}
          >
            {cta.text}
          </a>
        )}
      </div>
    </div>
  );
}

const LinkInBio = () => {
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "success">("idle");

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitState("sending");
    setTimeout(() => setSubmitState("success"), 1000);
  };

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen w-full"
        style={{ background: "#FAF7F2", fontFamily: "'Inter', sans-serif" }}
      >
        <div className="mx-auto w-full" style={{ maxWidth: 480, padding: "48px 20px 64px" }}>

          {/* ── PROFILE HEADER ── */}
          <div className="flex flex-col items-center text-center mb-8">
            {/* Avatar */}
            <div
              className="rounded-full flex items-center justify-center mb-4"
              style={{
                width: 120,
                height: 120,
                border: "1px solid #C9A96E",
                background: "#F0EBE0",
              }}
            >
              <span
                className="font-bold"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 48,
                  color: "#1A1A1A",
                }}
              >
                L
              </span>
            </div>

            {/* Name */}
            <h1
              className="font-bold"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 28,
                color: "#1A1A1A",
                marginBottom: 8,
              }}
            >
              Launchely
            </h1>

            {/* Bio */}
            <p
              style={{
                fontSize: 15,
                color: "#6B6560",
                lineHeight: 1.5,
                maxWidth: 340,
              }}
            >
              Laid off tech girl building in public 🛠️&nbsp; |&nbsp; Life habits + launch tools 👇🏽
            </p>

            {/* Social icons */}
            <div className="flex items-center justify-center gap-4 mt-5">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="transition-opacity duration-150 hover:opacity-60"
                  style={{ color: "#1A1A1A" }}
                >
                  <s.icon size={24} strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>

          {/* ── CARDS ── */}
          <div className="space-y-4">

            {/* Card 1 — Free AI Starter Kit */}
            <LinkCard
              highlight
              image="https://picsum.photos/seed/starterkit/640/360"
              badge={{ text: "FREE", bg: "#C9A96E" }}
              title="Free AI Starter Kit"
              description="The exact tools, prompts, and step-by-step system to launch your first AI side hustle. Drop your email and I'll send it straight to you."
              cta={{ text: "Send Me the Free Kit →" }}
            >
              <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full outline-none"
                  style={{
                    height: 44,
                    borderRadius: 8,
                    border: "1px solid #D4CFC9",
                    background: "#FFFFFF",
                    padding: "0 14px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    color: "#1A1A1A",
                  }}
                />
                <button
                  type="submit"
                  disabled={submitState === "sending" || submitState === "success"}
                  className="w-full font-bold text-white transition-transform duration-150 hover:scale-[0.98] active:scale-[0.96] disabled:opacity-80"
                  style={{
                    background: "#1A1A1A",
                    height: 44,
                    borderRadius: 8,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 15,
                  }}
                >
                  {submitState === "sending" ? "Sending..." : "Send Me the Free Kit →"}
                </button>
                {submitState === "success" && (
                  <p
                    className="text-center font-medium"
                    style={{ color: "#C9A96E", fontSize: 13 }}
                  >
                    You're in! Check your inbox.
                  </p>
                )}
                <p
                  className="flex items-center justify-center gap-1.5"
                  style={{ color: "#6B6560", fontSize: 12 }}
                >
                  <Lock size={12} /> No spam. Unsubscribe anytime.
                </p>
              </form>
            </LinkCard>

            {/* Card 2 — Skool Community */}
            <LinkCard
              image="https://picsum.photos/seed/community/640/360"
              badge={{ text: "FREE", bg: "#22C55E" }}
              title="Launchely AI Community"
              description="Free ongoing support, accountability, and clarity while you build your AI brand — without the overwhelm. Join hundreds of creators building in public."
              cta={{ text: "Join Free →", href: "https://www.skool.com" }}
            />

            {/* Card 3 — AI Twin Formula */}
            <LinkCard
              image="https://picsum.photos/seed/aitwin/640/360"
              badge={{ text: "COURSE", bg: "#1A1A1A" }}
              title="The AI Twin Formula"
              description="Build a faceless AI brand, create 30 days of content in one afternoon, and turn your story into income — without ever showing your face. 10 modules. Instant access."
              priceLine={
                <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
                  <span style={{ color: "#6B6560", textDecoration: "line-through" }}>$57</span>
                  <span style={{ color: "#1A1A1A", fontWeight: 700, marginLeft: 6 }}>$37</span>
                </p>
              }
              cta={{ text: "Get Instant Access →", href: "https://launchely.com/ai-twin-formula" }}
            />

            {/* Card 4 — Launchely Platform */}
            <LinkCard
              image="https://picsum.photos/seed/platform/640/360"
              badge={{ text: "TOOL", bg: "#1A1A1A" }}
              title="Launchely AI Studio"
              description="The AI content tool that creates full vlog videos of your AI twin in your own spaces. Used inside The AI Twin Formula. Start at just $7/month."
              priceLine={
                <p style={{ fontSize: 13, color: "#6B6560", fontFamily: "'Inter', sans-serif" }}>
                  Content Vault from $7/mo · Full Platform from $25/mo
                </p>
              }
              cta={{ text: "Try Launchely →", href: "https://launchely.com" }}
            />
          </div>

          {/* ── FOOTER ── */}
          <div className="flex flex-col items-center pt-8 pb-0">
            <div style={{ width: 60, height: 1, background: "#C9A96E", marginBottom: 16 }} />
            <p style={{ fontSize: 12, color: "#6B6560" }}>
              © 2025 Launchely · cre8visions.com
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default LinkInBio;
