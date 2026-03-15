import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Instagram, Music2, Youtube, Facebook, Mail, Link2,
  Lock, ExternalLink, Twitter, Linkedin, Github, Globe
} from "lucide-react";

// ── Icon map ───────────────────────────────────────────────

const ICON_MAP: Record<string, any> = {
  Instagram, Music2, Youtube, Facebook, Mail, Link2,
  ExternalLink, Twitter, Linkedin, Github, Globe,
};

// ── Types ──────────────────────────────────────────────────

interface LinkCardData {
  id: string;
  position: number;
  title: string;
  description: string;
  image_url: string | null;
  badge_text: string | null;
  badge_color: string;
  cta_text: string;
  cta_url: string;
  price_original: string | null;
  price_current: string | null;
  price_note: string | null;
  card_type: string;
  highlight: boolean;
}

interface SocialLinkData {
  id: string;
  position: number;
  platform: string;
  url: string;
  icon_name: string;
  is_visible: boolean;
}

type BrandingMap = Record<string, string>;

// ── LinkCard component ─────────────────────────────────────

function LinkCard({ card, branding, children }: { card: LinkCardData; branding: BrandingMap; children?: React.ReactNode }) {
  const cardBg = branding.card_bg_color || "#1C1C1E";
  const cardBorder = branding.card_border_color || "#2A2A2C";
  const accent = branding.accent_color || "#C9A96E";
  const btnBg = branding.button_bg_color || "#FFFFFF";
  const btnText = branding.button_text_color || "#0A0A0A";
  const headingColor = branding.heading_text_color || "#F5F5F5";
  const bodyColor = branding.body_text_color || "#9A9A9A";

  return (
    <div
      className="rounded-[16px] overflow-hidden"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderLeft: card.highlight ? `4px solid ${accent}` : `1px solid ${cardBorder}`,
      }}
    >
      {card.image_url && (
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
          <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" style={{ borderRadius: "16px 16px 0 0" }} loading="lazy" />
          {card.badge_text && (
            <span
              className="absolute top-3 left-3 text-white font-bold uppercase"
              style={{ fontSize: 11, background: card.badge_color, padding: "4px 10px", borderRadius: 20, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.04em" }}
            >
              {card.badge_text}
            </span>
          )}
        </div>
      )}
      <div className="p-4 space-y-3">
        <h3 className="font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, color: headingColor, lineHeight: 1.3 }}>{card.title}</h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: bodyColor, lineHeight: 1.6 }}>{card.description}</p>
        {(card.price_original || card.price_current) && (
          <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
            {card.price_original && <span style={{ color: bodyColor, textDecoration: "line-through" }}>{card.price_original}</span>}
            {card.price_current && <span style={{ color: headingColor, fontWeight: 700, marginLeft: 6 }}>{card.price_current}</span>}
          </p>
        )}
        {card.price_note && <p style={{ fontSize: 13, color: bodyColor, fontFamily: "'Inter', sans-serif" }}>{card.price_note}</p>}
        {children}
        {!children && (
          <a
            href={card.cta_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center font-bold transition-transform duration-150 hover:scale-[0.98] active:scale-[0.96]"
            style={{ background: btnBg, color: btnText, height: 44, lineHeight: "44px", borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15 }}
          >
            {card.cta_text}
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

const LinkInBio = () => {
  const [cards, setCards] = useState<LinkCardData[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinkData[]>([]);
  const [branding, setBranding] = useState<BrandingMap>({});
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "success">("idle");

  useEffect(() => {
    // Fetch all data in parallel
    Promise.all([
      supabase.from("linkinbio_cards" as any).select("*").eq("is_visible", true).order("position", { ascending: true }),
      supabase.from("linkinbio_social_links" as any).select("*").eq("is_visible", true).order("position", { ascending: true }),
      supabase.from("linkinbio_settings" as any).select("*"),
    ]).then(([cardsRes, socialRes, settingsRes]) => {
      if (cardsRes.data) setCards(cardsRes.data as unknown as LinkCardData[]);
      if (socialRes.data) setSocialLinks(socialRes.data as unknown as SocialLinkData[]);
      if (settingsRes.data) {
        const map: BrandingMap = {};
        (settingsRes.data as unknown as { setting_key: string; setting_value: string }[]).forEach(s => { map[s.setting_key] = s.setting_value; });
        setBranding(map);
      }
    });
  }, []);

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitState("sending");
    setTimeout(() => setSubmitState("success"), 1000);
  };

  const pageBg = branding.page_bg_color || "#0A0A0A";
  const accent = branding.accent_color || "#C9A96E";
  const headingColor = branding.heading_text_color || "#FFFFFF";
  const bodyColor = branding.body_text_color || "#B0B0B0";
  const btnBg = branding.button_bg_color || "#FFFFFF";
  const btnText = branding.button_text_color || "#0A0A0A";
  const cardBorder = branding.card_border_color || "#333";
  const cardBg = branding.card_bg_color || "#111";

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet" />

      <div className="min-h-screen w-full" style={{ background: pageBg, fontFamily: "'Inter', sans-serif" }}>
        {/* ── HERO HEADER ── */}
        <div className="relative w-full" style={{ maxWidth: 480, margin: "0 auto" }}>
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/4", maxHeight: 520 }}>
            <img src={branding.hero_image_url || "https://picsum.photos/seed/launchely-hero/600/800"} alt={branding.brand_name || "Launchely"} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${pageBg} 95%)` }} />
          </div>

          <div className="relative text-center -mt-28 z-10 px-5">
            <h1 className="font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, color: headerNameColor, marginBottom: 8 }}>
              {branding.brand_name || "Launchely"}
            </h1>
            <p style={{ fontSize: 15, color: headerBioColor, lineHeight: 1.5, maxWidth: 340, margin: "0 auto" }}>
              {branding.bio_text || "Laid off tech girl building in public 🛠️  |  Life habits + launch tools 👇🏽"}
            </p>

            {/* Social icons */}
            {socialLinks.length > 0 && (
              <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
                {socialLinks.map((s) => {
                  const IconComp = ICON_MAP[s.icon_name] || Link2;
                  return (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.platform}
                      className="transition-opacity duration-150 hover:opacity-60 flex items-center justify-center"
                      style={{ color: headingColor, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }}
                    >
                      <IconComp size={20} strokeWidth={1.8} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── CARDS ── */}
        <div className="mx-auto w-full" style={{ maxWidth: 480, padding: "28px 20px 64px" }}>
          <div className="space-y-4">
            {cards.map((card) =>
              card.card_type === "email_capture" ? (
                <LinkCard key={card.id} card={card} branding={branding}>
                  <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full outline-none"
                      style={{ height: 44, borderRadius: 8, border: `1px solid ${cardBorder}`, background: cardBg, padding: "0 14px", fontFamily: "'Inter', sans-serif", fontSize: 14, color: headingColor }}
                    />
                    <button
                      type="submit"
                      disabled={submitState !== "idle"}
                      className="w-full font-bold transition-transform duration-150 hover:scale-[0.98] active:scale-[0.96] disabled:opacity-80"
                      style={{ background: btnBg, color: btnText, height: 44, borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15 }}
                    >
                      {submitState === "sending" ? "Sending..." : card.cta_text}
                    </button>
                    {submitState === "success" && (
                      <p className="text-center font-medium" style={{ color: accent, fontSize: 13 }}>You're in! Check your inbox.</p>
                    )}
                    <p className="flex items-center justify-center gap-1.5" style={{ color: bodyColor, fontSize: 12 }}>
                      <Lock size={12} /> No spam. Unsubscribe anytime.
                    </p>
                  </form>
                </LinkCard>
              ) : (
                <LinkCard key={card.id} card={card} branding={branding} />
              )
            )}
          </div>

          {/* Footer */}
          {branding.footer_text && (
            <div className="flex flex-col items-center pt-8">
              <div style={{ width: 60, height: 1, background: accent, marginBottom: 16 }} />
              <p style={{ fontSize: 12, color: bodyColor }}>{branding.footer_text}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LinkInBio;
