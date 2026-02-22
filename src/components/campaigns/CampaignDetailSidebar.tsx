import { Campaign } from "@/types/campaign";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Link2, Image, GitBranch, BarChart3, StickyNote, ShieldCheck, AlertTriangle, Activity, Target, Calendar, DollarSign, Crosshair } from "lucide-react";
import { demoLinks, goalLabels } from "./campaignDemoData";

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

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border/50 pr-4 space-y-6">
      {/* Campaign Info Cards */}
      <div className="space-y-2 px-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider px-2 mb-2 font-medium">Campaign Info</p>
        <div className="rounded-lg border border-border/60 bg-card p-3 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="w-4 h-4 shrink-0" />
            <span className="text-xs">Goal</span>
          </div>
          <p className="text-sm font-semibold pl-6">{goalLabels[campaign.goal]}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-3 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="text-xs">Date Range</span>
          </div>
          <p className="text-sm font-semibold pl-6">
            {campaign.start_date} → {campaign.end_date ?? "Ongoing"}
          </p>
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

      {/* Health Indicators */}
      <div className="space-y-2 px-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider px-2 mb-1 font-medium">Health</p>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/30">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <p className="text-[13px] text-muted-foreground">Link Health</p>
            <p className="text-sm font-medium">{links.length} Active · 0 Broken</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/30">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <p className="text-[13px] text-muted-foreground">Funnel Drop-Off</p>
            <p className="text-sm font-medium">72% at Lead Capture</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/30">
          <Activity className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <p className="text-[13px] text-muted-foreground">Tracking</p>
            <p className="text-sm font-medium">92% confidence</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
