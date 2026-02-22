import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { LabelWithTooltip } from "@/components/ui/info-tooltip";

interface Props {
  data: { campaign: string; clicks: number }[];
}

const ClicksByCampaignChart = ({ data }: Props) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">
        <LabelWithTooltip termKey="clicks-by-campaign">Clicks by Campaign</LabelWithTooltip>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">No campaign data yet</p>
      ) : (
        <div className="h-[200px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="campaign" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="clicks" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}
    </CardContent>
  </Card>
);

export default ClicksByCampaignChart;
