import { Card } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { demoCampaigns } from "./campaignDemoData";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCard {
  label: string;
  value: string;
  change: number;
  sparkline: number[];
}

const cards: MetricCard[] = [
  {
    label: "Active Campaigns",
    value: String(demoCampaigns.filter((c) => c.status === "live" || c.status === "evergreen").length),
    change: 12,
    sparkline: [2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  },
  {
    label: "Total Leads",
    value: demoCampaigns.reduce((s, c) => s + c.leads, 0).toLocaleString(),
    change: 18.4,
    sparkline: [200, 350, 500, 680, 820, 1100, 1400, 1800, 2200, 2800, 3400, 3891],
  },
  {
    label: "Revenue Generated",
    value: "$" + (demoCampaigns.reduce((s, c) => s + c.revenue, 0) / 1000).toFixed(1) + "k",
    change: 24.1,
    sparkline: [5, 8, 12, 18, 25, 35, 48, 62, 78, 95, 110, 136],
  },
  {
    label: "Avg Conversion Rate",
    value: (demoCampaigns.filter((c) => c.conversion_rate > 0).reduce((s, c) => s + c.conversion_rate, 0) / demoCampaigns.filter((c) => c.conversion_rate > 0).length).toFixed(1) + "%",
    change: 2.3,
    sparkline: [3.1, 3.4, 3.8, 4.0, 4.2, 4.5, 4.8, 5.0, 5.2, 5.5, 5.6, 5.6],
  },
];

export default function CampaignOverviewCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
          <div className="flex items-end justify-between mt-1">
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {card.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${card.change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {card.change >= 0 ? "+" : ""}{card.change}%
                </span>
                <span className="text-xs text-muted-foreground">vs prev</span>
              </div>
            </div>
            <div className="w-20 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={card.sparkline.map((v) => ({ v }))}>
                  <defs>
                    <linearGradient id={`grad-${card.label}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    fill={`url(#grad-${card.label})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
