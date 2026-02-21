export type CampaignStatus = "draft" | "live" | "evergreen" | "ended";
export type CampaignGoal = "revenue" | "leads" | "app_installs" | "challenge_signups";

export interface Campaign {
  id: string;
  name: string;
  goal: CampaignGoal;
  status: CampaignStatus;
  start_date: string;
  end_date: string | null;
  budget: number | null;
  owner: string;
  tags: string[];
  leads: number;
  revenue: number;
  roi: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
  sparkline_data: number[];
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
