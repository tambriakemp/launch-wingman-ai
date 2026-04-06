import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const faqData = [
  {
    q: "Do I need any experience with AI tools?",
    a: "None at all. This course starts from zero. Every tool is explained step-by-step, and you'll get the exact prompts and settings to use. If you've ever typed into a search bar, you can follow along.",
  },
  {
    q: "What AI tools will I need? Are they free?",
    a: "We cover a full range of tools — many with free tiers (Gemini, DALL-E via ChatGPT free, CapCut). The Bonus Module breaks down every tool with pricing so you can choose what fits your budget. Launchely AI Avatar Studio has a $7/month Content Vault tier that unlocks the vlog creation features covered in Module 05.",
  },
  {
    q: "Is my AI twin's face based on my real face?",
    a: "Totally up to you. You can create a completely original character from scratch using text prompts, or use your own features as a starting reference. The course teaches both approaches. For Launchely's VLOG tool, you'll upload 3 reference photos to keep your twin consistent — but your twin can look however you want.",
  },
  {
    q: "How long does it take to complete the course?",
    a: "Most students complete the core modules in a weekend. Each module is focused and practical — no hour-long lectures. By Day 3, most people have their first AI image. By end of Week 1, they have a content batch ready to schedule.",
  },
  {
    q: "Is the course hosted on Skool? Do I need a Skool account?",
    a: "Yes — the course lives inside our Skool community. Creating a Skool account is free. Once you purchase, you'll get a link to join the community and access the paid course tier. You'll also get access to the free community where you can connect with other AI twin creators.",
  },
  {
    q: "What if I've never made a Reel before?",
    a: "Perfect — this was designed with you in mind. Module 07 covers the full CapCut assembly process, and Module 05 shows you how Launchely AI Avatar Studio generates vlog-style videos you can post directly. You don't need editing experience.",
  },
  {
    q: "Can I really make money with a faceless AI twin account?",
    a: "Yes — Module 08 maps 5 specific income channels with a 90-day roadmap. Digital products (like mini courses), affiliate commissions, and the Launchely funnel ($7/$25/month) are all covered. This isn't theory — it's based on the exact model we use.",
  },
  {
    q: "What's your refund policy?",
    a: "7-day money-back guarantee. No questions asked. Email info@cre8visions.com within 7 days of purchase and we'll process your refund promptly.",
  },
];

const modules = [
  { num: "Module 00", title: "Styl's Story — Your Story", desc: "The emotional foundation. Understand why AI twins work, how Styl was born from a layoff, and write the first draft of your own origin story.", tag: "Foundation" },
  { num: "Module 01", title: "Design Your AI Twin", desc: "The A/B Prompt Technique — generate a consistent, photorealistic avatar using Gemini, DALL-E, or Midjourney. Full sample prompts included.", tag: "AI Image Creation" },
  { num: "Module 02", title: "Perfect the Look", desc: "Outfits, environments, and face consistency across your entire image library. The Clothing Change Prompt Formula + a 3×4 content grid system.", tag: "Visual Identity" },
  { num: "Module 03", title: "Give Your Twin a Persona", desc: "Name, origin story, content pillars, voice, and story arc. Build a full Brand Bible worksheet so your twin feels real — not robotic.", tag: "Brand Strategy" },
  { num: "Module 04", title: "Animate with OpenArt", desc: "Upload your AI image and bring her to life — talking head clips, lifestyle b-roll, and lip-sync videos. Assemble in CapCut for Reels.", tag: "Video Creation" },
  { num: "Module 05", title: "Create AI Vlogs with Launchely", desc: "Full walkthrough of Launchely AI Avatar Studio — upload your 3 reference photos, set your environments, configure your Look, and generate full AI vlogs.", tag: "Launchely AI Avatar Studio" },
  { num: "Module 06", title: "Script Your Twin's Story", desc: "4 story types, AI-powered script prompts, hook formulas, and a 30-day narrative arc template. Your audience will actually want to follow along.", tag: "Content Writing" },
  { num: "Module 07", title: "Batch 30 Days of Content", desc: "The 4-hour batch session — scripts to vlogs to edited Reels to scheduled posts. A weekly content calendar pattern that keeps you consistent.", tag: "Content System" },
  { num: "Module 08", title: "Monetize Through Your Twin", desc: "5 income channels: digital products, funnel, affiliate, services, and brand deals. A 90-day monetization roadmap with real math.", tag: "Revenue Strategy" },
];

const valueItems = [
  { title: "The AI Twin Formula — 10 Module Course", sub: "Full step-by-step curriculum, hosted on Skool, instant access", price: "$197" },
  { title: "A/B Prompt Technique Library", sub: "Plug-and-play prompt templates for consistent AI twin imagery", price: "$47" },
  { title: "Brand Bible Worksheet", sub: "Fill-in-the-blank persona builder — name, voice, story arc, pillars", price: "$27" },
  { title: "30-Day Content Calendar Template", sub: "Pre-mapped story arc and weekly batch workflow", price: "$37" },
  { title: "Launchely AI Studio Deep-Dive Module", sub: "Full walkthrough of VLOG creation, character setup, and look presets", price: "$67" },
  { title: "90-Day Monetization Roadmap", sub: "5 income channels + real revenue math for digital product funnels", price: "$47" },
  { title: "Free Skool Community Access", sub: "Connect with other AI twin creators, share wins, get feedback", price: "$97/yr" },
];

const bridgeSteps = [
  { title: "Design your AI twin with the A/B Prompt Technique", desc: "Create a photorealistic, consistent avatar using Gemini, DALL-E, or Midjourney — no design skills needed." },
  { title: "Give her a face, a wardrobe, and a world", desc: "Master outfits, environments, and look consistency across dozens of images — building a full content library." },
  { title: "Build a persona with a Brand Bible", desc: "Name, story arc, content pillars, and voice — so your twin feels like a real, relatable person online." },
  { title: "Animate with OpenArt & create vlogs with Launchely AI Studio", desc: "Turn still images into moving content — talking heads, lifestyle clips, and full AI vlogs ready for Reels." },
  { title: "Script a 30-day content arc", desc: "Use AI to write hooks, stories, and scripts that build connection — without burnout or blank-page syndrome." },
  { title: "Batch 30 days of content in one afternoon", desc: "The exact 4-hour workflow to produce a full month of Reels, schedule it, and walk away." },
  { title: "Monetize through your twin", desc: "Digital products, affiliate income, brand deals — 5 income channels mapped to a 90-day roadmap." },
];

const painCards = [
  { title: '"I don\'t want to be on camera."', desc: "You have a story worth telling, but the thought of putting your face on the internet stops you cold every time." },
  { title: '"I don\'t have a professional setup."', desc: "No studio. No ring light. No perfect background. You're convinced you need equipment you don't have before you can even start." },
  { title: '"I tried posting but no one watched."', desc: "You put yourself out there once or twice, didn't get traction, and quietly gave up. It felt like screaming into a void." },
  { title: '"I don\'t know where to start."', desc: "The tools are confusing, the options are endless, and nobody explains what to actually do — in what order — to build something real." },
  { title: '"I lost my job and need something fast."', desc: "The paycheck stopped. The pressure started. You need a way to build income streams without waiting 12 months for results." },
  { title: '"AI content feels fake or overwhelming."', desc: "You've heard about AI tools but don't know which ones matter, how to use them, or how to make the output feel like YOU." },
];

const forCards = [
  { emoji: "🎯", title: "You're camera-shy", desc: "You want a brand presence without the anxiety of being on screen." },
  { emoji: "💼", title: "You were laid off", desc: "Rebuilding and want to turn the setback into a brand story that connects." },
  { emoji: "🚀", title: "You're starting from zero", desc: "No followers, no content, no clue — this is your roadmap." },
  { emoji: "💡", title: "You have AI curiosity", desc: "You want to actually use AI tools for something practical and profitable." },
  { emoji: "📱", title: "You want Reels content", desc: "You know short-form video is the move — you just need a system that works." },
  { emoji: "💰", title: "You want to monetize", desc: "Building audience and income — not just posting for fun." },
];

const testimonials = [
  { initials: "JM", name: "Janelle M.", role: "Former Marketing Manager · Now AI Content Creator", quote: "I literally cried when I heard Tambria's story because it was mine too. I had been laid off for 4 months and couldn't figure out how to move forward. This course gave me a path AND the tools to walk it." },
  { initials: "TS", name: "Tara S.", role: "Stay-at-home mom · Building her first brand", quote: "The A/B Prompt Technique alone was worth the price. My AI twin looks so consistent and real — people actually think it's me in real life. The Launchely module was the missing piece for video." },
  { initials: "RA", name: "Renae A.", role: "Nurse · Launching a side hustle brand", quote: "I was so scared to put myself online — even behind an avatar! Styl's story made me realize I don't need to be perfect. I need to be real. I built my twin in a weekend and posted my first Reel by Monday." },
];

const pricingIncludes = [
  "10 step-by-step modules (instant access on Skool)",
  "A/B Prompt Technique Library with sample prompts",
  "Brand Bible worksheet — your twin's full persona",
  "30-day content calendar + weekly batch workflow",
  "Launchely AI Studio walkthrough module",
  "90-day monetization roadmap",
  "Free Skool community (lifetime access)",
  "🎁 Bonus: Full tool stack guide + Launchely comparison",
];

const scrollToPricing = (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const AITwinFormula = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    document.title = "The AI Twin Formula | Build a Brand Without Showing Your Face";
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Check for success/canceled params
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast.success("Payment successful! Check your email for Skool access.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("canceled") === "true") {
      toast.info("Checkout was canceled.");
      window.history.replaceState({}, "", window.location.pathname);
    }

    return () => { link.remove(); };
  }, []);

  const handleCheckout = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-ai-twin-checkout", {
        body: { email: emailInput },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Failed to start checkout. Please try again.");
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <div className="font-['Inter'] text-white leading-relaxed overflow-x-hidden" style={{ background: "#1A1A2E" }}>

        {/* URGENCY BAR */}
        <div
          className="text-center text-[0.85rem] font-semibold tracking-wide sticky top-0 z-[100]"
          style={{ background: "linear-gradient(90deg, #7C3AED, #D63384)", padding: "10px 20px", letterSpacing: "0.03em" }}
        >
          🔥 Introductory price — <span style={{ color: "#D4A43A" }}>save $30 today</span> — price increases when the counter hits zero &nbsp;|&nbsp; 100% digital, instant access
        </div>

        {/* HERO */}
        <section className="relative overflow-hidden text-center" style={{ background: "linear-gradient(160deg, #0d0d1f 0%, #1A1A2E 40%, #1e0f3a 100%)", padding: "80px 24px 60px" }}>
          <div className="absolute pointer-events-none" style={{ top: "-200px", left: "50%", transform: "translateX(-50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />
          <div className="absolute pointer-events-none" style={{ bottom: "-200px", right: "-100px", width: 500, height: 500, background: "radial-gradient(circle, rgba(214,51,132,0.12) 0%, transparent 70%)" }} />
          <div className="max-w-[860px] mx-auto px-6 relative z-10">
            <div className="inline-block text-[0.78rem] font-bold tracking-[0.12em] uppercase rounded-full mb-6" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#9D65F5", padding: "6px 16px" }}>
              New Mini Course — Instant Access
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black leading-[1.15] max-w-[800px] mx-auto mb-5 tracking-tight">
              I Got Laid Off and Built a Brand<br />
              <span style={{ background: "linear-gradient(135deg, #E85BA3, #9D65F5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Without Ever Showing My Face
              </span>
            </h1>
            <p className="text-[1.1rem] max-w-[580px] mx-auto mb-9 leading-[1.7]" style={{ color: "rgba(255,255,255,0.6)" }}>
              The step-by-step system for creating your AI twin, filming content, and growing an audience — even if you're camera-shy, starting from zero, or rebuilding after a setback.
            </p>
            <div className="flex flex-col items-center gap-3">
              <a href="#pricing" onClick={scrollToPricing} className="inline-block text-white text-[1.05rem] font-bold rounded-full no-underline transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #D63384, #7C3AED)", padding: "16px 40px", boxShadow: "0 8px 32px rgba(214,51,132,0.35)", letterSpacing: "0.02em" }}>
                Yes, I Want The AI Twin Formula →
              </a>
              <span className="text-[0.8rem]" style={{ color: "rgba(255,255,255,0.4)" }}>🔒 7-day money-back guarantee &nbsp;|&nbsp; Instant access on Skool</span>
            </div>
            <div className="flex justify-center gap-10 mt-14 pt-10 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                { num: "10", lbl: "Step-by-step modules" },
                { num: "$0", lbl: "Paid ads required" },
                { num: "100%", lbl: "Faceless. Zero camera." },
                { num: "Free", lbl: "Community included" },
              ].map((s) => (
                <div key={s.lbl} className="text-center">
                  <div className="text-[1.8rem] font-extrabold" style={{ background: "linear-gradient(135deg, #E85BA3, #9D65F5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.num}</div>
                  <div className="text-[0.8rem] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PAIN SECTION */}
        <section style={{ background: "#16213E", padding: "80px 24px" }}>
          <div className="max-w-[860px] mx-auto px-6">
            <div className="text-center text-[0.75rem] font-bold tracking-[0.14em] uppercase mb-3.5" style={{ color: "#E85BA3" }}>Sound Familiar?</div>
            <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-[1.25] mb-4 tracking-tight">You have something to say — but something is holding you back</h2>
            <p className="text-center text-base max-w-[560px] mx-auto mb-13 leading-[1.7]" style={{ color: "rgba(255,255,255,0.6)" }}>You're not alone. These are the walls that keep brilliant people off the internet.</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 mt-10">
              {painCards.map((c) => (
                <div key={c.title} className="relative rounded-[14px] p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="absolute top-5 right-5 text-[1.1rem] font-bold" style={{ color: "#D63384" }}>✗</span>
                  <strong className="block mb-1.5 text-base text-white">{c.title}</strong>
                  <p className="text-[0.95rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STORY SECTION */}
        <section style={{ background: "#1A1A2E", padding: "80px 24px" }}>
          <div className="max-w-[860px] mx-auto px-6">
            <div className="text-center text-[0.75rem] font-bold tracking-[0.14em] uppercase mb-3.5" style={{ color: "#E85BA3" }}>The Story Behind This Course</div>
            <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-[1.25] mb-4 tracking-tight">What happens when the job disappears?</h2>
            <div className="relative rounded-[20px] max-w-[720px] mx-auto" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(214,51,132,0.08))", border: "1px solid rgba(214,51,132,0.2)", padding: "48px" }}>
              <span className="absolute font-serif leading-none" style={{ top: 20, left: 36, fontSize: "6rem", color: "rgba(214,51,132,0.2)" }}>"</span>
              <div className="text-[1.1rem] leading-[1.85]" style={{ color: "rgba(255,255,255,0.85)" }}>
                <p className="mb-4">I got laid off. No warning. No soft landing. Just a calendar invite on a Tuesday that changed everything.</p>
                <p className="mb-4">I had always wanted to build something online — a brand, a community, a business that was actually mine. But I was scared. Scared of the camera. Scared of judgment. Scared I didn't have a good enough story to tell.</p>
                <p className="mb-4">The layoff forced the question: <span className="font-semibold" style={{ color: "#E85BA3" }}>what if this is actually the moment?</span></p>
                <p className="mb-4">So I created Styl. My AI avatar. My digital representative. She tells my story, shows up on social media, and builds the audience — while I stay behind the scenes. And the crazy part? <span className="font-semibold" style={{ color: "#E85BA3" }}>It's working.</span></p>
                <p>I built this course to show you exactly how I did it — from the very first AI image to a full content system, a growing Skool community, and real income streams. All without a single selfie.</p>
              </div>
              <div className="mt-7 pt-6 flex items-center gap-3.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[1.4rem] shrink-0" style={{ background: "linear-gradient(135deg, #7C3AED, #D63384)" }}>✨</div>
                <div>
                  <div className="font-bold text-[0.95rem]">Tambria & Styl</div>
                  <div className="text-[0.8rem]" style={{ color: "rgba(255,255,255,0.6)" }}>Founder, Cre8Visions | Creator of The AI Twin Formula</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MEET STYL */}
        <section style={{ background: "#16213E", padding: "80px 24px" }}>
          <div className="max-w-[860px] mx-auto px-6">
            <div className="text-center text-[0.75rem] font-bold tracking-[0.14em] uppercase mb-3.5" style={{ color: "#E85BA3" }}>Living Proof</div>
            <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-[1.25] mb-4 tracking-tight">Meet Styl — the AI twin that started it all</h2>
            <p className="text-center text-base max-w-[560px] mx-auto mb-13 leading-[1.7]" style={{ color: "rgba(255,255,255,0.6)" }}>Styl is a fully AI-generated avatar. She posts content, tells stories, and builds community — 100% faceless.</p>
            <div className="text-center rounded-[20px] max-w-[680px] mx-auto" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(214,51,132,0.12))", border: "1px solid rgba(214,51,132,0.25)", padding: "48px" }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-[2.2rem] mx-auto mb-5" style={{ background: "linear-gradient(135deg, #7C3AED, #D63384)", boxShadow: "0 8px 32px rgba(214,51,132,0.3)" }}>🤖</div>
              <h3 className="text-2xl font-extrabold mb-3">Styl is not a deepfake. She's a strategy.</h3>
              <p style={{ color: "rgba(255,255,255,0.6)" }} className="leading-[1.75]">
                Styl was built using free and affordable AI tools — a consistent face, a real voice, real stories, and real content. She represents the layoff-to-freedom journey and resonates with people who are in the exact same place.
              </p>
              <p className="mt-3 leading-[1.75]" style={{ color: "rgba(255,255,255,0.6)" }}>
                Inside this course, you'll build YOUR version of Styl — with your story, your personality, and your vision — in less time than it takes to set up a camera tripod.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-8">
                {[
                  { val: "AI", lbl: "Generated face & persona" },
                  { val: "100%", lbl: "Consistent look & brand" },
                  { val: "Real", lbl: "Story. Real community." },
                ].map((s) => (
                  <div key={s.lbl} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="text-[1.4rem] font-extrabold" style={{ background: "linear-gradient(135deg, #E85BA3, #9D65F5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.val}</div>
                    <div className="text-[0.75rem] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTION BRIDGE */}
        <section style={{ background: "#1A1A2E", padding: "80px 24px" }}>
          <div className="max-w-[860px] mx-auto px-6">
            <div className="text-center text-[0.75rem] font-bold tracking-[0.14em] uppercase mb-3.5" style={{ color: "#E85BA3" }}>How It Works</div>
            <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-[1.25] mb-4 tracking-tight">Here's the formula — start to finish</h2>
            <p className="text-center text-base max-w-[560px] mx-auto mb-13 leading-[1.7]" style={{ color: "rgba(255,255,255,0.6)" }}>No fluff. No filler. Just the exact steps to go from idea to AI twin to content machine.</p>
            <div className="max-w-[640px] mx-auto">
              {bridgeSteps.map((step, i) => (
                <div key={i} className="flex gap-4 items-start py-[18px]" style={{ borderBottom: i < bridgeSteps.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base shrink-0 mt-0.5 text-white font-bold" style={{ background: "linear-gradient(135deg, #7C3AED, #D63384)" }}>{i + 1}</div>
                  <div>
                    <strong className="block text-[0.98rem] mb-1">{step.title}</strong>
                    <span className="text-[0.88rem]" style={{ color: "rgba(255,255,255,0.6)" }}>{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MODULES */}
        <section style={{ background: "#16213E", padding: "80px 24px" }}>
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="text-center text-[0.75rem] font-bold tracking-[0.14em] uppercase mb-3.5" style={{ color: "#E85BA3" }}>The Curriculum</div>
            <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-[1.25] mb-4 tracking-tight">10 modules. Everything you need. Nothing you don't.</h2>
            <p className="text-center text-base max-w-[560px] mx-auto mb-13 leading-[1.7]" style={{ color: "rgba(255,255,255,0.6)" }}>Each module is focused, actionable, and built for people who want results — not more theory.</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4 mt-10">
              {modules.map((m) => (
                <div key={m.num} className="relative overflow-hidden rounded-[14px] p-[22px] transition-all hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="absolute top-0 left-0 w-[3px] h-full" style={{ background: "linear-gradient(180deg, #7C3AED, #D63384)" }} />
                  <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: "#E85BA3" }}>{m.num}</div>
                  <h4 className="text-base font-bold mb-2">{m.title}</h4>
                  <p className="text-[0.85rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{m.desc}</p>
                  <span className="inline-block text-[0.7rem] font-semibold rounded-full mt-2.5" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#9D65F5", padding: "3px 10px" }}>{m.tag}</span>
                </div>
              ))}
              {/* Bonus module */}
              <div className="relative overflow-hidden rounded-[14px] p-[22px] transition-all hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(176,125,42,0.3)" }}>
                <div className="absolute top-0 left-0 w-[3px] h-full" style={{ background: "linear-gradient(180deg, #B07D2A, #D4A43A)" }} />
                <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: "#D4A43A" }}>🎁 Bonus Module</div>
                <h4 className="text-base font-bold mb-2">Full Tech Stack + Next Steps</h4>
                <p className="text-[0.85rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>Every tool, compared and explained: Gemini, Midjourney, OpenArt, Launchely, ElevenLabs, CapCut, Canva, Gumroad, Skool — with a plan comparison for Launchely tiers.</p>
                <span className="inline-block text-[0.7rem] font-semibold rounded-full mt-2.5" style={{ background: "rgba(176,125,42,0.15)", border: "1px solid rgba(176,125,42,0.3)", color: "#D4A43A", padding: "3px 10px" }}>Bonus Resource</span>
              </div>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section style={{ background: "#1A1A2E", padding: "80px 24px" }}>
          <div className="max-w-[860px] mx-auto px-6">
            <div className="text-center text-[0.75rem] font-bold tracking-[0.14em] uppercase mb-3.5" style={{ color: "#E85BA3" }}>Who This Is For</div>
            <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-[1.25] mb-4 tracking-tight">This course was made for you if…</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mt-10">
              {forCards.map((c) => (
                <div key={c.title} className="text-center rounded-[14px] p-[22px] transition-all hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="text-[2rem] mb-3">{c.emoji}</div>
                  <strong className="block text-[0.95rem] mb-1.5">{c.title}</strong>
                  <span className="text-[0.82rem]" style={{ color: "rgba(255,255,255,0.6)" }}>{c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VALUE STACK */}
        <section style={{ background: "#16213E", padding: "80px 24px" }}>
          <div className="max-w-[860px] mx-auto px-6">
            <div className="text-center text-[0.75rem] font-bold tracking-[0.14em] uppercase mb-3.5" style={{ color: "#E85BA3" }}>Everything You Get</div>
            <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-[1.25] mb-4 tracking-tight">The full value of what's included</h2>
            <p className="text-center text-base max-w-[560px] mx-auto mb-13 leading-[1.7]" style={{ color: "rgba(255,255,255,0.6)" }}>Every piece is designed to get you from zero to a working AI twin content system.</p>
            <div className="max-w-[660px] mx-auto">
              {valueItems.map((v) => (
                <div key={v.title} className="flex justify-between items-center py-4 gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div>
                    <strong className="block text-white mb-0.5">{v.title}</strong>
                    <span className="text-[0.8rem]" style={{ color: "rgba(255,255,255,0.6)" }}>{v.sub}</span>
                  </div>
                  <div className="text-base font-bold whitespace-nowrap line-through opacity-70" style={{ color: "rgba(255,255,255,0.6)" }}>{v.price}</div>
                </div>
              ))}
              <div className="flex justify-between items-center rounded-[14px] mt-5" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(214,51,132,0.12))", border: "1px solid rgba(214,51,132,0.25)", padding: "20px 24px" }}>
                <div className="font-bold text-base">Total Real-World Value</div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[1.1rem] line-through" style={{ color: "rgba(255,255,255,0.6)" }}>$519+</span>
                  <span className="text-[1.6rem] font-black" style={{ background: "linear-gradient(135deg, #E85BA3, #9D65F5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$27</span>
                </div>
              </div>
            </div>
            <div className="text-center mt-9">
              <a href="#pricing" onClick={scrollToPricing} className="inline-block text-white text-[1.05rem] font-bold rounded-full no-underline transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #D63384, #7C3AED)", padding: "16px 40px", boxShadow: "0 8px 32px rgba(214,51,132,0.35)" }}>
                Get Instant Access for $27 →
              </a>
              <p className="text-[0.8rem] mt-2.5" style={{ color: "rgba(255,255,255,0.4)" }}>One-time payment. No subscriptions. Lifetime access.</p>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section style={{ background: "#1A1A2E", padding: "80px 24px" }}>
          <div className="max-w-[860px] mx-auto px-6">
            <div className="text-center text-[0.75rem] font-bold tracking-[0.14em] uppercase mb-3.5" style={{ color: "#E85BA3" }}>Community Love</div>
            <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-[1.25] mb-4 tracking-tight">What early students are saying</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 mt-10">
              {testimonials.map((t) => (
                <div key={t.initials} className="rounded-[14px] p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="text-[0.9rem] mb-3" style={{ color: "#D4A43A", letterSpacing: 2 }}>★★★★★</div>
                  <blockquote className="text-[0.9rem] italic mb-4 leading-[1.7]" style={{ color: "rgba(255,255,255,0.8)" }}>"{t.quote}"</blockquote>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[0.85rem] font-bold shrink-0" style={{ background: "linear-gradient(135deg, #7C3AED, #D63384)" }}>{t.initials}</div>
                    <div>
                      <div className="text-[0.88rem] font-semibold">{t.name}</div>
                      <div className="text-[0.75rem]" style={{ color: "rgba(255,255,255,0.6)" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ background: "#16213E", padding: "80px 24px" }}>
          <div className="max-w-[860px] mx-auto px-6">
            <div className="text-center text-[0.75rem] font-bold tracking-[0.14em] uppercase mb-3.5" style={{ color: "#E85BA3" }}>Get Access Now</div>
            <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-[1.25] mb-4 tracking-tight">One payment. Lifetime access. Real results.</h2>
            <div className="relative max-w-[520px] mx-auto mt-10 rounded-[24px] text-center" style={{ background: "linear-gradient(160deg, #1e1040, #1A1A2E)", border: "2px solid rgba(214,51,132,0.35)", padding: "48px", boxShadow: "0 20px 60px rgba(214,51,132,0.15)" }}>
              <div className="absolute left-1/2 -translate-x-1/2 -top-3.5 text-[0.75rem] font-bold tracking-[0.08em] uppercase rounded-full whitespace-nowrap text-white" style={{ background: "linear-gradient(135deg, #D63384, #7C3AED)", padding: "5px 18px" }}>
                🔥 Introductory Offer — Save $30
              </div>
              <div className="text-[0.85rem] font-semibold tracking-[0.08em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>The AI Twin Formula</div>
              <div className="text-base line-through mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Regular price: $57</div>
              <div className="text-[4rem] font-black leading-none my-2" style={{ background: "linear-gradient(135deg, #E85BA3, #9D65F5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$27</div>
              <div className="text-[0.85rem] mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>One-time payment · No monthly fees · Instant access</div>
              <input
                type="email"
                placeholder="Enter your email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded-xl text-[0.95rem] mb-3 outline-none focus:ring-2 focus:ring-purple-500"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", padding: "14px 18px", color: "#fff" }}
              />
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="block w-full text-center text-white text-[1.05rem] font-bold rounded-full no-underline transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: "linear-gradient(135deg, #D63384, #7C3AED)", padding: "16px 20px", boxShadow: "0 8px 32px rgba(214,51,132,0.35)", border: "none" }}
              >
                {checkoutLoading ? "Loading checkout..." : "Yes — Give Me Instant Access →"}
              </button>
              <div className="text-left mt-6 mb-8 flex flex-col gap-2.5">
                {pricingIncludes.map((line) => (
                  <div key={line} className="flex items-center gap-2.5 text-[0.9rem]">
                    <span className="shrink-0 font-bold text-[0.85rem]" style={{ color: "#10B981" }}>✓</span>
                    {line}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2.5 text-left rounded-xl mt-5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", padding: "14px 16px" }}>
                <span className="text-[1.4rem] shrink-0">🛡️</span>
                <div>
                  <strong className="text-[0.9rem] block" style={{ color: "#10B981" }}>7-Day Money-Back Guarantee</strong>
                  <span className="text-[0.8rem]" style={{ color: "rgba(255,255,255,0.6)" }}>If you go through the course and don't feel it was worth every penny, email us and we'll refund — no questions asked.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GUARANTEE */}
        <section style={{ background: "#1A1A2E", padding: "60px 24px" }}>
          <div className="max-w-[860px] mx-auto px-6">
            <div className="max-w-[640px] mx-auto text-center rounded-[20px]" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", padding: "48px" }}>
              <div className="text-[3rem] mb-4">🛡️</div>
              <h3 className="text-2xl font-extrabold mb-3" style={{ color: "#10B981" }}>The "Just Try It" Guarantee</h3>
              <p className="text-[0.95rem] leading-[1.75]" style={{ color: "rgba(255,255,255,0.6)" }}>
                Go through the first three modules. Build your AI twin's first look. If you don't feel like this course is worth 10× what you paid — just email <a href="mailto:info@cre8visions.com" style={{ color: "#10B981" }}>info@cre8visions.com</a> within 7 days and we'll send your money back. No hoops. No attitude. No questions.
              </p>
              <p className="mt-3 text-[0.95rem] leading-[1.75]" style={{ color: "rgba(255,255,255,0.6)" }}>
                We built this to change your situation — not just fill a course library. That's the whole point.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ background: "#16213E", padding: "80px 24px" }}>
          <div className="max-w-[860px] mx-auto px-6">
            <div className="text-center text-[0.75rem] font-bold tracking-[0.14em] uppercase mb-3.5" style={{ color: "#E85BA3" }}>Common Questions</div>
            <h2 className="text-center text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-[1.25] mb-4 tracking-tight">Got questions? We've got answers.</h2>
            <div className="max-w-[680px] mx-auto mt-10">
              {faqData.map((faq, i) => (
                <div key={i} className="overflow-hidden" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div
                    className="flex justify-between items-center py-5 cursor-pointer text-[0.95rem] font-semibold gap-3 transition-colors hover:text-[#E85BA3]"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {faq.q}
                    <span className="shrink-0 text-[1.2rem] transition-transform duration-300" style={{ color: "#D63384", transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                  </div>
                  {openFaq === i && (
                    <div className="pb-5 text-[0.9rem] leading-[1.75]" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden text-center" style={{ background: "linear-gradient(160deg, #0d0d1f, #1e0f3a)", padding: "100px 24px" }}>
          <div className="absolute pointer-events-none" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)" }} />
          <div className="max-w-[860px] mx-auto px-6 relative z-10">
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-black mb-4 tracking-tight">Your story is worth telling.<br />You don't have to show your face to tell it.</h2>
            <p className="max-w-[500px] mx-auto mb-9" style={{ color: "rgba(255,255,255,0.6)" }}>The tools exist. The system works. The only question is: are you going to use it?</p>
            <a href="#pricing" onClick={scrollToPricing} className="inline-block text-white text-[1.1rem] font-bold rounded-full no-underline transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #D63384, #7C3AED)", padding: "18px 48px", boxShadow: "0 8px 32px rgba(214,51,132,0.35)" }}>
              Get The AI Twin Formula — $27 →
            </a>
            <p className="mt-4 text-[0.8rem]" style={{ color: "rgba(255,255,255,0.4)" }}>🔒 Secure checkout &nbsp;·&nbsp; Instant access &nbsp;·&nbsp; 7-day guarantee</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center" style={{ background: "#0d0d1a", padding: "40px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-[1.1rem] font-extrabold mb-2" style={{ background: "linear-gradient(135deg, #E85BA3, #9D65F5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Cre8Visions</div>
          <p className="text-[0.8rem] leading-[1.7]" style={{ color: "rgba(255,255,255,0.4)" }}>
            © 2026 Cre8Visions. All rights reserved.<br />
            <a href="mailto:info@cre8visions.com" className="no-underline hover:underline" style={{ color: "#9D65F5" }}>info@cre8visions.com</a> &nbsp;·&nbsp; <a href="https://cre8visions.com" className="no-underline hover:underline" style={{ color: "#9D65F5" }}>cre8visions.com</a>
          </p>
          <div className="flex justify-center gap-6 mt-4">
            {["Contact", "Privacy Policy", "Terms of Use", "Refund Policy"].map((link) => (
              <a key={link} href={link === "Contact" ? "mailto:info@cre8visions.com" : "#"} className="text-[0.8rem] no-underline hover:text-[#E85BA3]" style={{ color: "rgba(255,255,255,0.6)" }}>{link}</a>
            ))}
          </div>
          <p className="mt-4 text-[0.75rem] max-w-[560px] mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
            Results shown are based on the creator's own experience and may not be typical. Individual results will vary based on effort, experience, and market conditions. This is a digital product — no physical items will be shipped.
          </p>
        </footer>
      </div>
    </>
  );
};

export default AITwinFormula;
