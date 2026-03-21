export type CampaignStatus = "draft" | "live" | "evergreen" | "ended";
export type CampaignGoal = "revenue" | "leads" | "webinar_signups" | "course_enrollments" | "challenge_signups" | "followers" | "app_installs" | "traffic";

export interface Campaign {
  id: string;
  name: string;
  goal: CampaignGoal;
  status: CampaignStatus;
  start_date: string;
  end_date: string | null;
  budget: number | null;
  tags: string[];
  leads: number;
  revenue: number;
  roi: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
  sparkline_data: number[];
  goal_target: number;
}

export interface CampaignLink {
  id: string;
  campaign_id: string;
  url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  clicks: number;
  leads: number;
  revenue: number;
  conversion_rate: number;
}

export interface CampaignUTMLink {
  id: string;
  campaign_id: string | null;
  label: string;
  base_url: string;
  full_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string | null;
  utm_term: string | null;
  short_code: string;
  channel: string;
  status: string;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignAsset {
  id: string;
  campaign_id: string;
  name: string;
  type: "reel" | "email" | "ad" | "landing_page";
  clicks: number;
  leads: number;
  revenue: number;
  utm_tag: string;
}

export interface FunnelStep {
  name: string;
  visitors: number;
  conversion_pct: number;
  dropoff_pct: number;
}

export interface CampaignNote {
  id: string;
  campaign_id: string;
  content: string;
  created_at: string;
  author: string;
}
