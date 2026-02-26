import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, startOfDay, format, getDay, getHours } from "date-fns";

export type DateRange = "7d" | "30d" | "90d" | "all";

export interface UtmLink {
  id: string;
  label: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  click_count: number;
  short_code: string;
  base_url: string;
}

export interface ClickEvent {
  id: string;
  utm_link_id: string;
  clicked_at: string;
  referrer: string | null;
  user_agent: string | null;
}

export interface ConversionEvent {
  id: string;
  campaign_id: string;
  created_at: string;
  revenue: number | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

// ── Parsing helpers ──

export function parseDevice(ua: string | null): string {
  if (!ua) return "Unknown";
  const lower = ua.toLowerCase();
  if (/tablet|ipad/i.test(lower)) return "Tablet";
  if (/mobile|android|iphone|ipod/i.test(lower)) return "Mobile";
  return "Desktop";
}

export function parseBrowser(ua: string | null): string {
  if (!ua) return "Unknown";
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Other";
}

export function parseReferrerDomain(referrer: string | null): string {
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Direct";
  }
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getRangeStart(range: DateRange): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return startOfDay(subDays(new Date(), days));
}

export function useCampaignAnalytics(dateRange: DateRange, campaignId?: string | null) {
  const { user } = useAuth();

  const linksQuery = useQuery({
    queryKey: ["utm-links-analytics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_links")
        .select("id, label, utm_source, utm_medium, utm_campaign, click_count, short_code, base_url, campaign_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data || []) as (UtmLink & { campaign_id: string | null })[];
    },
    enabled: !!user,
  });

  // Fetch campaigns for the filter dropdown
  const campaignsQuery = useQuery({
    queryKey: ["campaigns-for-analytics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return (data || []) as { id: string; name: string }[];
    },
    enabled: !!user,
  });

  // Filter links by campaign if selected
  const allLinks = linksQuery.data || [];
  const filteredLinks = campaignId
    ? allLinks.filter((l) => l.campaign_id === campaignId)
    : allLinks;

  const eventsQuery = useQuery({
    queryKey: ["utm-click-events", user?.id, dateRange],
    queryFn: async () => {
      const rangeStart = getRangeStart(dateRange);
      const linkIds = allLinks.map((l) => l.id);
      if (linkIds.length === 0) return [] as ClickEvent[];

      let query = supabase
        .from("utm_click_events")
        .select("id, utm_link_id, clicked_at, referrer, user_agent")
        .in("utm_link_id", linkIds)
        .order("clicked_at", { ascending: true });

      if (rangeStart) {
        query = query.gte("clicked_at", rangeStart.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ClickEvent[];
    },
    enabled: !!user && !!linksQuery.data,
  });

  // ── Referral source data ──
  const referralsQuery = useQuery({
    queryKey: ["referral-sources-analytics", user?.id, dateRange],
    queryFn: async () => {
      const rangeStart = getRangeStart(dateRange);
      let query = supabase
        .from("profiles")
        .select("ref_source, created_at")
        .not("ref_source", "is", null);
      if (rangeStart) {
        query = query.gte("created_at", rangeStart.toISOString());
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as { ref_source: string; created_at: string }[];
    },
    enabled: !!user,
  });

  // ── Conversion data ──
  const conversionsQuery = useQuery({
    queryKey: ["campaign-conversions-analytics", user?.id, dateRange, campaignId],
    queryFn: async () => {
      const rangeStart = getRangeStart(dateRange);
      const campaignIds = campaignId
        ? [campaignId]
        : (campaignsQuery.data || []).map((c) => c.id);

      if (campaignIds.length === 0) return [] as ConversionEvent[];

      let query = supabase
        .from("campaign_conversions")
        .select("id, campaign_id, created_at, revenue, referrer, utm_source, utm_medium, utm_campaign")
        .in("campaign_id", campaignIds)
        .order("created_at", { ascending: true });

      if (rangeStart) {
        query = query.gte("created_at", rangeStart.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ConversionEvent[];
    },
    enabled: !!user && !!campaignsQuery.data,
  });

  const links = filteredLinks;
  const filteredLinkIds = new Set(links.map((l) => l.id));
  const allEvents = eventsQuery.data || [];
  const events = allEvents.filter((e) => filteredLinkIds.has(e.utm_link_id));
  const conversions = conversionsQuery.data || [];

  // ── Derived click data ──

  const totalClicks = events.length;

  // Clicks per link
  const clicksByLink = links
    .map((link) => ({
      id: link.id,
      label: link.label,
      clicks: events.filter((e) => e.utm_link_id === link.id).length,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const topLink = clicksByLink[0] || null;

  // Clicks over time (by day)
  const clicksByDay: Record<string, number> = {};
  events.forEach((e) => {
    const day = format(new Date(e.clicked_at), "yyyy-MM-dd");
    clicksByDay[day] = (clicksByDay[day] || 0) + 1;
  });
  const clicksOverTime = Object.entries(clicksByDay)
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build per-link clicks over time for link filter
  const buildClicksOverTimeForLink = (linkId: string) => {
    const byDay: Record<string, number> = {};
    allEvents
      .filter((e) => e.utm_link_id === linkId)
      .forEach((e) => {
        const day = format(new Date(e.clicked_at), "yyyy-MM-dd");
        byDay[day] = (byDay[day] || 0) + 1;
      });
    return Object.entries(byDay)
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Traffic sources
  const referrerCounts: Record<string, number> = {};
  events.forEach((e) => {
    const domain = parseReferrerDomain(e.referrer);
    referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
  });
  const trafficSources = Object.entries(referrerCounts)
    .map(([source, clicks]) => ({ source, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  const uniqueSourceCount = Object.keys(referrerCounts).length;

  // Clicks by campaign
  const campaignCounts: Record<string, number> = {};
  events.forEach((e) => {
    const link = allLinks.find((l) => l.id === e.utm_link_id);
    if (link) {
      campaignCounts[link.utm_campaign] = (campaignCounts[link.utm_campaign] || 0) + 1;
    }
  });
  const clicksByCampaign = Object.entries(campaignCounts)
    .map(([campaign, clicks]) => ({ campaign, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  // Clicks by source/medium
  const sourceMediumCounts: Record<string, number> = {};
  events.forEach((e) => {
    const link = allLinks.find((l) => l.id === e.utm_link_id);
    if (link) {
      const key = `${link.utm_source} / ${link.utm_medium}`;
      sourceMediumCounts[key] = (sourceMediumCounts[key] || 0) + 1;
    }
  });
  const clicksBySourceMedium = Object.entries(sourceMediumCounts)
    .map(([label, clicks]) => ({ label, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  // Click timing - day of week
  const dayOfWeekCounts = Array(7).fill(0);
  events.forEach((e) => {
    dayOfWeekCounts[getDay(new Date(e.clicked_at))]++;
  });
  const clicksByDayOfWeek = DAY_NAMES.map((name, i) => ({ day: name, clicks: dayOfWeekCounts[i] }));

  // Click timing - hour of day
  const hourCounts = Array(24).fill(0);
  events.forEach((e) => {
    hourCounts[getHours(new Date(e.clicked_at))]++;
  });
  const clicksByHour = hourCounts.map((clicks, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    clicks,
  }));

  // Device breakdown
  const deviceCounts: Record<string, number> = {};
  events.forEach((e) => {
    const device = parseDevice(e.user_agent);
    deviceCounts[device] = (deviceCounts[device] || 0) + 1;
  });
  const deviceBreakdown = Object.entries(deviceCounts)
    .map(([device, clicks]) => ({ device, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  // Browser breakdown
  const browserCounts: Record<string, number> = {};
  events.forEach((e) => {
    const browser = parseBrowser(e.user_agent);
    browserCounts[browser] = (browserCounts[browser] || 0) + 1;
  });
  const browserBreakdown = Object.entries(browserCounts)
    .map(([browser, clicks]) => ({ browser, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  // ── Derived referral data ──
  const referralProfiles = referralsQuery.data || [];
  const referralCounts: Record<string, number> = {};
  referralProfiles.forEach((p) => {
    referralCounts[p.ref_source] = (referralCounts[p.ref_source] || 0) + 1;
  });
  const referralSignups = Object.entries(referralCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
  const totalReferralSignups = referralProfiles.length;

  // ── Derived conversion data ──

  const totalConversions = conversions.length;
  const totalRevenue = conversions.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  // Conversions over time (by day)
  const conversionsByDay: Record<string, { conversions: number; revenue: number }> = {};
  conversions.forEach((c) => {
    const day = format(new Date(c.created_at), "yyyy-MM-dd");
    if (!conversionsByDay[day]) conversionsByDay[day] = { conversions: 0, revenue: 0 };
    conversionsByDay[day].conversions++;
    conversionsByDay[day].revenue += c.revenue || 0;
  });
  const conversionsOverTime = Object.entries(conversionsByDay)
    .map(([date, vals]) => ({ date, conversions: vals.conversions, revenue: vals.revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    isLoading: linksQuery.isLoading || eventsQuery.isLoading || conversionsQuery.isLoading || referralsQuery.isLoading,
    totalClicks,
    topLink,
    uniqueSourceCount,
    clicksOverTime,
    clicksByLink: clicksByLink.slice(0, 10),
    trafficSources,
    clicksByCampaign,
    clicksBySourceMedium,
    clicksByDayOfWeek,
    clicksByHour,
    deviceBreakdown,
    browserBreakdown,
    campaigns: campaignsQuery.data || [],
    availableLinks: clicksByLink,
    buildClicksOverTimeForLink,
    // Conversion metrics
    totalConversions,
    totalRevenue,
    conversionRate,
    conversionsOverTime,
    // Referral metrics
    referralSignups,
    totalReferralSignups,
  };
}
