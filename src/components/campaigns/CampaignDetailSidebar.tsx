import { Campaign } from "@/types/campaign";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Link2, Image, GitBranch, BarChart3, StickyNote, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { demoLinks } from "./campaignDemoData";

interface Props {
  campaign: Campaign;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "summary", label: "Summary", icon: LayoutDashboard },
  { id: "links", label: "Links", icon: Link2 },
  { id: "assets", label: "Assets", icon: Image },
  { id: "funnel", label: "Funnel", icon: GitBranch },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "notes", label: "Notes", icon: StickyNote },
];

export default function CampaignDetailSidebar({ campaign, activeTab, onTabChange }: Props) {
  const links = demoLinks.filter((l) => l.campaign_id === campaign.id);
  const totalTraffic = links.reduce((s, l) => s + l.clicks, 0);
  const totalLeads = campaign.leads || links.reduce((s, l) => s + l.leads, 0);
  const totalRevenue = campaign.revenue || links.reduce((s, l) => s + l.revenue, 0);
  const cvr = totalTraffic > 0 ? ((totalLeads / totalTraffic) * 100).toFixed(1) : "0";

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/50 pr-4 space-y-6">
      {/* Navigation */}
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left",
                isActive
                  ? "bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-px"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 mb-2">Quick Stats</p>
        <div className="grid grid-cols-2 gap-2 px-1">
          <div className="rounded-md bg-muted/40 p-2.5">
            <p className="text-[10px] text-muted-foreground">Traffic</p>
            <p className="text-sm font-bold">{totalTraffic.toLocaleString()}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-2.5">
            <p className="text-[10px] text-muted-foreground">Leads</p>
            <p className="text-sm font-bold">{totalLeads.toLocaleString()}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-2.5">
            <p className="text-[10px] text-muted-foreground">Revenue</p>
            <p className="text-sm font-bold">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-2.5">
            <p className="text-[10px] text-muted-foreground">CVR</p>
            <p className="text-sm font-bold">{cvr}%</p>
          </div>
        </div>
      </div>

      {/* Health Indicators */}
      <div className="space-y-2 px-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 mb-1">Health</p>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-[11px] text-muted-foreground">Link Health</p>
            <p className="text-xs font-medium">{links.length} Active · 0 Broken</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <div>
            <p className="text-[11px] text-muted-foreground">Funnel Drop-Off</p>
            <p className="text-xs font-medium">72% at Lead Capture</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30">
          <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <div>
            <p className="text-[11px] text-muted-foreground">Tracking</p>
            <p className="text-xs font-medium">92% confidence</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
