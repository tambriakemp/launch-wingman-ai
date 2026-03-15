import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Instagram, Music2, Youtube, Facebook, Mail, Link2,
  Lock, ExternalLink
} from "lucide-react";

const SOCIAL_LINKS = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: ExternalLink, href: "#", label: "Pinterest" },
  { icon: Mail, href: "#", label: "Email" },
];

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

function LinkCard({ card, children }: { card: LinkCardData; children?: React.ReactNode }) {
  return (
    <div
      className="rounded-[16px] overflow-hidden"
      style={{
        background: "#1C1C1E",
        border: "1px solid #2A2A2C",
        borderLeft: card.highlight ? "4px solid #C9A96E" : "1px solid #2A2A2C",
      }}
    >
      {card.image_url && (
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
          <img
            src={card.image_url}
            alt={card.title}
            className="w-full h-full object-cover"
            style={{ borderRadius: "16px 16px 0 0" }}
            loading="lazy"
          />
          {card.badge_text && (
            <span
              className="absolute top-3 left-3 text-white font-bold uppercase"
              style={{
                fontSize: 11,
                background: card.badge_color,
                padding: "4px 10px",
                borderRadius: 20,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              {card.badge_text}
            </span>
          )}
        </div>
      )}
      <div className="p-4 space-y-3">
        <h3
          className="font-bold"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 18,
            color: "#F5F5F5",
            lineHeight: 1.3,
          }}
        >
          {card.title}
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#9A9A9A", lineHeight: 1.6 }}>
          {card.description}
        </p>
        {(card.price_original || card.price_current) && (
          <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
            {card.price_original && (
              <span style={{ color: "#777", textDecoration: "line-through" }}>{card.price_original}</span>
            )}
            {card.price_current && (
              <span style={{ color: "#F5F5F5", fontWeight: 700, marginLeft: 6 }}>{card.price_current}</span>
            )}
          </p>
        )}
        {card.price_note && (
          <p style={{ fontSize: 13, color: "#777", fontFamily: "'Inter', sans-serif" }}>{card.price_note}</p>
        )}
        {children}
        {!children && (
          <a
            href={card.cta_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center font-bold transition-transform duration-150 hover:scale-[0.98] active:scale-[0.96]"
            style={{
              background: "#FFFFFF",
              color: "#0A0A0A",
              height: 44,
              lineHeight: "44px",
              borderRadius: 8,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
            }}
          >
            {card.cta_text}
          </a>
        )}
      </div>
    </div>
  );
}

const LinkInBio = () => {
  const [cards, setCards] = useState<LinkCardData[]>([]);
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "success">("idle");

  useEffect(() => {
    supabase
      .from("linkinbio_cards" as any)
      .select("*")
      .order("position", { ascending: true })
      .then(({ data }) => {
        if (data) setCards(data as unknown as LinkCardData[]);
      });
  }, []);

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitState("sending");
    setTimeout(() => setSubmitState("success"), 1000);
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen w-full"
        style={{ background: "#0A0A0A", fontFamily: "'Inter', sans-serif" }}
      >
        {/* ── HERO HEADER (screenshot style) ── */}
        <div className="relative w-full" style={{ maxWidth: 480, margin: "0 auto" }}>
          {/* Large hero photo */}
          <div
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: "3/4", maxHeight: 520 }}
          >
            <img
              src="https://picsum.photos/seed/launchely-hero/600/800"
              alt="Launchely"
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay at bottom */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, transparent 40%, #0A0A0A 95%)",
              }}
            />
          </div>

          {/* Name + bio overlaid at bottom of image */}
          <div
            className="relative text-center -mt-28 z-10 px-5"
            style={{ paddingBottom: 0 }}
          >
            <h1
              className="font-extrabold"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 32,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Launchely
            </h1>
            <p
              style={{
                fontSize: 15,
                color: "#B0B0B0",
                lineHeight: 1.5,
                maxWidth: 340,
                margin: "0 auto",
              }}
            >
              Laid off tech girl building in public 🛠️&nbsp; |&nbsp; Life habits + launch tools 👇🏽
            </p>

            {/* Social icons */}
            <div className="flex items-center justify-center gap-5 mt-5">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="transition-opacity duration-150 hover:opacity-60 flex items-center justify-center"
                  style={{
                    color: "#FFFFFF",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                  }}
                >
                  <s.icon size={20} strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── CARDS ── */}
        <div className="mx-auto w-full" style={{ maxWidth: 480, padding: "28px 20px 64px" }}>
          <div className="space-y-4">
            {cards.map((card) =>
              card.card_type === "email_capture" ? (
                <LinkCard key={card.id} card={card}>
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
                        border: "1px solid #333",
                        background: "#111",
                        padding: "0 14px",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 14,
                        color: "#F5F5F5",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={submitState !== "idle"}
                      className="w-full font-bold transition-transform duration-150 hover:scale-[0.98] active:scale-[0.96] disabled:opacity-80"
                      style={{
                        background: "#FFFFFF",
                        color: "#0A0A0A",
                        height: 44,
                        borderRadius: 8,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 15,
                      }}
                    >
                      {submitState === "sending" ? "Sending..." : card.cta_text}
                    </button>
                    {submitState === "success" && (
                      <p className="text-center font-medium" style={{ color: "#C9A96E", fontSize: 13 }}>
                        You're in! Check your inbox.
                      </p>
                    )}
                    <p className="flex items-center justify-center gap-1.5" style={{ color: "#666", fontSize: 12 }}>
                      <Lock size={12} /> No spam. Unsubscribe anytime.
                    </p>
                  </form>
                </LinkCard>
              ) : (
                <LinkCard key={card.id} card={card} />
              )
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center pt-8">
            <div style={{ width: 60, height: 1, background: "#C9A96E", marginBottom: 16 }} />
            <p style={{ fontSize: 12, color: "#555" }}>© 2025 Launchely</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LinkInBio;
