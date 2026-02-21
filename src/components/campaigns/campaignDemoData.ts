import { Campaign, CampaignLink, CampaignAsset, FunnelStep, CampaignNote } from "@/types/campaign";

export const demoCampaigns: Campaign[] = [
  {
    id: "camp-1",
    name: "Spring Launch 2026",
    goal: "revenue",
    status: "live",
    start_date: "2026-03-01",
    end_date: "2026-04-15",
    budget: 5000,
    tags: ["launch", "q1"],
    leads: 1247,
    revenue: 34500,
    roi: 590,
    conversion_rate: 4.2,
    created_at: "2026-02-15T10:00:00Z",
    updated_at: "2026-02-20T14:30:00Z",
    sparkline_data: [12, 19, 25, 32, 28, 35, 42, 38, 45, 50, 48, 55],
  },
  {
    id: "camp-2",
    name: "Email List Growth Q1",
    goal: "leads",
    status: "evergreen",
    start_date: "2026-01-01",
    end_date: null,
    budget: null,
    tags: ["evergreen", "email"],
    leads: 3891,
    revenue: 0,
    roi: 0,
    conversion_rate: 8.7,
    created_at: "2025-12-20T09:00:00Z",
    updated_at: "2026-02-19T11:00:00Z",
    sparkline_data: [50, 55, 60, 58, 65, 70, 75, 80, 78, 85, 90, 95],
  },
  {
    id: "camp-3",
    name: "Webinar Funnel Beta",
    goal: "leads",
    status: "draft",
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    budget: 2000,
    tags: ["webinar", "beta"],
    leads: 0,
    revenue: 0,
    roi: 0,
    conversion_rate: 0,
    created_at: "2026-02-18T08:00:00Z",
    updated_at: "2026-02-18T08:00:00Z",
    sparkline_data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "camp-4",
    name: "Black Friday Flash",
    goal: "revenue",
    status: "ended",
    start_date: "2025-11-20",
    end_date: "2025-12-02",
    budget: 12000,
    tags: ["flash-sale", "q4"],
    leads: 5612,
    revenue: 89200,
    roi: 643,
    conversion_rate: 6.1,
    created_at: "2025-11-01T10:00:00Z",
    updated_at: "2025-12-05T16:00:00Z",
    sparkline_data: [20, 35, 80, 120, 95, 60, 45, 30, 25, 20, 15, 10],
  },
  {
    id: "camp-5",
    name: "App Install Push",
    goal: "app_installs",
    status: "live",
    start_date: "2026-02-01",
    end_date: "2026-03-31",
    budget: 8000,
    tags: ["app", "mobile"],
    leads: 892,
    revenue: 12400,
    roi: 55,
    conversion_rate: 3.4,
    created_at: "2026-01-25T12:00:00Z",
    updated_at: "2026-02-20T09:15:00Z",
    sparkline_data: [5, 10, 18, 22, 28, 35, 30, 38, 42, 40, 45, 48],
  },
  {
    id: "camp-6",
    name: "Challenge Funnel v2",
    goal: "challenge_signups",
    status: "draft",
    start_date: "2026-05-01",
    end_date: "2026-05-14",
    budget: 3000,
    tags: ["challenge", "funnel"],
    leads: 0,
    revenue: 0,
    roi: 0,
    conversion_rate: 0,
    created_at: "2026-02-20T14:00:00Z",
    updated_at: "2026-02-20T14:00:00Z",
    sparkline_data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
];

export const demoLinks: CampaignLink[] = [
  { id: "link-1", campaign_id: "camp-1", url: "https://example.com/spring", utm_source: "instagram", utm_medium: "social", utm_campaign: "spring-launch-2026", clicks: 4520, leads: 412, revenue: 12800, conversion_rate: 9.1 },
  { id: "link-2", campaign_id: "camp-1", url: "https://example.com/spring-email", utm_source: "email", utm_medium: "newsletter", utm_campaign: "spring-launch-2026", clicks: 8900, leads: 623, revenue: 18200, conversion_rate: 7.0 },
  { id: "link-3", campaign_id: "camp-1", url: "https://example.com/spring-fb", utm_source: "facebook", utm_medium: "paid", utm_campaign: "spring-launch-2026", clicks: 3200, leads: 212, revenue: 3500, conversion_rate: 6.6 },
  { id: "link-4", campaign_id: "camp-1", url: "https://example.com/spring-yt", utm_source: "youtube", utm_medium: "social", utm_campaign: "spring-launch-2026", clicks: 2100, leads: 156, revenue: 4800, conversion_rate: 7.4 },
  { id: "link-5", campaign_id: "camp-4", url: "https://example.com/bf-sale", utm_source: "email", utm_medium: "blast", utm_campaign: "black-friday-flash", clicks: 22000, leads: 3100, revenue: 52000, conversion_rate: 14.1 },
  { id: "link-6", campaign_id: "camp-4", url: "https://example.com/bf-ig", utm_source: "instagram", utm_medium: "story", utm_campaign: "black-friday-flash", clicks: 15000, leads: 2512, revenue: 37200, conversion_rate: 16.7 },
];

export const demoAssets: CampaignAsset[] = [
  { id: "asset-1", campaign_id: "camp-1", name: "Spring Launch Reel", type: "reel", clicks: 3400, leads: 180, revenue: 5200, utm_tag: "spring-reel-1" },
  { id: "asset-2", campaign_id: "camp-1", name: "Email Sequence #1", type: "email", clicks: 8900, leads: 623, revenue: 18200, utm_tag: "spring-email-1" },
  { id: "asset-3", campaign_id: "camp-1", name: "Facebook Ad Set A", type: "ad", clicks: 3200, leads: 212, revenue: 3500, utm_tag: "spring-fb-ad-a" },
  { id: "asset-4", campaign_id: "camp-1", name: "Sales Landing Page", type: "landing_page", clicks: 6800, leads: 890, revenue: 24500, utm_tag: "spring-lp" },
  { id: "asset-5", campaign_id: "camp-1", name: "IG Story Series", type: "reel", clicks: 2200, leads: 95, revenue: 2800, utm_tag: "spring-story-1" },
  { id: "asset-6", campaign_id: "camp-1", name: "YouTube Review Video", type: "reel", clicks: 1800, leads: 78, revenue: 3100, utm_tag: "spring-yt-review" },
  { id: "asset-7", campaign_id: "camp-4", name: "BF Countdown Reel", type: "reel", clicks: 12000, leads: 1800, revenue: 28000, utm_tag: "bf-countdown" },
  { id: "asset-8", campaign_id: "camp-4", name: "BF Email Blast", type: "email", clicks: 22000, leads: 3100, revenue: 52000, utm_tag: "bf-email-blast" },
];

export const demoFunnelSteps: FunnelStep[] = [
  { name: "Landing Page", visitors: 12400, conversion_pct: 42, dropoff_pct: 58 },
  { name: "Lead Capture", visitors: 5208, conversion_pct: 28, dropoff_pct: 72 },
  { name: "Checkout", visitors: 1458, conversion_pct: 64, dropoff_pct: 36 },
  { name: "Upsell", visitors: 933, conversion_pct: 38, dropoff_pct: 62 },
];

export const demoNotes: CampaignNote[] = [
  { id: "note-1", campaign_id: "camp-1", content: "Initial launch performance exceeding expectations. Email channel driving the highest ROI.", created_at: "2026-03-05T10:00:00Z", author: "Sarah Chen" },
  { id: "note-2", campaign_id: "camp-1", content: "Adjusted Facebook ad targeting after first week — CPA was too high.", created_at: "2026-03-08T14:30:00Z", author: "Marcus Lee" },
  { id: "note-3", campaign_id: "camp-1", content: "YouTube traffic quality is strong. 7.4% CVR despite lower volume. Consider increasing spend.", created_at: "2026-03-12T09:15:00Z", author: "Sarah Chen" },
  { id: "note-4", campaign_id: "camp-4", content: "Best Black Friday we've ever had. Email list was the #1 driver. Need to double down on list building for next year.", created_at: "2025-12-03T09:00:00Z", author: "Sarah Chen" },
];

// Weekly traffic data for analytics charts
export const demoWeeklyTraffic = [
  { week: "W1", traffic: 1200, leads: 80, revenue: 2400 },
  { week: "W2", traffic: 1850, leads: 145, revenue: 4200 },
  { week: "W3", traffic: 2400, leads: 210, revenue: 6800 },
  { week: "W4", traffic: 3100, leads: 320, revenue: 9500 },
  { week: "W5", traffic: 2800, leads: 280, revenue: 7200 },
  { week: "W6", traffic: 3500, leads: 390, revenue: 11800 },
];

// Attribution table data
export const demoAttribution = [
  { source: "email", medium: "newsletter", content: "sequence-1", clicks: 8900, leads: 623, revenue: 18200, conversion: 7.0 },
  { source: "instagram", medium: "social", content: "reel-1", clicks: 4520, leads: 412, revenue: 12800, conversion: 9.1 },
  { source: "facebook", medium: "paid", content: "ad-set-a", clicks: 3200, leads: 212, revenue: 3500, conversion: 6.6 },
  { source: "youtube", medium: "social", content: "review-1", clicks: 2100, leads: 156, revenue: 4800, conversion: 7.4 },
];

export const goalLabels: Record<string, string> = {
  revenue: "Revenue",
  leads: "Leads",
  app_installs: "App Installs",
  challenge_signups: "Challenge Signups",
};

export const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  live: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  evergreen: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ended: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};
