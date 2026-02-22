import { Card } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Campaign } from "@/types/campaign";

interface Props {
  campaigns: Campaign[];
}

export default function CampaignOverviewCards({ campaigns }: Props) {
  const activeCampaigns = campaigns.filter((c) => c.status === "live" || c.status === "evergreen").length;
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const withConversion = campaigns.filter((c) => c.conversion_rate > 0);
  const avgConversion = withConversion.length > 0
    ? withConversion.reduce((s, c) => s + c.conversion_rate, 0) / withConversion.length
    : 0;

  const cards = [
    {
      label: "Active Campaigns",
      value: String(activeCampaigns),
      sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, activeCampaigns],
    },
    {
      label: "Total Leads",
      value: totalLeads.toLocaleString(),
      sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, totalLeads],
    },
    {
      label: "Revenue Generated",
      value: "$" + (totalRevenue >= 1000 ? (totalRevenue / 1000).toFixed(1) + "k" : totalRevenue.toLocaleString()),
      sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, totalRevenue],
    },
    {
      label: "Avg Conversion Rate",
      value: avgConversion > 0 ? avgConversion.toFixed(1) + "%" : "—",
      sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, avgConversion],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
          <div className="flex items-end justify-between mt-1">
            <p className="text-2xl font-bold">{card.value}</p>
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
