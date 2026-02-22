import { useState } from "react";
import { Campaign } from "@/types/campaign";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Link2, Image, GitBranch, BarChart3, StickyNote, Target, Calendar, DollarSign, Crosshair, Pencil, Check, X } from "lucide-react";
import { demoLinks, goalLabels } from "./campaignDemoData";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  campaign: Campaign;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "summary", label: "Summary", icon: LayoutDashboard },
  { id: "links", label: "Links", icon: Link2 },
  { id: "pixel", label: "Pixel", icon: Crosshair },
  { id: "assets", label: "Assets", icon: Image },
  { id: "funnel", label: "Funnel", icon: GitBranch },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "notes", label: "Notes", icon: StickyNote },
];

export default function CampaignDetailSidebar({ campaign, activeTab, onTabChange }: Props) {
  const links = demoLinks.filter((l) => l.campaign_id === campaign.id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingGoalTarget, setEditingGoalTarget] = useState(false);
  const [goalTargetValue, setGoalTargetValue] = useState(String(campaign.goal_target || ""));

  // Fetch real data for goal progress
  const { data: utmLinks } = useQuery({
    queryKey: ["sidebar-utm-links", campaign.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("utm_links")
        .select("click_count")
        .eq("campaign_id", campaign.id)
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user?.id && !!campaign.id,
  });

  const { data: conversions } = useQuery({
    queryKey: ["sidebar-conversions", campaign.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("campaign_conversions")
        .select("revenue")
        .eq("campaign_id", campaign.id);
      return data || [];
    },
    enabled: !!campaign.id,
  });

  const totalLeads = conversions?.length || 0;
  const totalRevenue = conversions?.reduce((s, c) => s + (Number(c.revenue) || 0), 0) || 0;
  const goalTarget = campaign.goal_target > 0 ? campaign.goal_target : 0;
  const goalCurrent = campaign.goal === "revenue" ? totalRevenue : totalLeads;
  const goalPct = goalTarget > 0 ? Math.min(100, (goalCurrent / goalTarget) * 100) : 0;

  const saveGoalTarget = async () => {
    const val = parseFloat(goalTargetValue);
    if (!val || val <= 0) { toast.error("Enter a valid target"); return; }
    const { error } = await supabase.from("campaigns").update({ goal_target: val }).eq("id", campaign.id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Goal target updated");
    setEditingGoalTarget(false);
    queryClient.invalidateQueries({ queryKey: ["campaign-detail", campaign.id] });
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border/50 pr-4 space-y-6">
      {/* Campaign Info Cards */}
      <div className="space-y-2 px-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider px-2 mb-2 font-medium">Campaign Info</p>
        <div className="rounded-lg border border-border/60 bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-4 h-4 shrink-0" />
              <span className="text-xs">Goal</span>
            </div>
            {!editingGoalTarget && (
              <button onClick={() => { setGoalTargetValue(String(campaign.goal_target || "")); setEditingGoalTarget(true); }} className="text-muted-foreground hover:text-foreground">
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-sm font-semibold pl-6">{goalLabels[campaign.goal]}</p>
          {editingGoalTarget ? (
            <div className="flex items-center gap-1.5 pl-6">
              <Input
                type="number"
                value={goalTargetValue}
                onChange={(e) => setGoalTargetValue(e.target.value)}
                className="h-7 text-sm px-2"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveGoalTarget()}
              />
              <button onClick={saveGoalTarget} className="text-emerald-600 hover:text-emerald-700"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditingGoalTarget(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between pl-6">
                <span className="text-sm font-semibold">
                  {campaign.goal === "revenue" ? `$${goalCurrent.toLocaleString()}` : goalCurrent.toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  / {goalTarget > 0 ? (campaign.goal === "revenue" ? `$${goalTarget.toLocaleString()}` : goalTarget.toLocaleString()) : "Not set"}
                </span>
              </div>
              {goalTarget > 0 && (
                <div className="pl-6 space-y-1">
                  <Progress value={goalPct} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground text-right">{goalPct.toFixed(0)}%</p>
                </div>
              )}
            </>
          )}
        </div>
        {campaign.budget && (
          <div className="rounded-lg border border-border/60 bg-card p-3 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4 shrink-0" />
              <span className="text-xs">Budget</span>
            </div>
            <p className="text-sm font-semibold pl-6">${campaign.budget.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[15px] transition-colors text-left",
                isActive
                  ? "bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-px"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

    </aside>
  );
}
