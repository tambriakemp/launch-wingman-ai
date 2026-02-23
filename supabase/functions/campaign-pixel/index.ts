import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// 1x1 transparent GIF
const PIXEL_GIF = Uint8Array.from(atob(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
), c => c.charCodeAt(0));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("c") || url.searchParams.get("campaign_id");

    if (!campaignId) {
      // Return pixel anyway to avoid breaking the page
      return new Response(PIXEL_GIF, {
        headers: { ...corsHeaders, "Content-Type": "image/gif", "Cache-Control": "no-store" },
      });
    }

    // Validate campaign_id is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(campaignId)) {
      return new Response(PIXEL_GIF, {
        headers: { ...corsHeaders, "Content-Type": "image/gif", "Cache-Control": "no-store" },
      });
    }

    // Parse optional params
    const utmSource = (url.searchParams.get("utm_source") || "").slice(0, 200);
    const utmMedium = (url.searchParams.get("utm_medium") || "").slice(0, 200);
    const utmCampaign = (url.searchParams.get("utm_campaign") || "").slice(0, 200);
    const product = (url.searchParams.get("product") || "").slice(0, 200) || null;
    const revenueRaw = url.searchParams.get("revenue");
    const revenue = revenueRaw ? Math.max(0, Math.min(parseFloat(revenueRaw) || 0, 999999999)) : 0;

    // Parse step parameter for funnel tracking
    const stepRaw = url.searchParams.get("step") || url.searchParams.get("s") || null;
    const stepRegex = /^[a-zA-Z0-9_-]{1,50}$/;
    const step = stepRaw && stepRegex.test(stepRaw) ? stepRaw.toLowerCase() : null;

    // Hash IP for dedup without storing PII
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(ip + campaignId));
    const ipHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    const userAgent = (req.headers.get("user-agent") || "").slice(0, 500);
    const referrer = (req.headers.get("referer") || "").slice(0, 1000);

    // Insert conversion using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("campaign_conversions").insert({
      campaign_id: campaignId,
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      product,
      revenue,
      ip_hash: ipHash,
      user_agent: userAgent,
      referrer,
      step,
    });

    // Return 1x1 GIF for <img> pixel, or 200 for fetch/JS calls
    const accept = req.headers.get("accept") || "";
    if (accept.includes("image")) {
      return new Response(PIXEL_GIF, {
        headers: { ...corsHeaders, "Content-Type": "image/gif", "Cache-Control": "no-store" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("Pixel error:", err);
    return new Response(PIXEL_GIF, {
      headers: { ...corsHeaders, "Content-Type": "image/gif", "Cache-Control": "no-store" },
    });
  }
});
