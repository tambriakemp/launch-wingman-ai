import { useState, useEffect, useCallback, FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import {
  Instagram, Music2, Youtube, Facebook, Mail, Link2,
  Lock, ExternalLink, Twitter, Linkedin, Github, Globe
} from "lucide-react";

// ── Icon map ───────────────────────────────────────────────

// TikTok icon (not in lucide-react)
const TikTokIcon = ({ size = 24, ...props }: { size?: number; [key: string]: any }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

// Pinterest icon
const PinterestIcon = ({ size = 24, ...props }: { size?: number; [key: string]: any }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.425 1.81-2.425.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.481 1.806 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.134-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
);

// HubSpot icon
const HubSpotIcon = ({ size = 24, ...props }: { size?: number; [key: string]: any }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="15" cy="12" r="3" />
    <circle cx="15" cy="5.5" r="1.5" />
    <line x1="15" y1="7" x2="15" y2="9" />
    <path d="M12.17 14.83l-2.67 2.67" />
    <circle cx="8.5" cy="18.5" r="1.5" />
    <path d="M12.17 9.17l-2.67-2.67" />
    <circle cx="8.5" cy="5.5" r="1.5" />
  </svg>
);

const ICON_MAP: Record<string, any> = {
  Instagram, Music2, Youtube, Facebook, Mail, Link2,
  ExternalLink, Twitter, Linkedin, Github, Globe,
  TikTok: TikTokIcon, Pinterest: PinterestIcon, HubSpot: HubSpotIcon,
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

function LinkCard({ card, branding, onCtaClick, children }: { card: LinkCardData; branding: BrandingMap; onCtaClick?: () => void; children?: React.ReactNode }) {
  const cardBg = branding.card_bg_color || "#1C1C1E";
  const cardBorder = branding.card_border_color || "#2A2A2C";
  const cardGradient = branding.card_gradient_color || cardBg;
  const accent = branding.accent_color || "#C9A96E";
  const btnBg = branding.button_bg_color || "#FFFFFF";
  const btnText = branding.button_text_color || "#0A0A0A";
  const headingColor = branding.heading_text_color || "#F5F5F5";
  const bodyColor = branding.body_text_color || "#9A9A9A";

  if (card.image_url) {
    return (
      <div
        className="rounded-[16px] overflow-hidden relative"
        style={{
          border: `1px solid ${cardBorder}`,
          borderLeft: card.highlight ? `4px solid ${accent}` : `1px solid ${cardBorder}`,
        }}
      >
        <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" style={{ aspectRatio: "3/4", display: "block" }} loading="lazy" />
        <div className="absolute inset-0 flex flex-col justify-end p-4 space-y-2" style={{ background: `linear-gradient(to top, ${cardGradient} 30%, transparent 100%)` }}>
          {card.badge_text && (
            <span
              className="absolute top-3 left-3 text-white font-bold uppercase"
              style={{ fontSize: 11, background: card.badge_color, padding: "4px 10px", borderRadius: 20, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.04em" }}
            >
              {card.badge_text}
            </span>
          )}
          <h3 className="font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, color: headingColor, lineHeight: 1.3 }}>{card.title}</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: bodyColor, lineHeight: 1.5 }}>{card.description}</p>
          {(card.price_original || card.price_current) && (
            <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
              {card.price_original && <span style={{ color: bodyColor, textDecoration: "line-through" }}>{card.price_original}</span>}
              {card.price_current && <span style={{ color: headingColor, fontWeight: 700, marginLeft: 6 }}>{card.price_current}</span>}
            </p>
          )}
          {card.price_note && <p style={{ fontSize: 12, color: bodyColor, fontFamily: "'Inter', sans-serif" }}>{card.price_note}</p>}
          {children}
          {!children && (
            <a
              href={card.cta_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onCtaClick}
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

  // No-image fallback card
  return (
    <div
      className="rounded-[16px] overflow-hidden p-4 space-y-3"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderLeft: card.highlight ? `4px solid ${accent}` : `1px solid ${cardBorder}`,
      }}
    >
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
          onClick={onCtaClick}
          className="block w-full text-center font-bold transition-transform duration-150 hover:scale-[0.98] active:scale-[0.96]"
          style={{ background: btnBg, color: btnText, height: 44, lineHeight: "44px", borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15 }}
        >
          {card.cta_text}
        </a>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

const LinkInBio = () => {
  const [cards, setCards] = useState<LinkCardData[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinkData[]>([]);
  const [branding, setBranding] = useState<BrandingMap>({});
  const [isLoaded, setIsLoaded] = useState(false);
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
      setIsLoaded(true);
    });
  }, []);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitState("sending");
    try {
      const { error } = await supabase.functions.invoke("linkinbio-subscribe", {
        body: { email: email.trim() },
      });
      if (error) throw error;
      setSubmitState("success");
    } catch (err) {
      console.error("Email subscribe error:", err);
      setSubmitState("success"); // Still show success to user for UX
    }
  };

  const trackClick = useCallback((linkType: string, linkId: string, linkLabel: string, linkUrl: string) => {
    supabase.from("linkinbio_clicks" as any).insert({
      link_type: linkType,
      link_id: linkId,
      link_label: linkLabel,
      link_url: linkUrl,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent || null,
    } as any).then(() => {});
  }, []);

  const pageBg = branding.page_bg_color || "#0A0A0A";
  const accent = branding.accent_color || "#C9A96E";
  const headingColor = branding.heading_text_color || "#FFFFFF";
  const bodyColor = branding.body_text_color || "#B0B0B0";
  const headerNameColor = branding.header_name_color || headingColor;
  const headerBioColor = branding.header_bio_color || bodyColor;
  const headerIconColor = branding.header_icon_color || headingColor;
  const headerIconBg = branding.header_icon_bg_color || "rgba(255,255,255,0.1)";
  const socialIconSize = parseInt(branding.social_icon_size || "32", 10);
  const btnBg = branding.button_bg_color || "#FFFFFF";
  const btnText = branding.button_text_color || "#0A0A0A";
  const cardBorder = branding.card_border_color || "#333";
  const cardBg = branding.card_bg_color || "#111";

  const pageTitle = branding.brand_name || "Launchely";
  const pageDescription = branding.bio_text || "Launch planning tools, habits & resources for coaches and marketers.";
  const ogImage = branding.hero_image_url || "https://launchely.com/og-image.png";

  return (
    <>
      <Helmet>
        <title>{pageTitle} | Links</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://launchely.com/links" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://launchely.com/links" />
        <meta property="og:title" content={`${pageTitle} | Links`} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@launchely" />
        <meta name="twitter:title" content={`${pageTitle} | Links`} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet" />

      <div className="min-h-screen w-full transition-opacity duration-300" style={{ background: pageBg, fontFamily: "'Inter', sans-serif", opacity: isLoaded ? 1 : 0 }}>
        {/* ── HERO HEADER ── */}
        <div className="relative w-full" style={{ maxWidth: 480, margin: "0 auto" }}>
         <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/4", maxHeight: 520, background: pageBg }}>
            <img
              src={branding.hero_image_url || "https://picsum.photos/seed/launchely-hero/600/800"}
              alt={branding.brand_name || "Launchely"}
              className="w-full h-full object-cover"
              style={{ opacity: 0, transition: "opacity 0.3s ease-in" }}
              onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
            />
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
              <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
                {socialLinks.map((s) => {
                  const IconComp = ICON_MAP[s.icon_name] || Link2;
                  const href = s.url.includes("@") && !s.url.includes("://") && !s.url.startsWith("mailto:") ? `mailto:${s.url}` : s.url;
                  return (
                    <a
                      key={s.id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.platform}
                      onClick={() => trackClick("social", s.id, s.platform, href)}
                      className="transition-opacity duration-150 hover:opacity-60 flex items-center justify-center"
                      style={{ color: headerIconColor, width: socialIconSize, height: socialIconSize, borderRadius: "50%", background: headerIconBg }}
                    >
                      <IconComp size={Math.round(socialIconSize * 0.5)} strokeWidth={1.8} />
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
